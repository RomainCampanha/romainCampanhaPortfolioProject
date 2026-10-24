"use client";

import { useTranslations } from "next-intl";
import { RominouHead } from "@/components/ui/RominouHead";
import styles from "./Chat.module.css";

type ChatHeaderProps = {
  /** Chat en pause (indisponible, quota du jour atteint) : pastille beurre au lieu de verte. */
  away: boolean;
  /** Prénom de Romain (profil). */
  name: string;
};

// En-tête de la fenêtre : tête de Rominou, nom, « Version IA de Romain · répond par écrit »
// et pastille de présence (état lu par les lecteurs d'écran).
export function ChatHeader({ away, name }: ChatHeaderProps) {
  const t = useTranslations("chat.window");
  const state = away ? "away" : "online";

  return (
    <div className={styles.top}>
      <RominouHead ring="theme" className={styles.headAvatar} />
      <div className={styles.who}>
        <h2 id="chat-window-title" className={styles.title}>
          {t("title")}
        </h2>
        <p className={styles.subtitle}>{t.rich("subtitle", { name, nw: (chunks) => <span>{chunks}</span> })}</p>
      </div>
      <p className={styles.presence} data-state={state} title={t(`status.${state}`)}>
        <span aria-hidden="true" className={styles.dot} />
        <span className="sr-only">{t(`status.${state}`)}</span>
      </p>
    </div>
  );
}
