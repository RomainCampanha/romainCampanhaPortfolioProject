"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { GameMode } from "@/lib/game/types";
import { cx } from "@/components/ui/cx";
import styles from "./game.module.css";

/** Interrupteur « Mode tranquille » (role="switch"), avec sa description. */
export function ModeSwitch({
  mode,
  onChange,
  hint,
  className,
}: {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
  hint?: string;
  className?: string;
}) {
  const t = useTranslations("game.mode");
  const hintId = useId();
  const on = mode === "tranquille";

  return (
    <div className={cx(styles.mode, className)}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-describedby={hint ? hintId : undefined}
        className={styles.switch}
        onClick={() => onChange(on ? "normal" : "tranquille")}
      >
        <span aria-hidden="true" className={styles.switchTrack}>
          <span className={styles.switchKnob} />
        </span>
        {t("label")}
      </button>
      {hint ? (
        <p id={hintId} className={styles.modeHint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
