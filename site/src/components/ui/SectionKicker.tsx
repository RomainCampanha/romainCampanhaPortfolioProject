import type { ReactNode } from "react";
import { Coin } from "./Coin";
import { cx } from "./cx";
import type { IconName } from "./Icon";
import { toneAttr, type Tone } from "./tones";

type SectionKickerProps = {
  /** Icône dans la pastille (défaut : sparkle). null = sans pastille. */
  icon?: IconName | null;
  /** Sans ton : couleur d'accent du thème de page (pêche foncé, lilas foncé sur Chat). */
  tone?: Tone;
  as?: "p" | "span" | "div";
  className?: string;
  children: ReactNode;
};

/** Sur-titre de section : petite pastille d'icône + libellé en capitales espacées (au-dessus d'un h2). */
export function SectionKicker({ icon = "sparkle", tone, as: Component = "p", className, children }: SectionKickerProps) {
  return (
    <Component className={cx("kicker", className)} {...toneAttr(tone)}>
      {icon ? <Coin icon={icon} size="sm" /> : null}
      <span>{children}</span>
    </Component>
  );
}
