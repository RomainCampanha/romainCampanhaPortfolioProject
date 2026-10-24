import { createHash, createHmac } from "node:crypto";
import { chatKey } from "./secret";

// Limitation de débit du chat (module serveur uniquement) : par visiteur (minute) + plafond
// global (jour, garde-fou budget).
//
// - Compteurs PARTAGÉS (toutes les instances Vercel, survivent aux démarrages à froid) dans
//   un Redis Upstash, via son API REST (pas de dépendance) : UPSTASH_REDIS_REST_URL/TOKEN,
//   ou KV_REST_API_URL/TOKEN (noms posés par l'intégration Upstash du Marketplace Vercel).
//   Un script Lua rend chaque requête atomique (INCR + expiration + plafonds).
// - Sans Redis : compteurs en mémoire, pour le développement et les tests uniquement. En
//   production Vercel (VERCEL_ENV=production), sans Redis ou si Redis ne répond pas, le chat
//   est coupé (fail closed : le budget passe avant la disponibilité).
// - Les IP ne sont jamais stockées en clair (HMAC) ; une IPv6 compte pour son /64, car un
//   visiteur peut changer d'adresse à volonté dans son préfixe.
//
// À configurer EN PLUS avant la mise en ligne (voir README, "Mise en production") :
//   1. OpenAI : plafond de dépenses sur le projet de la clé (le seul plafond dur) ;
//   2. Vercel Firewall : règle de rate limiting sur POST /api/chat.

const MINUTE_MS = 60_000;
/** Durée de vie du compteur quotidien (s) : 2 jours, largement au-delà de minuit. */
const DAY_TTL_S = 172_800;
const REDIS_TIMEOUT_MS = 2_000;
/** Borne mémoire du mode local : au-delà, on oublie les visiteurs les plus anciens. */
const MAX_TRACKED_KEYS = 5_000;

export type ChatLimits = { perMinute: number; perDay: number };

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
  | { ok: false; reason: "daily_limit" }
  | { ok: false; reason: "unavailable" };

/** Jour courant (AAAA-MM-JJ) à Genève : le plafond quotidien repart à minuit local. */
function currentDay(now: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(now);
}

/* ------------------------------------------------------------------ */
/* Identité du visiteur                                               */
/* ------------------------------------------------------------------ */

/**
 * IP du client. Sur Vercel, x-forwarded-for est réécrit par la plateforme
 * (pas falsifiable par le client) ; en local, on retombe sur "local".
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "local";
}

/** Développe une IPv6 en 8 groupes de 4 chiffres hexa (null si invalide). */
function expandIpv6(ip: string): string[] | null {
  let address = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  // IPv4 en fin d'adresse (::ffff:1.2.3.4) -> 2 groupes hexa
  const v4 = address.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    if ([a, b, c, d].some((n) => n > 255)) return null;
    const hex = (hi: number, lo: number) => ((hi << 8) | lo).toString(16);
    address = `${address.slice(0, v4.index)}${hex(a, b)}:${hex(c, d)}`;
  }
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => g.padStart(4, "0"));
}

/**
 * Clé de limitation d'un visiteur : l'IPv4 telle quelle, le préfixe /64 d'une IPv6
 * (une IPv4 encapsulée ::ffff:a.b.c.d redevient a.b.c.d).
 */
export function rateLimitSubject(ip: string): string {
  if (!ip.includes(":")) return ip.slice(0, 64);
  const groups = expandIpv6(ip);
  if (!groups) return ip.slice(0, 64);
  const mapped = groups.slice(0, 5).every((g) => g === "0000") && groups[5] === "ffff";
  if (mapped) {
    const n = (g: string) => [parseInt(g.slice(0, 2), 16), parseInt(g.slice(2), 16)];
    return [...n(groups[6]), ...n(groups[7])].join(".");
  }
  return `${groups.slice(0, 4).join(":")}::/64`;
}

/** Empreinte du visiteur (jamais l'IP en clair dans le stockage). */
function subjectKey(ip: string): string {
  const subject = rateLimitSubject(ip);
  const key = chatKey("ip-hash");
  const digest = key
    ? createHmac("sha256", key).update(subject).digest("base64url")
    : createHash("sha256").update(subject).digest("base64url");
  return digest.slice(0, 32);
}

/* ------------------------------------------------------------------ */
/* Stockage partagé : Redis Upstash (API REST)                        */
/* ------------------------------------------------------------------ */

