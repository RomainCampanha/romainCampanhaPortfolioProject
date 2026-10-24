"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useChat } from "@ai-sdk/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  getChat,
  getServerStoppedIds,
  getStoppedIds,
  markStopped,
  registerChatBridge,
  subscribeStopped,
} from "@/lib/chat/client-chat";
import { getChatErrorKind } from "@/lib/chat/errors";
import { ChatAnnouncer } from "./ChatAnnouncer";
import { ChatComposer } from "./ChatComposer";
import { ChatErrorNotice } from "./ChatErrorNotice";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSuggestions } from "./ChatSuggestions";
import type { TripLabels } from "./types";

type ChatExperienceProps = {
  /** Libellés localisés des voyages (calculés côté serveur depuis le profil). */
  tripLabels: TripLabels;
  /** E-mail de contact (profil), affiché en cas d'erreur. */
  email: string;
  /** Employeur actuel (profil), pour la suggestion de question sur le job. */
  company: string;
};

// Interface du chat : conversation, suggestions, saisie, erreurs.
// L'état vit dans une instance Chat partagée (client-chat.ts) : il survit
// aux changements de page déclenchés par Rominou.
export function ChatExperience({ tripLabels, email, company }: ChatExperienceProps) {
  const t = useTranslations("chat");
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
    <div className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-3 shadow-glow backdrop-blur-sm sm:p-5">
      <p role="note" className="rounded-xl border border-line px-3 py-2 text-sm text-muted">
        {t("notice", { email })}
      </p>

      <ChatMessageList messages={messages} status={status} tripLabels={tripLabels} stoppedIds={stoppedIds} />

      {messages.length === 0 && <ChatSuggestions disabled={busy} onPick={send} company={company} />}

      {errorKind && (
        <ChatErrorNotice kind={errorKind} email={email} onRetry={busy ? undefined : handleRetry} />
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
    </div>
  );
}
