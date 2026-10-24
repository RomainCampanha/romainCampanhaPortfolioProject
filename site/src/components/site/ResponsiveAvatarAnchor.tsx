"use client";

import { AvatarAnchor } from "@/components/three/AvatarAnchor";
import { useMediaQuery } from "@/lib/avatar/hooks";
import type { AvatarAnchorVariant } from "@/lib/avatar/store";

/** Breakpoint `lg` de Tailwind (64rem) : colonne latérale sticky à partir de là. */
const DESKTOP_QUERY = "(min-width: 64rem)";

type ResponsiveAvatarAnchorProps = {
  /** Variante sous `lg` (haut de page). */
  mobile?: AvatarAnchorVariant;
  /** Variante à partir de `lg` (colonne latérale). */
  desktop?: AvatarAnchorVariant;
  /** Hauteurs explicites par breakpoint (requis : container-type: size). */
  className?: string;
  /** Texte alternatif traduit ; sans label, l'avatar est décoratif. */
  label?: string;
};

// UNE seule ancre par page (la dernière enregistrée reçoit le Canvas) : on change
// sa variante selon la largeur au lieu de monter deux ancres masquées en CSS.
// Rendu serveur = variante mobile ; la bonne variante est appliquée à l'hydratation.
export function ResponsiveAvatarAnchor({
  mobile = "hero",
  desktop = "column",
  className,
  label,
}: ResponsiveAvatarAnchorProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  return (
    <AvatarAnchor
      variant={isDesktop ? desktop : mobile}
      className={className}
      label={label}
    />
  );
}
