import { z } from "zod";
import { TRAVEL_IDS } from "@/content/profile";
import { routing } from "@/i18n/routing";
import { PAGE_IDS } from "@/lib/pages";
import { CHAT_ANIMATIONS, CHAT_LIMITS, TOOL_ERROR_TEXT } from "./constants";

// Validation stricte du corps de POST /api/chat.
// - Liste blanche des parties : texte (user + assistant), step-start et nos 4 outils
//   (assistant). Tout le reste (system, fichiers, data, reasoning…) est refusé.
// - z.object() retire les clés inconnues (providerMetadata, etc.) : le modèle ne
//   reçoit que du texte et des appels d'outils dont les entrées sont des enums ;
//   une erreur d'outil ne peut valoir que TOOL_ERROR_TEXT (aucun texte libre caché).
// - Les messages assistant portent metadata.sig, vérifiée ensuite par la route
//   (signature.ts) : un tour assistant inventé n'atteint jamais le modèle.

const id = z.string().min(1).max(100);

const textPart = z.object({
  type: z.literal("text"),
  // trim() d'abord : un message vide ou fait d'espaces est refusé
  text: z.string().trim().min(1).max(CHAT_LIMITS.maxTextPartChars),
  state: z.enum(["streaming", "done"]).optional(),
});

const stepStartPart = z.object({ type: z.literal("step-start") });

const toolOutput = z.object({ ok: z.boolean() });

/** Partie outil terminée (sortie ou erreur), avec entrée validée par outil. */
function toolPart<T extends string, I extends z.ZodType>(type: T, input: I) {
  const base = { type: z.literal(type), toolCallId: id, input };
  return z.discriminatedUnion("state", [
    z.object({ ...base, state: z.literal("output-available"), output: toolOutput }),
    z.object({ ...base, state: z.literal("output-error"), errorText: z.literal(TOOL_ERROR_TEXT) }),
  ]);
}

const assistantPart = z.union([
  textPart,
  stepStartPart,
  toolPart("tool-navigate", z.object({ page: z.enum(PAGE_IDS) })),
  toolPart("tool-playAnimation", z.object({ name: z.enum(CHAT_ANIMATIONS) })),
  toolPart("tool-showTrip", z.object({ destination: z.enum(TRAVEL_IDS) })),
  toolPart("tool-startTour", z.strictObject({})),
]);

const userMessage = z.object({
  id,
  role: z.literal("user"),
  parts: z.array(textPart).min(1).max(4),
});

/**
 * Signature HMAC-SHA256 (base64url) posée par le serveur. Volontairement souple ici :
 * une signature absente ou fausse n'invalide pas la requête, le message est écarté
 * par verifyHistory() (la conversation continue sans lui).
 */
const assistantMetadata = z.object({ sig: z.string().max(64).optional() });

const assistantMessage = z.object({
  id,
  role: z.literal("assistant"),
  parts: z.array(assistantPart).min(1).max(16),
  metadata: assistantMetadata.optional(),
});

type AnyPart = z.infer<typeof assistantPart>;

function textLength(part: AnyPart): number {
  if (part.type === "text") return part.text.length;
  if ("errorText" in part) return part.errorText.length;
  return 0;
}

export const chatRequestSchema = z
  .object({
    // Rôles autorisés : user | assistant uniquement (un message "system" est rejeté).
    messages: z
      .array(z.discriminatedUnion("role", [userMessage, assistantMessage]))
      .min(1)
      .max(CHAT_LIMITS.maxMessages),
    /** Page sur laquelle se trouve le visiteur (contexte du prompt). */
    page: z.enum(PAGE_IDS).optional(),
    /** Langue de l'interface (langue de repli des réponses). */
    locale: z.enum(routing.locales).optional(),
  })
  .superRefine(({ messages }, ctx) => {
    const total = messages
      .flatMap((m) => m.parts as AnyPart[])
      .reduce((sum, part) => sum + textLength(part), 0);
    if (total > CHAT_LIMITS.maxTotalTextChars) {
      ctx.addIssue({ code: "custom", message: "total_text_too_long", path: ["messages"] });
    }

    // Le dernier message doit être du visiteur, ou une réponse assistant
    // contenant un résultat d'outil (relance automatique après un outil client).
    const last = messages.at(-1);
    const isToolFollowUp =
      last?.role === "assistant" && last.parts.some((p) => "toolCallId" in p);
    if (last?.role !== "user" && !isToolFollowUp) {
      ctx.addIssue({ code: "custom", message: "invalid_last_message", path: ["messages"] });
    }
  });

export type ChatRequest = z.infer<typeof chatRequestSchema>;
