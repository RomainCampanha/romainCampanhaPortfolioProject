import type { AriaAttributes, CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "./cx";

export type BubbleTail = "left" | "right" | "top" | "bottom" | "none";

type SpeechBubbleProps = {
  /**
   * Cartouche (nom de celui qui parle). Par défaut : « Rominou, le guide » (common.avatar.guideLabel).
   * null = pas de cartouche (petite bulle, aparté).
   */
  name?: string | null;
  /** Côté de la queue, vers celui qui parle (défaut : bottom). */
  tail?: BubbleTail;
  /** Côté de la queue à partir de lg (64rem), si différent (ex. bottom sur mobile, right sur desktop). */
  tailLg?: BubbleTail;
  /** Position de la queue le long de son bord (ex. "30%", "5rem"). */
  tailOffset?: string;
  tailOffsetLg?: string;
  /** md (défaut) : boîte de dialogue · sm : petite bulle sans bordure. */
  size?: "md" | "sm";
  /** Triangle « suite » qui sautille (dialogue de jeu ; figé si mouvement réduit). */
  showNext?: boolean;
  /** Annonce les changements de texte (visite guidée animée) aux lecteurs d'écran. */
  live?: AriaAttributes["aria-live"];
  as?: "div" | "figure" | "aside";
  className?: string;
  style?: CSSProperties;
  /** Texte de la bulle : une chaîne (rendue dans un <p>) ou des paragraphes. */
  children: ReactNode;
};

/** Boîte de dialogue « jeu cosy » avec le cartouche « Rominou, le guide ». Texte uniquement (pas de voix). */
export function SpeechBubble({
  name,
  tail = "bottom",
  tailLg,
  tailOffset,
  tailOffsetLg,
  size = "md",
  showNext = false,
  live,
  as: Component = "div",
  className,
  style,
  children,
}: SpeechBubbleProps) {
  const vars = {
    ...(tailOffset ? { "--tail-offset": tailOffset } : {}),
    ...(tailOffsetLg ? { "--tail-offset-lg": tailOffsetLg } : {}),
    ...style,
  } as CSSProperties;

  return (
    <Component
      className={cx("bubble", className)}
      data-tail={tail}
      data-tail-lg={tailLg}
      data-size={size === "md" ? undefined : size}
      data-has-next={showNext || undefined}
      style={vars}
    >
      {name === null ? null : name === undefined ? <GuideName /> : <p className="bubble-name">{name}</p>}
      <div className="bubble-text" aria-live={live}>
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
      {showNext ? <span aria-hidden="true" className="bubble-next" /> : null}
    </Component>
  );
}

/** Cartouche par défaut (traduit) ; isolé pour ne lire les messages que s'il est affiché. */
function GuideName() {
  const t = useTranslations("common.avatar");
  return <p className="bubble-name">{t("guideLabel")}</p>;
}
