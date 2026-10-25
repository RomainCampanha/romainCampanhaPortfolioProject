import { jsonSchema, tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { z } from "zod";
import { profile, TRAVEL_IDS } from "@/content/profile";
import { PAGE_IDS } from "@/lib/pages";
import { CHAT_ANIMATIONS } from "./constants";

// Outils "côté client" du chat : déclarés ici SANS execute.
// Le serveur les expose au modèle ; le navigateur les exécute (onToolCall dans
// client-chat.ts) puis renvoie le résultat avec addToolOutput.
// Les composants client n'importent que les TYPES de ce module (import type).

const toolOutputSchema = z.object({ ok: z.boolean() });

const { firstName, guideName } = profile;

/** Contenu de la page Pro, tiré du profil (partagé avec le prompt système). */
export const PRO_PAGE_TOPICS = [
  `who ${firstName} is`,
  "studies",
  profile.work.company,
  "skills",
  ...profile.projects.map((project) => project.name),
  "contact",
].join(", ");

export const chatTools = {
  navigate: tool({
    description: `Open a page of the website in the visitor's browser (it leaves this chat), right after your text. Only when the visitor explicitly asks to go there, or accepts your offer. pro = home (${PRO_PAGE_TOPICS}); hobby = travels, music, games; chat = this conversation.`,
    inputSchema: z.object({ page: z.enum(PAGE_IDS) }),
    outputSchema: toolOutputSchema,
    strict: true,
  }),
  playAnimation: tool({
    description: `Play an animation on ${guideName}, ${firstName}'s 3D avatar: wave (hello/goodbye), bow (thanks/compliment), walk, run.`,
    inputSchema: z.object({ name: z.enum(CHAT_ANIMATIONS) }),
    outputSchema: toolOutputSchema,
    strict: true,
  }),
  startTour: tool({
    description: `Start ${guideName}'s guided tour of the website in the visitor's browser, right after your text: it opens the home page and ${guideName} walks the visitor through the Pro, Hobby and Chat pages, step by step (it leaves this chat). Only when the visitor asks for a tour of the site ("fais-moi visiter le site", "show me around") or says yes to your offer.`,
    // Aucun paramètre. Schéma explicite (required: []) : accepté tel quel en mode strict.
    inputSchema: jsonSchema<Record<string, never>>(
      { type: "object", properties: {}, required: [], additionalProperties: false },
      {
        validate: (value) =>
          value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0
            ? { success: true, value: {} }
            : { success: false, error: new Error("startTour takes no input") },
      },
    ),
    outputSchema: toolOutputSchema,
    strict: true,
  }),
  showTrip: tool({
    description: `Open the Hobby page on the card of one of ${firstName}'s trips (photos and anecdotes), right after your text. Only when the visitor asks to see that trip, or accepts your offer.`,
    inputSchema: z.object({ destination: z.enum(TRAVEL_IDS) }),
    outputSchema: toolOutputSchema,
    strict: true,
  }),
};

export type ChatTools = typeof chatTools;
export type ChatToolName = keyof ChatTools;

/** Metadata d'un message de Rominou : signature serveur de son contenu (cf. signature.ts). */
export type ChatMessageMetadata = { sig?: string };

/** Message UI typé du chat (pas de data parts). */
export type ChatUIMessage = UIMessage<ChatMessageMetadata, UIDataTypes, InferUITools<ChatTools>>;
export type ChatUIPart = ChatUIMessage["parts"][number];
