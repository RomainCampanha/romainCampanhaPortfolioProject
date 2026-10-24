"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Coin } from "@/components/ui/Coin";
import type { IconName } from "@/components/ui/Icon";
import type { Tone } from "@/components/ui/tones";
import type { ChatErrorKind } from "@/lib/chat/errors";
import { EmailLink } from "./EmailLink";
import styles from "./Chat.module.css";

type ChatErrorNoticeProps = {
  kind: ChatErrorKind;
  email: string;
  /** Prénom de Romain (profil) : « écris à Romain ». */
  name: string;
  /** Absent : pas de bouton Réessayer (ex. chat indisponible). */
  onRetry?: () => void;
};

/** Erreurs où un nouvel essai a du sens. */
const RETRYABLE: readonly ChatErrorKind[] = ["generic", "rate_limited", "forbidden"];
/** Erreurs où l'on propose d'écrire à Romain. */
const WITH_EMAIL: readonly ChatErrorKind[] = ["unavailable", "daily_limit", "forbidden", "generic"];

/** Pause (beurre) ou vraie erreur (pêche) : ton et icône de la carte. */
const LOOK: Record<ChatErrorKind, { tone: Tone; icon: IconName }> = {
  unavailable: { tone: "butter", icon: "leaf" },
  daily_limit: { tone: "butter", icon: "leaf" },
  rate_limited: { tone: "butter", icon: "sprout" },
  forbidden: { tone: "peach", icon: "refresh" },
  generic: { tone: "peach", icon: "refresh" },
};

// Message d'erreur sympathique (jamais le détail technique), avec l'e-mail de Romain.
export function ChatErrorNotice({ kind, email, name, onRetry }: ChatErrorNoticeProps) {
  const t = useTranslations("chat.errors");
  const { tone, icon } = LOOK[kind];

  return (
    <div role="alert" className={styles.error} data-tone={tone}>
      <p className={styles.errorText}>
        <Coin icon={icon} tone={tone} size="sm" />
        <span className="min-w-0 self-center">
          {t(kind, { name })}
          {WITH_EMAIL.includes(kind) && (
            <>
              {" "}
              <EmailLink email={email} />
            </>
          )}
        </span>
      </p>
      {onRetry && RETRYABLE.includes(kind) && (
        <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry} className="shrink-0">
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
