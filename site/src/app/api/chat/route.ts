import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from "ai";
import { routing } from "@/i18n/routing";
import { checkChatBot } from "@/lib/chat/bot-check";
import { CHAT_LIMITS, type ChatErrorCode } from "@/lib/chat/constants";
import { getChatEnv } from "@/lib/chat/env";
import { consumeChatQuota, getClientIp } from "@/lib/chat/rate-limit";
import { chatRequestSchema } from "@/lib/chat/request-schema";
import { chatKey } from "@/lib/chat/secret";
import { signResponseStream, verifyHistory } from "@/lib/chat/signature";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { chatTools, type ChatTools, type ChatUIMessage } from "@/lib/chat/tools";
import { SITE_URL } from "@/lib/site-url";

// POST /api/chat — "la version IA de Romain" (AI SDK 7 + OpenAI).
// Seule la méthode POST est exportée : Next répond 405 aux autres.
//
// Ordre des garde-fous (du moins cher au plus cher) :
//   1. même origine + Content-Type JSON                -> 403 / 415
//   2. corps JSON valide (taille, schéma zod)          -> 400 / 413
//   3. clé OpenAI configurée                           -> 503 chat_unavailable
//   4. historique signé (tours assistant vérifiés)     -> 400 si relance forgée
//   5. Vercel BotID                                    -> 403 / 503
//   6. limites partagées (visiteur/minute, global/jour) -> 429 (503 si stockage absent en prod)
// Budget : ~2 800 tokens de prompt (mis en cache par OpenAI) + historique (<= 6 000 caractères)
// + 350 tokens de sortie max. Mesuré le 2026-10-24 avec gpt-6-luna (~50 tokens de sortie en
// moyenne) : ≈ 0,0004 $ par requête à froid (écriture du cache), ≈ 0,0001 $ avec le cache,
// soit au pire ~6 $/mois au plafond de 500 requêtes/jour.
// Ce plafond est appliqué par le compteur partagé (rate-limit.ts) ; le plafond DUR reste le
// budget du projet OpenAI (étape obligatoire de mise en ligne, voir README).

// Cache Components est désactivé (next.config.ts) : si on l'active, retirer `runtime`.
export const runtime = "nodejs";
export const maxDuration = 30;

function jsonError(code: ChatErrorCode, status: number, headers?: HeadersInit): Response {
  return Response.json({ error: code }, { status, headers });
}

/**
 * Requête émise par une page du site : l'Origin (envoyé par tout navigateur sur un POST)
 * doit être ce site. Sans Origin (client non navigateur), BotID et les limites s'appliquent.
 */
function isSameOrigin(req: Request): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (origin === null) return true;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false; // ex. "null" (iframe sandbox, fichier local)
  }
  const allowed = [req.headers.get("x-forwarded-host"), req.headers.get("host"), new URL(SITE_URL).host];
  return allowed.includes(host);
}

/** Exige application/json : un POST cross-origin "simple" (text/plain…) est refusé. */
function isJson(req: Request): boolean {
  const type = req.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  return type === "application/json";
}

export async function POST(req: Request): Promise<Response> {
  // 1. Origine et type de contenu
  if (!isSameOrigin(req)) return jsonError("forbidden", 403);
  if (!isJson(req)) return jsonError("invalid_request", 415);

  // 2. Lecture bornée + validation du corps
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > CHAT_LIMITS.maxBodyBytes) return jsonError("payload_too_large", 413);
  const raw = await req.text().catch(() => null);
  if (raw === null) return jsonError("invalid_request", 400);
  if (new TextEncoder().encode(raw).byteLength > CHAT_LIMITS.maxBodyBytes) {
    return jsonError("payload_too_large", 413);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return jsonError("invalid_request", 400);
  }

  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) return jsonError("invalid_request", 400);

  // 3. Clé API absente : chat désactivé proprement
  const env = getChatEnv();
  const signingKey = chatKey("history-signature");
  if (!env.apiKey || !signingKey) return jsonError("chat_unavailable", 503);

  // 4. Seuls les tours assistant signés par ce serveur atteignent le modèle
  const history = verifyHistory(signingKey, parsed.data.messages);
  if (!history) return jsonError("invalid_request", 400);

  let messages: ChatUIMessage[];
  try {
    // Seconde passe AI SDK : structure des parts + entrées/sorties des outils
    messages = await validateUIMessages<ChatUIMessage>({
      messages: history.messages,
      tools: chatTools,
    });
  } catch {
    return jsonError("invalid_request", 400);
  }

  // 5. Protection anti-bot
  const bot = await checkChatBot();
  if (bot === "bot") return jsonError("forbidden", 403);
  if (bot === "unavailable") return jsonError("chat_unavailable", 503);

  // 6. Limites de débit partagées
  const quota = await consumeChatQuota(getClientIp(req.headers), {
    perMinute: env.ratePerMinute,
    perDay: env.dailyGlobalLimit,
  });
  if (!quota.ok) {
    switch (quota.reason) {
      case "rate_limited":
        return jsonError("rate_limited", 429, { "Retry-After": String(quota.retryAfterSeconds) });
      case "daily_limit":
        return jsonError("daily_limit", 429);
      case "unavailable":
        return jsonError("chat_unavailable", 503);
    }
  }

  const locale = parsed.data.locale ?? routing.defaultLocale;
  const page = parsed.data.page ?? "chat";
  // Relance automatique après un outil client : on demande juste le texte
  // (pas de nouvel appel d'outil -> pas de boucle).
  const isToolFollowUp = history.previous !== null;

  try {
    const openai = createOpenAI({ apiKey: env.apiKey });

    const result = streamText({
      model: openai(env.model),
      instructions: buildSystemPrompt({ locale, page, toolFollowUp: isToolFollowUp }),
      messages: await convertToModelMessages(messages, {
        tools: chatTools,
        ignoreIncompleteToolCalls: true,
      }),
      tools: chatTools,
      toolChoice: isToolFollowUp ? "none" : "auto",
      maxOutputTokens: 350,
      temperature: 0.5,
      // Pas de raisonnement : réponses rapides, budget de sortie intact, temperature permise
      reasoning: "none",
      maxRetries: 1,
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          // Pas de stockage des réponses côté OpenAI (vie privée)
          store: false,
          // Un seul outil par réponse (sinon ex. navigate + showTrip en même temps)
          parallelToolCalls: false,
          // Regroupe les requêtes au même préfixe de prompt (cache OpenAI)
          promptCacheKey: `rominou-chat-${locale}`,
        },
      },
      onError: ({ error }) => {
        // Journal serveur minimal : jamais le contenu de la conversation
        console.error("[chat] stream error:", error instanceof Error ? error.name : "unknown");
      },
    });

    const stream = toUIMessageStream<ChatTools, ChatUIMessage>({
      stream: result.stream,
      tools: chatTools,
      sendReasoning: false,
      // Message générique côté client (aucun détail interne)
      onError: () => "internal_error",
    }).pipeThrough(signResponseStream(signingKey, history.previous ?? []));

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("[chat] request failed:", error instanceof Error ? error.name : "unknown");
    return jsonError("internal_error", 500);
  }
}
