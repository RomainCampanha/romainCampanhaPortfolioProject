import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";
import type { Tone } from "./tones";

type StickerProps = {
  as?: "span" | "p" | "li" | "div";
  /** Défaut : butter (jaune beurre). */
  tone?: Tone;
  /** Défaut : sparkle. null = sans icône. */
  icon?: IconName | null;
  /** Inclinaison en degrés (défaut -2.5). Statique : non concernée par reduced-motion. */
  tilt?: number;
  /** md (défaut) · lg (stickers de passions : un peu plus grands, icône pleine teinte) */
  size?: "md" | "lg";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/** Étiquette autocollante légèrement penchée (bordure crème, ombre portée). */
export function Sticker({
  as: Component = "span",
  tone = "butter",
  icon = "sparkle",
  tilt = -2.5,
  size = "md",
  className,
  style,
  children,
}: StickerProps) {
  return (
    <Component
      className={cx("sticker", className)}
      data-tone={tone}
      data-size={size === "md" ? undefined : size}
      style={{ "--sticker-tilt": `${tilt}deg`, ...style } as CSSProperties}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Component>
  );
}
