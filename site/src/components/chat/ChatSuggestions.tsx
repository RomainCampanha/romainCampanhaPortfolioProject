"use client";

import { useTranslations } from "next-intl";

const SUGGESTION_KEYS = ["who", "travels", "work"] as const;

type ChatSuggestionsProps = {
  disabled: boolean;
  /** Envoie directement la question choisie. */
  onPick: (text: string) => void;
  /** Employeur actuel (profil). */
  company: string;
};

// Questions toutes prêtes pour lancer la conversation.
export function ChatSuggestions({ disabled, onPick, company }: ChatSuggestionsProps) {
  const t = useTranslations("chat.suggestions");
  const label = (key: (typeof SUGGESTION_KEYS)[number]) => t(key, { company });

  return (
    <div>
      <p id="chat-suggestions-label" className="mb-2 text-sm text-muted">
        {t("label")}
      </p>
      <ul aria-labelledby="chat-suggestions-label" className="flex flex-wrap gap-2">
        {SUGGESTION_KEYS.map((key) => (
          <li key={key}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(label(key))}
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-fg transition-[box-shadow,border-color] duration-200 hover:border-accent hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {label(key)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
