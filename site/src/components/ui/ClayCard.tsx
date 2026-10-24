import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import { toneAttr, type Tone } from "./tones";

type SurfaceElement = "div" | "section" | "article" | "aside" | "figure" | "li" | "ol" | "ul" | "header";

type ClayCardProps = {
  as?: SurfaceElement;
  /**
   * raised (défaut) : surface en argile (reflet + épaisseur + ombre douce).
   * well : plateau en creux (rail, barre d'inventaire, mur).
   */
  variant?: "raised" | "well";
  /** Pastel : face 100 + épaisseur 300 (ou face 300 + épaisseur 500 avec shade="strong"). */
  tone?: Tone;
  shade?: "soft" | "strong";
  /** Rayon : md 20 px · lg 28 px (défaut) · xl 40 px */
  radius?: "md" | "lg" | "xl";
  /** Épaisseur de l'argile : md 6 px (défaut) · sm 4 px (petites cartes) */
  depth?: "md" | "sm";
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

/**
 * Surface « pâte à modeler » de base (cartes, panneaux, plateaux). Aucun padding imposé :
 * le passer en utilitaires (p-6, sm:p-8…). Fond crème par défaut, l'épaisseur suit le thème.
 */
export function ClayCard({
  as,
  variant = "raised",
  tone,
  shade = "soft",
  radius = "lg",
  depth = "md",
  className,
  children,
  ...props
}: ClayCardProps) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cx("clay-card", className)}
      data-variant={variant === "raised" ? undefined : variant}
      data-shade={tone && shade === "strong" ? "strong" : undefined}
      data-radius={radius === "lg" ? undefined : radius}
      data-depth={depth === "md" ? undefined : depth}
      {...toneAttr(tone)}
      {...props}
    >
      {children}
    </Component>
  );
}
