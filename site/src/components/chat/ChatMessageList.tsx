"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { isToolUIPart } from "ai";
import { ChatMessage, ChatBubble, StoppedNote } from "./ChatMessage";
import type { ChatViewProps, TripLabels } from "./types";

type ChatMessageListProps = ChatViewProps & {
  tripLabels: TripLabels;
  /** Messages après lesquels le visiteur a arrêté la réponse (bouton "Arrêter"). */
  stoppedIds: ReadonlySet<string>;
};

/** Distance (px) sous laquelle on considère l'utilisateur "en bas" de la liste. */
const STICK_THRESHOLD_PX = 80;

// Liste des messages dans une zone défilante (focusable au clavier).
// Volontairement PAS une région aria-live : seul ChatAnnouncer annonce la réponse finale.
export function ChatMessageList({ messages, status, tripLabels, stoppedIds }: ChatMessageListProps) {
  const t = useTranslations("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Suit le bas de la conversation pendant le stream, sauf si l'utilisateur remonte
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
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
      className="max-h-[min(60vh,34rem)] min-h-56 overflow-y-auto overscroll-contain rounded-xl pr-1"
    >
      <ol className="flex flex-col gap-3">
        {/* Accueil statique de Rominou (pas envoyé au modèle) */}
        <li>
          <ChatBubble role="assistant">
            <p className="whitespace-pre-wrap">{t("welcome")}</p>
          </ChatBubble>
        </li>

        {messages.map((message, index) => {
          const stopped = stoppedIds.has(message.id);
          // Arrêt avant le premier mot de Rominou : mention dans une bulle à part
          const stoppedBeforeReply =
            stopped && message.role === "user" && messages[index + 1]?.role !== "assistant";
          return (
            <li key={message.id} className="flex flex-col gap-3">
              <ChatMessage
                message={message}
                tripLabels={tripLabels}
                stopped={stopped && message.role === "assistant"}
              />
              {stoppedBeforeReply && (
                <ChatBubble role="assistant">
                  <StoppedNote />
                </ChatBubble>
              )}
            </li>
          );
        })}

        {waitingForFirstToken && (
          <li>
            <ChatBubble role="assistant">
              <p className="text-muted motion-safe:animate-pulse">{t("thinking")}</p>
            </ChatBubble>
          </li>
        )}
      </ol>
    </div>
  );
}
