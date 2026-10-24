// Configuration serveur du chat, lue depuis les variables d'environnement.
// Les valeurs vides (cf. .env.example) retombent sur les valeurs par défaut.

/**
 * Modèle par défaut : GPT-6 Luna, le modèle "lowest-cost" recommandé par OpenAI
 * pour les usages à fort volume et sensibles au coût (0,10 $ / 1M tokens en entrée,
 * 0,01 $ en entrée cachée, 0,50 $ en sortie ; effort de raisonnement "none" supporté).
 * Vérifié le 2026-10-24 sur :
 *   https://developers.openai.com/api/docs/models/gpt-6-luna
 *   https://developers.openai.com/api/docs/pricing
 * Si CHAT_MODEL pointe vers un autre modèle, vérifier qu'il accepte reasoning "none"
 * (sinon le raisonnement consomme le budget maxOutputTokens et temperature est ignorée).
 */
export const DEFAULT_CHAT_MODEL = "gpt-6-luna";

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export type ChatEnv = {
  apiKey: string | null;
  model: string;
  ratePerMinute: number;
  dailyGlobalLimit: number;
};

/** Lu à chaque requête (pas au chargement du module) pour refléter l'env courant. */
export function getChatEnv(): ChatEnv {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() || null,
    model: process.env.CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL,
    ratePerMinute: positiveInt(process.env.CHAT_RATE_LIMIT_PER_MINUTE, 8),
    dailyGlobalLimit: positiveInt(process.env.CHAT_DAILY_GLOBAL_LIMIT, 500),
  };
}