type RedisConfig = { url: string; token: string };

function getRedisConfig(): RedisConfig | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)?.trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)?.trim();
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

/**
 * Atomique côté Redis. KEYS[1] = visiteur, KEYS[2] = jour.
 * ARGV : fenêtre visiteur (ms), limite/minute, durée du compteur jour (s), limite/jour.
 * Retour : {0, 0} ok | {1, ttl ms} trop de requêtes | {2, 0} plafond du jour atteint.
 * Une requête refusée par visiteur ne compte pas dans le plafond du jour.
 */
const QUOTA_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if redis.call('PTTL', KEYS[1]) < 0 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
if hits > tonumber(ARGV[2]) then return {1, redis.call('PTTL', KEYS[1])} end
local day = redis.call('INCR', KEYS[2])
if redis.call('TTL', KEYS[2]) < 0 then redis.call('EXPIRE', KEYS[2], ARGV[3]) end
if day > tonumber(ARGV[4]) then return {2, 0} end
return {0, 0}
`;

async function consumeInRedis(
  config: RedisConfig,
  subject: string,
  { perMinute, perDay }: ChatLimits,
  now: number,
): Promise<RateLimitResult> {
  const keys = [`rominou:chat:visitor:${subject}`, `rominou:chat:day:${currentDay(now)}`];
  const args = [MINUTE_MS, perMinute, DAY_TTL_S, perDay].map(String);
  const response = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", QUOTA_SCRIPT, "2", ...keys, ...args]),
    signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as { result?: unknown } | null;
  const result = body?.result;
  if (!response.ok || !Array.isArray(result)) throw new Error(`redis_${response.status}`);

  const [code, ttlMs] = result.map(Number);
  if (code === 1) {
    return { ok: false, reason: "rate_limited", retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)) };
  }
  if (code === 2) return { ok: false, reason: "daily_limit" };
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Repli en mémoire (développement, tests)                            */
/* ------------------------------------------------------------------ */

/** Visiteur -> horodatages (ms) des requêtes de la dernière minute. */
const hitsBySubject = new Map<string, number[]>();
let daily = { day: "", count: 0 };

function consumeInMemory(subject: string, { perMinute, perDay }: ChatLimits, now: number): RateLimitResult {
  const day = currentDay(now);
  if (daily.day !== day) daily = { day, count: 0 };
  if (daily.count >= perDay) return { ok: false, reason: "daily_limit" };

  // Fenêtre glissante d'une minute ; seule une requête acceptée est enregistrée.
  const recent = (hitsBySubject.get(subject) ?? []).filter((t) => now - t < MINUTE_MS);
  if (recent.length >= perMinute) {
    hitsBySubject.set(subject, recent);
    const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] + MINUTE_MS - now) / 1000));
    return { ok: false, reason: "rate_limited", retryAfterSeconds };
  }
  recent.push(now);
  hitsBySubject.delete(subject); // ré-insertion : la Map reste triée du plus ancien au plus récent
  hitsBySubject.set(subject, recent);
  if (hitsBySubject.size > MAX_TRACKED_KEYS) {
    const oldest = hitsBySubject.keys().next().value;
    if (oldest !== undefined) hitsBySubject.delete(oldest);
  }

  daily.count += 1;
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* API                                                                */
/* ------------------------------------------------------------------ */

let warnedMissingStore = false;

/**
 * Compte une requête du visiteur `ip` (y compris les relances automatiques après un
 * outil, qui appellent aussi le modèle) et dit si elle peut passer.
 */
export async function consumeChatQuota(
  ip: string,
  limits: ChatLimits,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  const subject = subjectKey(ip);
  const redis = getRedisConfig();

  if (redis) {
    try {
      return await consumeInRedis(redis, subject, limits, now);
    } catch (error) {
      console.error("[chat] rate limit store failed:", error instanceof Error ? error.message : "unknown");
      return { ok: false, reason: "unavailable" };
    }
  }

  if (process.env.VERCEL_ENV === "production") {
    if (!warnedMissingStore) {
      warnedMissingStore = true;
      console.error("[chat] UPSTASH_REDIS_REST_URL/TOKEN missing: chat disabled in production.");
    }
    return { ok: false, reason: "unavailable" };
  }

  return consumeInMemory(subject, limits, now);
}
