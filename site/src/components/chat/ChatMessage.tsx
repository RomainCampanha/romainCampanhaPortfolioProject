"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { RominouHead } from "@/components/ui/RominouHead";
import type { ChatUIMessage, ChatUIPart } from "@/lib/chat/tools";
import { ChatToolActivity, isChatToolPart, type ChatToolPart } from "./ChatToolActivity";
import type { TripLabels } from "./types";
import styles from "./Chat.module.css";

/** Bulle de Rominou : petite tête à gauche, nom en capitales puis le texte. */
export function AssistantBubble({ children }: { children: ReactNode }) {
  const t = useTranslations("chat.roles");
  return (
    <div className={styles.row}>
      <RominouHead ring="theme" className={styles.botAvatar} />
      <div className={`${styles.bubble} ${styles.bubbleBot}`}>
        <p className={styles.name}>{t("assistant")}</p>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

/** Bulle du visiteur (pilule encre à droite) ; « Toi : » est lu par les lecteurs d'écran. */
export function UserBubble({ children }: { children: ReactNode }) {
  const t = useTranslations("chat.roles");
  return (
    <div className={`${styles.row} ${styles.rowUser}`}>
      <div className={`${styles.bubble} ${styles.bubbleUser}`}>
        <p className="sr-only">{t("user")} :</p>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

/** « Rominou écrit… » : trois points animés (texte pour les lecteurs d'écran). */
export function TypingBubble() {
  const t = useTranslations("chat");
  return (
    <div className={styles.row}>
      <RominouHead ring="theme" className={styles.botAvatar} />
      <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typing}`}>
        <span className="sr-only">{t("thinking")}</span>
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <i aria-hidden="true" />
      </div>
    </div>
  );
}

/** Mention "Réponse interrompue." après un clic sur "Arrêter". */
export function StoppedNote() {
  const t = useTranslations("chat");
  return <p className={styles.note}>{t("stopped")}</p>;
}

type Segment =
  | { kind: "text"; key: string; nodes: ReactNode[] }
  | { kind: "tool"; key: string; part: ChatToolPart };

/**
 * Découpe un message en segments affichables, dans l'ordre : les textes consécutifs
 * forment une bulle, chaque action d'outil devient une notification entre les bulles.
 */
function toSegments(parts: ChatUIPart[]): Segment[] {
  const segments: Segment[] = [];
  parts.forEach((part, index) => {
    if (part.type === "text") {
      const text = part.text.trim();
      if (!text) return;
      const node = (
        <p key={index} className="whitespace-pre-wrap">
          {text}
        </p>
      );
      const last = segments.at(-1);
      if (last?.kind === "text") last.nodes.push(node);
      else segments.push({ kind: "text", key: `text-${index}`, nodes: [node] });
    } else if (isChatToolPart(part)) {
      segments.push({ kind: "tool", key: part.toolCallId, part });
    }
  });
  return segments;
}

type ChatMessageProps = {
  message: ChatUIMessage;
  tripLabels: TripLabels;
  /** Réponse arrêtée par le visiteur : la mention s'affiche sous le texte reçu. */
  stopped?: boolean;
};

// Rendu d'un message : texte brut (React échappe tout, aucun HTML injecté) en bulles,
// et une notification pour chaque action d'outil de Rominou.
export function ChatMessage({ message, tripLabels, stopped = false }: ChatMessageProps) {
  const segments = toSegments(message.parts);

  if (message.role === "user") {
    const nodes = segments.flatMap((segment) => (segment.kind === "text" ? segment.nodes : []));
    return nodes.length > 0 ? <UserBubble>{nodes}</UserBubble> : null;
  }

  if (stopped) {
    const note = <StoppedNote key="stopped" />;
    const last = segments.at(-1);
    if (last?.kind === "text") last.nodes.push(note);
    else segments.push({ kind: "text", key: "stopped", nodes: [note] });
  }
  if (segments.length === 0) return null;

  return segments.map((segment) =>
    segment.kind === "text" ? (
      <AssistantBubble key={segment.key}>{segment.nodes}</AssistantBubble>
    ) : (
      <ChatToolActivity key={segment.key} part={segment.part} tripLabels={tripLabels} />
    ),
  );
}
