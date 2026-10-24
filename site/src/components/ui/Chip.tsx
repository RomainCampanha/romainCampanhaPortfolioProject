import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";
import { toneAttr, type Tone } from "./tones";

type ChipProps = {
  /** li dans une liste de chips (<ul className="flex flex-wrap gap-2.5">), span sinon. */
  as?: "span" | "li" | "p" | "div";
  /** Sans ton : pilule avoine bordée (compétence). Avec ton : pastel 100 / texte 800. */
  tone?: Tone;
  icon?: IconName;
  /** Étiquette en fin de chip (ex. <Tag tone="sage">ESIG</Tag>). */
  tag?: ReactNode;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"span">, "className" | "children">;

/**
 * Pilule d'information (compétence, ville, passion). Statique : pour une chip cliquable,
 * poser className="chip" (+ data-tone) directement sur un <button> ou un lien.
 */
export function Chip({ as: Component = "span", tone, icon, tag, className, children, ...props }: ChipProps) {
  return (
    <Component className={cx("chip", className)} {...toneAttr(tone)} {...props}>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {tag}
    </Component>
  );
}

type TagProps = {
  tone?: Tone;
  /**
   * Préfixe lu uniquement par les lecteurs d'écran (ex. ", provenance : ") pour que
   * « Java ESIG » soit annoncé « Java, provenance : ESIG ».
   */
  srPrefix?: string;
  className?: string;
  children: ReactNode;
};

/** Petite étiquette pastel en capitales (provenance, catégorie). */
export function Tag({ tone, srPrefix, className, children }: TagProps) {
  return (
    <span className={cx("tag", className)} {...toneAttr(tone)}>
      {srPrefix ? <span className="sr-only">{srPrefix}</span> : null}
      {children}
    </span>
  );
}

/** Mot surligné au feutre pastel dans un texte (ex. « chez <Highlight tone="lake">Infomaniak</Highlight> »). */
export function Highlight({ tone = "butter", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <mark className={cx("hl", className)} data-tone={tone}>
      {children}
    </mark>
  );
}
