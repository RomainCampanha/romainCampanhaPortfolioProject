import { checkBotId } from "botid/server";

// Vérification Vercel BotID (module serveur uniquement).
// Le client est initialisé dans src/instrumentation-client.ts (initBotId, POST /api/chat).

export type BotCheckResult = "human" | "bot" | "unavailable";

/**
 * BotID est TOUJOURS vérifié, sauf si BOTID_DISABLED=1 (next start en local, CI, tests e2e :
 * pas de jeton OIDC Vercel). Ce drapeau est ignoré en production Vercel. Avec next dev,
 * checkBotId() se met lui-même en mode développement (visiteur considéré humain).
 */
function isBotIdDisabled(): boolean {
  return process.env.BOTID_DISABLED === "1" && process.env.VERCEL_ENV !== "production";
}

export async function checkChatBot(): Promise<BotCheckResult> {
  if (isBotIdDisabled()) return "human";

  try {
    const verification = await checkBotId();
    return verification.isBot ? "bot" : "human";
  } catch (error) {
    // Vérification impossible = on refuse (fail closed, budget protégé).
    console.error("[chat] BotID check failed:", error instanceof Error ? error.name : "unknown");
    return "unavailable";
  }
}
