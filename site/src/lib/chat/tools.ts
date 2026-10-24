import { tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
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
    description: `Open a page of the website in the visitor's browser. pro = home (${PRO_PAGE_TOPICS}); hobby = travels, music, games; chat = this conversation.`,
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
  showTrip: tool({
    description: `Open the Hobby page on the card of one of ${firstName}'s trips (photos and anecdotes).`,
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
