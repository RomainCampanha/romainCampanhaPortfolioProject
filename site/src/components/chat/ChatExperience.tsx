"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useChat } from "@ai-sdk/react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ClayCard } from "@/components/ui/ClayCard";
import {
  getChat,
  getServerStoppedIds,
  getStoppedIds,
  markStopped,
  registerChatBridge,
  subscribeStopped,
} from "@/lib/chat/client-chat";
import { getChatErrorKind, type ChatErrorKind } from "@/lib/chat/errors";
import { ChatAnnouncer } from "./ChatAnnouncer";
import { ChatComposer } from "./ChatComposer";
import { ChatErrorNotice } from "./ChatErrorNotice";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSuggestions } from "./ChatSuggestions";
import { messageText, type TripLabels } from "./types";
import styles from "./Chat.module.css";

type ChatExperienceProps = {
  /** Libellés localisés des voyages (calculés côté serveur depuis le profil). */
  tripLabels: TripLabels;
  /** E-mail de contact (profil), affiché en cas d'erreur. */
  email: string;
  /** Prénom de Romain (profil) : « version IA de Romain », « écris à Romain ». */
  name: string;
  /** Employeur actuel (profil), pour la suggestion de question sur le job. */
  company: string;
};

/** Erreurs où Rominou est « en pause » : pastille beurre, plus de suggestions. */
const PAUSED: readonly ChatErrorKind[] = ["unavailable", "daily_limit"];

// Fenêtre de chat « Cosy » : en-tête, conversation, suggestions, erreurs, saisie.
// L'état vit dans une instance Chat partagée (client-chat.ts) : il survit
// aux changements de page déclenchés par Rominou.
export function ChatExperience({ tripLabels, email, name, company }: ChatExperienceProps) {
  const locale = useLocale();
  const router = useRouter();
  const [chat] = useState(getChat);
  const { messages, status, error, sendMessage, stop, clearError, regenerate } = useChat({
    chat,
    throttle: 50,
  });
  const stoppedIds = useSyncExternalStore(subscribeStopped, getStoppedIds, getServerStoppedIds);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const busy = status === "submitted" || status === "streaming";
  const errorKind = getChatErrorKind(error);
  const paused = errorKind !== null && PAUSED.includes(errorKind);
  const asked = new Set(messages.filter((message) => message.role === "user").map(messageText));

  // Donne au chat (module) accès au routeur localisé tant que la page est affichée
  useEffect(
    () => registerChatBridge({ navigate: (href) => router.push(href), locale }),
    [router, locale],
  );

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (error) clearError();
    void sendMessage({ text: trimmed });
    setInput("");
    inputRef.current?.focus();
  }

  function handleStop() {
    // État courant de l'instance (pas le rendu précédent) : message auquel rattacher la mention
    const last = chat.messages.at(-1);
    if (last) markStopped(last.id);
    void stop();
    inputRef.current?.focus();
  }

  function handleRetry() {
    clearError();
    void regenerate();
    inputRef.current?.focus();
  }

  return (
    <ClayCard className={`${styles.window} flex min-w-0 flex-col`}>
      <ChatHeader away={paused} name={name} />

      <ChatMessageList
        messages={messages}
        status={status}
        tripLabels={tripLabels}
        stoppedIds={stoppedIds}
        name={name}
      />

      {!paused && <ChatSuggestions disabled={busy} onPick={send} company={company} asked={asked} />}

      {errorKind && (
        <ChatErrorNotice kind={errorKind} email={email} name={name} onRetry={busy ? undefined : handleRetry} />
      )}

      <ChatComposer
        ref={inputRef}
        value={input}
        onChange={setInput}
        onSubmit={() => send(input)}
        onStop={handleStop}
        busy={busy}
      />

      <ChatAnnouncer messages={messages} status={status} />
    </ClayCard>
  );
}
