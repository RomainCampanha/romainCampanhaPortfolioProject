import type { CSSProperties } from "react";
import Image from "next/image";
import { cx } from "./cx";

/** Têtes de Rominou (rendu 3D détouré, 160×160 WebP) : tenue normale et tenue vacances. */
const ROMINOU_HEADS = {
  default: "/brand/rominou-head.webp",
  vacances: "/brand/rominou-vacances-head.webp",
} as const;

type RominouHeadProps = {
  /** Diamètre en px. Sans valeur : 40 px, ou la taille fixée en CSS par le parent (--coin-size). */
  size?: number;
  outfit?: keyof typeof ROMINOU_HEADS;
  /**
   * Anneau : "cream" (défaut, anneau crème), "theme" (crème + liseré du thème, ex. avatar
   * du chat), "raised" (crème + épaisseur argile, ex. logo du header).
   */
  ring?: "cream" | "theme" | "raised";
  /** Texte alternatif ; vide par défaut (décoratif : le nom est écrit à côté). */
  alt?: string;
  className?: string;
};

/** Tête ronde de Rominou dans une pastille (marque, footer, avatar du chat). */
export function RominouHead({ size, outfit = "default", ring = "cream", alt = "", className }: RominouHeadProps) {
  const style = size ? ({ "--coin-size": `${size}px` } as CSSProperties) : undefined;
  return (
    <span className={cx("coin coin-avatar", className)} data-ring={ring === "cream" ? undefined : ring} style={style}>
      <Image
        src={ROMINOU_HEADS[outfit]}
        alt={alt}
        width={size ?? 48}
        height={size ?? 48}
        unoptimized
        draggable={false}
      />
    </span>
  );
}
