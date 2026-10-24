import type { ChatStatus } from "ai";
import type { TravelId } from "@/content/profile";
import type { ChatUIMessage } from "@/lib/chat/tools";

/** Libellé localisé de chaque voyage (ex. "Séoul", "Brighton & Dubrovnik"). */
export type TripLabels = Partial<Record<TravelId, string>>;

export type ChatViewProps = {
  messages: ChatUIMessage[];
  status: ChatStatus;
};

/** Texte visible d'un message (concaténation des parties texte). */
export function messageText(message: ChatUIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text.trim() : ""))
    .filter(Boolean)
    .join("\n\n");
}
