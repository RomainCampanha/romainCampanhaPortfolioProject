"use client";

import { useTranslations } from "next-intl";
import type { ChatErrorKind } from "@/lib/chat/errors";

type ChatErrorNoticeProps = {
  kind: ChatErrorKind;
  email: string;
  /** Absent : pas de bouton Réessayer (ex. chat indisponible). */
  onRetry?: () => void;
};

/** Erreurs où un nouvel essai a du sens. */
const RETRYABLE: readonly ChatErrorKind[] = ["generic", "rate_limited", "forbidden"];
/** Erreurs où l'on propose d'écrire à Romain. */
const WITH_EMAIL: readonly ChatErrorKind[] = ["unavailable", "daily_limit", "forbidden", "generic"];

// Message d'erreur sympathique (jamais le détail technique), avec l'e-mail de Romain.
export function ChatErrorNotice({ kind, email, onRetry }: ChatErrorNoticeProps) {
  const t = useTranslations("chat.errors");

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-accent/60 bg-neon-pink/10 px-4 py-3 text-sm text-fg sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        {t(kind)}
        {WITH_EMAIL.includes(kind) && (
          <>
            {" "}
            <a href={`mailto:${email}`} className="font-semibold text-fg underline decoration-accent underline-offset-4">
              {email}
            </a>
          </>
        )}
      </p>
      {onRetry && RETRYABLE.includes(kind) && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 self-start rounded-full border border-line px-4 py-1.5 font-display text-xs font-semibold tracking-wide hover:border-accent sm:self-auto"
        >
          {t("retry")}
        </button>
      )}
    </div>
  );
}
