import type { ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";
import { toneAttr, type Tone } from "./tones";

export type CoinSize = "xs" | "sm" | "md" | "lg";

type CoinProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  icon: IconName;
  /** Pastel (fond 200 + icône 800). Sans ton : crème, icône couleur d'accent du thème. */
  tone?: Tone;
  /** xs 28 px · sm 32 px · md 40 px (défaut) · lg 48 px */
  size?: CoinSize;
};

/** Pastille ronde « argile » qui porte une icône (décorative). */
export function Coin({ icon, tone, size = "md", className, ...props }: CoinProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("coin", className)}
      data-size={size === "md" ? undefined : size}
      {...toneAttr(tone)}
      {...props}
    >
      <Icon name={icon} />
    </span>
  );
}
