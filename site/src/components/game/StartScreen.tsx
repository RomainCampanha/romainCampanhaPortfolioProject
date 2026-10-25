"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { LevelCard } from "@/lib/game/catalog";
import { difficultyFor } from "@/lib/game/difficulty";
import type { GameMode } from "@/lib/game/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RominouHead } from "@/components/ui/RominouHead";
import { GameIcon } from "./GameIcon";
import { ModeSwitch } from "./ModeSwitch";
import styles from "./game.module.css";

type StartScreenProps = {
  level: LevelCard;
  first: string;
  last: string;
  count: number;
  mode: GameMode;
  suggested: boolean;
  onModeChange: (mode: GameMode) => void;
  onPlay: () => void;
  onPrefetch: () => void;
};

/** Écran titre (dans l'écran de jeu) : titre, comment jouer, prochain départ, mode, « Jouer ». */
export function StartScreen({ level, first, last, count, mode, suggested, onModeChange, onPlay, onPrefetch }: StartScreenProps) {
  const t = useTranslations("game");
  const nextId = useId();
  const howToId = useId();

  return (
    <section className={styles.start} aria-label={t("start.label")}>
      <StartDecor />
      <div className={styles.startText}>
        <p aria-hidden="true" className={styles.logo}>
          {t("start.title")}
        </p>
        <p className={styles.tagline}>{t("start.tagline", { first, last, count })}</p>
        <h4 id={howToId} className="type-kicker mt-4 text-tone-800">
          {t("start.howTo")}
        </h4>
        <ul aria-labelledby={howToId} className={styles.howTo}>
          <li>
            <span className={styles.howIcon}>
              <Icon name="arrow-up-right" size={16} />
            </span>
            {t("start.howJump")}
          </li>
          <li>
            <span className={styles.howIcon}>
              <Icon name="sparkle" size={16} />
            </span>
            {t("start.howDouble")}
          </li>
          <li>
            <span className={styles.howIcon}>
              <GameIcon name="stamp" size={16} />
            </span>
            {t("start.howStamps")}
          </li>
          <li>
            <span className={styles.howIcon}>
              <GameIcon name="gate" size={16} />
            </span>
            {t("start.howGate")}
          </li>
        </ul>
      </div>

      <div className={styles.startAction}>
        <RominouHead size={76} ring="raised" className={styles.startHead} />
        <p id={nextId} className={styles.nextStop}>
          <span className="type-kicker block text-tone-800">{t("start.next")}</span>
          <span className="type-title block">
            {level.name}
            {level.year ? <span className={styles.nextYear}> · {level.year}</span> : null}
          </span>
        </p>
        <Button
          data-play-button=""
          aria-describedby={nextId}
          className={styles.playButton}
          onClick={onPlay}
          onPointerEnter={onPrefetch}
          onFocus={onPrefetch}
        >
          <GameIcon name="play" />
          {t("start.play")}
        </Button>
        <ModeSwitch
          mode={mode}
          onChange={onModeChange}
          hint={suggested ? t("mode.suggested") : t("mode.hint", { hearts: difficultyFor(1, "tranquille").hearts })}
        />
      </div>
    </section>
  );
}

/** Décor de l'écran titre : collines, lac, nuages et le trajet en pointillés (SVG, décoratif). */
function StartDecor() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" className={styles.startDecor}>
      <g className={styles.decorCloud}>
        <path d="M86 92h84a19 19 0 0 0-12-35 26 26 0 0 0-49-5 19 19 0 0 0-23 40z" />
        <path d="M602 64h62a14 14 0 0 0-9-26 19 19 0 0 0-36-4 14 14 0 0 0-17 30z" />
      </g>
      <path className={styles.decorMountains} d="M0 330 90 262 150 296 250 214 336 290 420 246 520 300 610 226 700 284 800 240V450H0z" />
      <path className={styles.decorHills} d="M0 360C120 320 210 344 320 330S540 300 640 326 760 340 800 330V450H0z" />
      <path className={styles.decorLake} d="M0 392C160 380 300 396 420 388S680 380 800 390V450H0z" />
      {/* Jet d'eau (départ : Genève) et trajet en pointillés sur le lac */}
      <path className={styles.decorJet} d="M96 394C98 360 100 330 103 296C106 330 108 360 110 394Z" />
      <circle className={styles.decorJet} cx="106" cy="296" r="7" />
      <circle className={styles.decorJet} cx="116" cy="304" r="5" opacity=".8" />
      <path className={styles.decorPath} d="M150 420C300 396 430 432 560 410S720 398 790 404" />
    </svg>
  );
}
