"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ChatUIMessage } from "@/lib/chat/tools";
import { ChatToolActivity } from "./ChatToolActivity";
import type { TripLabels } from "./types";

type Role = "user" | "assistant";

/** Bulle de message ; le rôle est annoncé aux lecteurs d'écran ("Toi" / "Rominou"). */
export function ChatBubble({ role, children }: { role: Role; children: ReactNode }) {
  const t = useTranslations("chat.roles");
  const isUser = role === "user";

  return (
    <div
      className={[
        "flex max-w-[min(100%,36rem)] flex-col gap-1",
        isUser ? "ml-auto items-end" : "mr-auto items-start",
      ].join(" ")}
    >
      <p
        className={[
          "px-1 font-display text-[0.7rem] font-semibold uppercase tracking-wider",
          // Petit texte : rose clair (le rose néon #FF00C3 ne passe pas 4.5:1 à cette taille)
          isUser ? "text-muted" : "text-neon-pink-light",
        ].join(" ")}
      >
        {t(role)}
      </p>
      <div
        className={[
          "flex min-w-0 max-w-full flex-col gap-2 break-words rounded-bubble px-4 py-2.5 leading-relaxed",
          isUser
            ? "rounded-br-md bg-grape/70 text-fg"
            : "rounded-bl-md border border-line bg-indigo-night/60 text-fg",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

/** Mention "Réponse interrompue." après un clic sur "Arrêter". */
export function StoppedNote() {
  const t = useTranslations("chat");
  return <p className="text-sm italic text-muted">{t("stopped")}</p>;
}

type ChatMessageProps = {
  message: ChatUIMessage;
  tripLabels: TripLabels;
  /** Réponse arrêtée par le visiteur : la mention s'affiche sous le texte reçu. */
  stopped?: boolean;
};

// Rendu d'un message : texte brut (React échappe tout, aucun HTML injecté)
// et une ligne discrète pour chaque action d'outil.
export function ChatMessage({ message, tripLabels, stopped = false }: ChatMessageProps) {
  const role: Role = message.role === "user" ? "user" : "assistant";

  const content = message.parts.flatMap((part, index) => {
    if (part.type === "text") {
      const text = part.text.trim();
      return text ? [<p key={index} className="whitespace-pre-wrap">{text}</p>] : [];
    }
    if (
      part.type === "tool-navigate" ||
      part.type === "tool-playAnimation" ||
      part.type === "tool-showTrip"
    ) {
      return [<ChatToolActivity key={part.toolCallId} part={part} tripLabels={tripLabels} />];
    }
    return [];
  });

  if (stopped) content.push(<StoppedNote key="stopped" />);
  if (content.length === 0) return null;
  return <ChatBubble role={role}>{content}</ChatBubble>;
}
