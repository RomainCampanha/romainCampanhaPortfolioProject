import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "./cx";

export type BandTone = "theme" | "peach" | "lilac" | "oat" | "cream" | "sage" | "lake" | "butter";

type WavyBandProps = {
  as?: "section" | "div" | "aside";
  /**
   * Couleur de la bande. theme (défaut) = bande du thème de page (avoine foncé sur Pro,
   * pêche sur Hobby, lilas sur Chat) ; peach / lilac = bandes de page ; oat ; cream ;
   * sage / lake / butter = pastel 100.
   */
  tone?: BandTone;
  /** Bords ondulés (débordent de 27 px hors de la bande). Défaut : top. */
  edges?: "top" | "bottom" | "both" | "none";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"section">, "className" | "children">;

/**
 * Bande pleine largeur à bord ondulé (changement d'ambiance entre sections).
 * Ne pose pas de conteneur : mettre le contenu dans <div className="site-container">.
 * Prévoir ~28 px d'espace au-dessus (bord haut) / en dessous (bord bas) pour la vague.
 */
export function WavyBand({ as: Component = "section", tone = "theme", edges = "top", className, children, ...props }: WavyBandProps) {
  const edge = edges === "both" ? "top bottom" : edges === "none" ? undefined : edges;
  return (
    <Component
      className={cx("wavy-band", className)}
      data-tone={tone === "theme" ? undefined : tone}
      data-edge={edge}
      {...props}
    >
      {children}
    </Component>
  );
}
