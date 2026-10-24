import { historyText } from "./canonical";
import { CHAT_LIMITS, TOOL_ERROR_TEXT } from "./constants";
import type { ChatUIMessage, ChatUIPart } from "./tools";

// Prépare l'historique envoyé à /api/chat pour qu'il respecte toujours les
// limites de la route (fenêtre glissante) : la conversation affichée reste
// complète, seule la requête est réduite. Les réponses de Rominou gardent leur
// signature serveur (metadata.sig) : la route écarte celles qui ne sont pas signées.

/** Garde uniquement ce que la route accepte (texte, étapes, outils terminés). */
function sanitizePart(part: ChatUIPart): ChatUIPart | null {
  switch (part.type) {
    case "text": {
      // Même normalisation que la signature serveur (canonical.ts)
      const text = historyText(part.text);
      return text ? { type: "text", text } : null;
    }
    case "step-start":
      return part;
    case "tool-navigate":
    case "tool-playAnimation":
    case "tool-showTrip":
      if (part.state === "output-available") return part;
      // Erreur renvoyée par le navigateur uniquement ; une erreur du serveur (entrée
      // invalide du modèle) n'est pas signée : on l'écarte.
      if (part.state === "output-error" && part.errorText === TOOL_ERROR_TEXT) return part;
      return null;
    default:
      return null;
  }
}

function sanitizeMessage(message: ChatUIMessage): ChatUIMessage | null {
  const parts = message.parts
    .map(sanitizePart)
    .filter((part): part is ChatUIPart => part !== null);
  const hasContent = parts.some((part) => part.type !== "step-start");
  if (!hasContent) return null;
  const sig = message.role === "assistant" ? message.metadata?.sig : undefined;
  return { id: message.id, role: message.role, parts, ...(sig ? { metadata: { sig } } : {}) };
}

function textLength(message: ChatUIMessage): number {
  return message.parts.reduce((sum, part) => {
    if (part.type === "text") return sum + part.text.length;
    if ("errorText" in part && typeof part.errorText === "string") return sum + part.errorText.length;
    return sum;
  }, 0);
}

/**
 * Derniers messages valides (<= maxMessages, <= maxTotalTextChars),
 * en commençant toujours par un message du visiteur.
 */
export function prepareHistory(messages: ChatUIMessage[]): ChatUIMessage[] {
  const clean = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map(sanitizeMessage)
    .filter((m): m is ChatUIMessage => m !== null);

  const window: ChatUIMessage[] = [];
  let total = 0;
  for (let i = clean.length - 1; i >= 0; i--) {
    const size = textLength(clean[i]);
    if (window.length >= CHAT_LIMITS.maxMessages || total + size > CHAT_LIMITS.maxTotalTextChars) {
      break;
    }
    window.unshift(clean[i]);
    total += size;
  }

  // Le contexte doit démarrer sur une question du visiteur
  while (window.length > 1 && window[0].role !== "user") window.shift();
  return window;
}
