import type { CSSProperties, ReactNode } from "react";
import { useFormatter } from "next-intl";
import { cx } from "./cx";
import type { Tone } from "./tones";

type GaugeProps = {
  /** Valeur (0 -> max). */
  value: number;
  max?: number;
  /**
   * Nom accessible COMPLET, valeur comprise (ex. t("rateLabel", { rate }) = « Taux d'activité : 70 % »).
   * La jauge est annoncée comme une image avec ce texte.
   */
  label: string;
  /** Libellé visible avant la piste (optionnel). */
  caption?: ReactNode;
  /** Valeur affichée après la piste (défaut : pourcentage localisé). null = masquée. */
  valueText?: string | null;
  /** Défaut : lake (bleu lac). */
  tone?: Tone;
  /** md (défaut, 12 px) · lg (14 px) */
  size?: "md" | "lg";
  /** light : piste crème, pour une jauge posée sur un fond pastel du même ton (post-it). */
  track?: "default" | "light";
  /** Nombre d'encoches du HUD (défaut 7). */
  segments?: number;
  className?: string;
};

/** Jauge HUD segmentée (taux d'activité, progression), remplie en douceur à l'affichage. */
export function Gauge({
  value,
  max = 100,
  label,
  caption,
  valueText,
  tone = "lake",
  size = "md",
  track = "default",
  segments = 7,
  className,
}: GaugeProps) {
  const format = useFormatter();
  const ratio = Math.min(Math.max(value / max, 0), 1);
  const shown = valueText === undefined ? format.number(ratio, { style: "percent" }) : valueText;
  const style = { "--gauge-value": `${ratio * 100}%`, "--gauge-segments": segments } as CSSProperties;

  return (
    <span
      role="img"
      aria-label={label}
      className={cx("gauge", className)}
      data-tone={tone}
      data-size={size === "md" ? undefined : size}
      data-track={track === "default" ? undefined : track}
      style={style}
    >
      {caption ? (
        <span aria-hidden="true" className="gauge-label">
          {caption}
        </span>
      ) : null}
      <span aria-hidden="true" className="gauge-track">
        <span className="gauge-fill" />
      </span>
      {shown ? (
        <span aria-hidden="true" className="gauge-value">
          {shown}
        </span>
      ) : null}
    </span>
  );
}
