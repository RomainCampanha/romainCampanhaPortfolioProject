"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { LevelCard } from "@/lib/game/catalog";
import { RominouHead } from "@/components/ui/RominouHead";
import { GameIcon } from "./GameIcon";
import styles from "./game.module.css";

export type HudState = { hearts: number; stamps: number; progress: number };

type GameHudProps = {
  card: LevelCard;
  total: number;
  maxHearts: number;
  hud: HudState;
  sound: boolean;
  expanded: boolean;
  canPause: boolean;
  onPause: () => void;
  onSound: () => void;
  onFullscreen: () => void;
};

/**
 * HUD « jeu cosy » : étape, cœurs, tampons, progression vers la porte, pause / son / plein écran.
 * Son et plein écran : boutons bascules, nom fixe + état « enfoncé » (aria-pressed).
 */
export function GameHud({ card, total, maxHearts, hud, sound, expanded, canPause, onPause, onSound, onFullscreen }: GameHudProps) {
  const t = useTranslations("game.hud");
  const format = useFormatter();
  const percent = format.number(hud.progress, { style: "percent" });

  return (
    <div className={styles.hud} aria-label={t("label")} role="group">
      <div className={styles.hudRow}>
        <div className={styles.hudStats}>
          <span className={styles.hudChip}>
            <span className={styles.hudStep}>{t("level", { n: card.index + 1, total })}</span>
            <span className={styles.hudCity}>{card.name}</span>
          </span>
          {/* Remontés à chaque changement : petite secousse quand un cœur est perdu. */}
          <span
            key={`hearts-${hud.hearts}`}
            role="img"
            aria-label={t("hearts", { count: hud.hearts, max: maxHearts })}
            className={styles.hearts}
            data-hurt={hud.hearts < maxHearts || undefined}
          >
            {Array.from({ length: maxHearts }, (_, i) => (
              <GameIcon key={i} name="heart-full" data-empty={i >= hud.hearts || undefined} size={18} />
            ))}
          </span>
          <span role="img" aria-label={t("stamps", { count: hud.stamps })} className={styles.hudChip}>
            <GameIcon name="stamp" size={18} />
            <span key={hud.stamps} className={hud.stamps > 0 ? `tabular-nums ${styles.bump}` : "tabular-nums"}>
              {hud.stamps}
            </span>
          </span>
        </div>
        <div className={styles.hudButtons}>
          <button type="button" className={styles.hudButton} onClick={onPause} disabled={!canPause} aria-label={t("pause")}>
            <GameIcon name="pause" />
          </button>
          <button
            type="button"
            className={styles.hudButton}
            onClick={onSound}
            aria-pressed={sound}
            aria-label={t("sound")}
          >
            <GameIcon name={sound ? "sound-on" : "sound-off"} />
          </button>
          <button
            type="button"
            className={styles.hudButton}
            onClick={onFullscreen}
            aria-pressed={expanded}
            aria-label={t("fullscreen")}
          >
            <GameIcon name={expanded ? "collapse" : "expand"} />
          </button>
        </div>
      </div>
      <div
        role="img"
        aria-label={t("progress", { percent })}
        className={styles.progress}
        style={{ "--progress": hud.progress } as CSSProperties}
      >
        <span aria-hidden="true" className={styles.progressTrack}>
          <span className={styles.progressFill} />
        </span>
        <RominouHead size={26} className={styles.progressHead} />
        <span aria-hidden="true" className={styles.progressGate}>
          <GameIcon name="gate" size={16} />
        </span>
      </div>
    </div>
  );
}
