import { hkdfSync } from "node:crypto";

// Clés secrètes du chat (module serveur uniquement), dérivées par HKDF d'un secret de base :
// CHAT_SIGNING_SECRET si défini, sinon OPENAI_API_KEY (déjà secrète, présente partout où le
// chat fonctionne, identique sur toutes les instances Vercel). Une clé par usage.

export type SecretPurpose = "history-signature" | "ip-hash";

const cache = new Map<string, Buffer>();

/** Clé de 32 octets pour `purpose`, ou null si aucun secret n'est configuré. */
export function chatKey(purpose: SecretPurpose): Buffer | null {
  const base = process.env.CHAT_SIGNING_SECRET?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!base) return null;
  const cacheKey = `${purpose}\u0000${base}`;
  let key = cache.get(cacheKey);
  if (!key) {
    key = Buffer.from(hkdfSync("sha256", base, "rominou-chat", purpose, 32));
    cache.clear(); // un seul secret de base actif à la fois
    cache.set(cacheKey, key);
  }
  return key;
}
