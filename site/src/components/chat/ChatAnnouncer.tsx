"use client";

import { useTranslations } from "next-intl";
import { messageText, type ChatViewProps } from "./types";

// Région aria-live polie (invisible) : annonce uniquement la réponse FINALE de
// Rominou, une fois le stream terminé (pas chaque fragment de texte).
export function ChatAnnouncer({ messages, status }: ChatViewProps) {
  const t = useTranslations("chat.live");
  const last = messages.at(-1);
  const text = status === "ready" && last?.role === "assistant" ? messageText(last) : "";

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {text ? t("reply", { text }) : null}
    </div>
  );
}
