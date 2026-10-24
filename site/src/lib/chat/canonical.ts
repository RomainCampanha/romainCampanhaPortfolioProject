import { CHAT_LIMITS } from "./constants";

// Forme canonique d'un message de Rominou, partagée client / serveur (aucune dépendance
// runtime). Le serveur signe cette forme à la fin de chaque réponse (signature.ts) ; le
// client renvoie l'historique réduit (history.ts) ; le serveur recalcule la même forme
// et vérifie la signature : un tour "assistant" inventé par le client est écarté.

const ELLIPSIS = "…";

/** Tronque à `max` caractères (idempotent : truncate(truncate(x)) === truncate(x)). */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - ELLIPSIS.length)}${ELLIPSIS}`;
}

/** Texte tel qu'il est renvoyé dans l'historique : sans espaces autour, borné. */
export function historyText(text: string): string {
  return truncate(text.trim(), CHAT_LIMITS.maxTextPartChars);
}

/** ["text", texte] | ["tool", toolCallId, toolName, entrée JSON stable]. */
export type CanonicalEntry = ["text", string] | ["tool", string, string, string];

/** JSON aux clés triées (même résultat quel que soit l'ordre des clés reçu). */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Partie minimale dont on tire la forme canonique (texte ou appel d'outil). */
type CanonicalSource =
  | { type: "text"; text: string }
  | { type: "step-start" }
  | { type: `tool-${string}`; toolCallId: string; input: unknown };

/** Forme canonique des parties d'un message (texte non vide + appels d'outils, dans l'ordre). */
export function canonicalEntries(parts: readonly CanonicalSource[]): CanonicalEntry[] {
  const entries: CanonicalEntry[] = [];
  for (const part of parts) {
    if (part.type === "text") {
      const text = historyText((part as { text: string }).text);
      if (text) entries.push(["text", text]);
    } else if (part.type.startsWith("tool-")) {
      const tool = part as { type: string; toolCallId: string; input: unknown };
      entries.push(["tool", tool.toolCallId, tool.type.slice("tool-".length), stableJson(tool.input)]);
    }
  }
  return entries;
}
