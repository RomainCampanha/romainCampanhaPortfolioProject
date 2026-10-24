import type { AvatarClip } from "@/lib/avatar/store";

// Constantes partagées client/serveur du chat (aucune dépendance runtime :
// importable depuis un composant client sans alourdir le bundle).

export const CHAT_API_PATH = "/api/chat";

/** Limites de la requête, appliquées par la route (zod) et respectées par le client. */
export const CHAT_LIMITS = {
  /** Messages max envoyés par requête (fenêtre glissante côté client). */
  maxMessages: 12,
  /** Caractères max par partie texte (= maxLength du champ de saisie). */
  maxTextPartChars: 500,
  /** Caractères max cumulés sur toutes les parties texte de la requête. */
  maxTotalTextChars: 6000,
  /** Taille max du corps brut (octets), avant même le parsing JSON. */
  maxBodyBytes: 64_000,
} as const;

/**
 * Seul texte d'erreur d'outil accepté dans l'historique : celui que le navigateur renvoie
 * quand il refuse d'exécuter un outil (aucun texte libre ne peut atteindre le modèle).
 */
export const TOOL_ERROR_TEXT = "invalid_tool_input";

/** Animations de Rominou pilotables par le chat (sous-ensemble de AvatarClip). */
export const CHAT_ANIMATIONS = ["wave", "bow", "walk", "run"] as const satisfies readonly AvatarClip[];
export type ChatAnimation = (typeof CHAT_ANIMATIONS)[number];

/** Codes d'erreur JSON renvoyés par POST /api/chat ({ error: code }). */
export const CHAT_ERROR_CODES = [
  "invalid_request",
  "payload_too_large",
  "forbidden",
  "rate_limited",
  "daily_limit",
  "chat_unavailable",
  "internal_error",
] as const;
export type ChatErrorCode = (typeof CHAT_ERROR_CODES)[number];
