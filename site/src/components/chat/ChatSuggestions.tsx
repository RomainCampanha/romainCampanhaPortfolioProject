"use client";

import { useTranslations } from "next-intl";
import styles from "./Chat.module.css";

const SUGGESTION_KEYS = ["who", "travels", "work"] as const;

type ChatSuggestionsProps = {
  disabled: boolean;
  /** Envoie directement la question choisie. */
  onPick: (text: string) => void;
  /** Employeur actuel (profil). */
  company: string;
  /** Textes déjà envoyés par le visiteur : ces questions ne sont plus proposées. */
  asked: ReadonlySet<string>;
};

// Questions toutes prêtes (puces lilas) : restent proposées tant qu'elles n'ont pas été posées.
export function ChatSuggestions({ disabled, onPick, company, asked }: ChatSuggestionsProps) {
  const t = useTranslations("chat.suggestions");
  const remaining = SUGGESTION_KEYS.map((key) => t(key, { company })).filter((label) => !asked.has(label));
  if (remaining.length === 0) return null;

  return (
    <div className={styles.suggest}>
      <p id="chat-suggestions-label" className="sr-only">
        {t("label")}
      </p>
      <ul aria-labelledby="chat-suggestions-label" className={styles.suggestList}>
        {remaining.map((label) => (
          <li key={label}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(label)}
              className={`chip ${styles.suggestion}`}
              data-tone="lilac"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
