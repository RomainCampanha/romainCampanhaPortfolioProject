"use client";

import type { FormEvent, KeyboardEvent, Ref } from "react";
import { useTranslations } from "next-intl";
import { CHAT_LIMITS } from "@/lib/chat/constants";

type ChatComposerProps = {
  ref?: Ref<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  /** Une réponse est en cours : envoi bloqué, bouton Arrêter visible. */
  busy: boolean;
};

const MAX = CHAT_LIMITS.maxTextPartChars;

// Zone de saisie : champ étiqueté (500 caractères max, compteur), Envoyer / Arrêter.
export function ChatComposer({ ref, value, onChange, onSubmit, onStop, busy }: ChatComposerProps) {
  const t = useTranslations("chat.composer");
  const canSend = !busy && value.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSend) onSubmit();
  }

  // Entrée = envoyer ; Maj+Entrée = nouvelle ligne (pas pendant une composition IME)
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="chat-input" className="text-sm font-medium text-fg">
        {t("label")}
      </label>
      <textarea
        ref={ref}
        id="chat-input"
        name="message"
        rows={2}
        maxLength={MAX}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        aria-describedby="chat-input-hint chat-input-counter"
        autoComplete="off"
        className="w-full resize-y rounded-xl border border-line bg-indigo-night/60 px-3.5 py-2.5 text-fg placeholder:text-muted/80 focus-visible:border-accent"
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="text-xs text-muted">
          <p id="chat-input-hint">{t("hint")}</p>
          <p id="chat-input-counter" className="tabular-nums">
            {t("counter", { count: value.length, max: MAX })}
          </p>
        </div>
        <div className="flex gap-2">
          {busy && (
            <button
              type="button"
              onClick={onStop}
              className="rounded-full border border-line px-4 py-2 font-display text-sm font-semibold tracking-wide text-fg hover:border-accent"
            >
              {t("stop")}
            </button>
          )}
          <button
            type="submit"
            disabled={!canSend}
            className="btn-neon text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
          >
            {t("send")}
          </button>
        </div>
      </div>
    </form>
  );
}
