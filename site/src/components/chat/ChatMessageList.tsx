"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { isToolUIPart } from "ai";
import { AssistantBubble, ChatMessage, StoppedNote, TypingBubble } from "./ChatMessage";
import type { ChatViewProps, TripLabels } from "./types";
import styles from "./Chat.module.css";

type ChatMessageListProps = ChatViewProps & {
  tripLabels: TripLabels;
  /** Messages après lesquels le visiteur a arrêté la réponse (bouton "Arrêter"). */
  stoppedIds: ReadonlySet<string>;
  /** Prénom de Romain (profil), pour le message d'accueil. */
  name: string;
};

/** Distance (px) sous laquelle on considère l'utilisateur "en bas" de la liste. */
const STICK_THRESHOLD_PX = 80;

// Conversation dans une zone défilante (focusable au clavier) : séparateur « Aujourd'hui »,
// bulles, notifications d'action, « Rominou écrit… ».
// Volontairement PAS une région aria-live : seul ChatAnnouncer annonce la réponse finale.
export function ChatMessageList({ messages, status, tripLabels, stoppedIds, name }: ChatMessageListProps) {
  const t = useTranslations("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Suit le bas de la conversation pendant le stream, sauf si l'utilisateur remonte ;
  // un message envoyé par le visiteur ramène toujours en bas.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.at(-1)?.role === "user") stickToBottom.current = true;
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
  }

  const last = messages.at(-1);
  const waitingForFirstToken =
    status === "submitted" ||
    (status === "streaming" &&
      last?.role === "assistant" &&
      !last.parts.some((p) => (p.type === "text" && p.text.trim() !== "") || isToolUIPart(p)));

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      role="region"
      aria-label={t("panelLabel")}
      tabIndex={0}
      className={styles.log}
    >
      <p className={styles.day}>{t("today")}</p>
      <ol className="flex flex-col gap-4">
        {/* Accueil statique de Rominou (pas envoyé au modèle) */}
        <li className="flex flex-col">
          <AssistantBubble>
            <p className="whitespace-pre-wrap">{t("welcome", { name })}</p>
          </AssistantBubble>
        </li>

        {messages.map((message, index) => {
          const stopped = stoppedIds.has(message.id);
          // Arrêt avant le premier mot de Rominou : mention dans une bulle à part
          const stoppedBeforeReply =
            stopped && message.role === "user" && messages[index + 1]?.role !== "assistant";
          return (
            <li key={message.id} className="flex flex-col gap-4 empty:hidden">
              <ChatMessage
                message={message}
                tripLabels={tripLabels}
                stopped={stopped && message.role === "assistant"}
              />
              {stoppedBeforeReply && (
                <AssistantBubble>
                  <StoppedNote />
                </AssistantBubble>
              )}
            </li>
          );
        })}

        {waitingForFirstToken && (
          <li className="flex flex-col">
            <TypingBubble />
          </li>
        )}
      </ol>
    </div>
  );
}
