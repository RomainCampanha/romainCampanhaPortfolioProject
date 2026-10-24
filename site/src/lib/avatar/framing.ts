import config from "./stage-config.json";
import type { AvatarAnchorVariant, AvatarOutfit } from "./store";

// Cadrage de Rominou. La "boîte de scène" (poster ET canvas) a toujours le même ratio
// (2:3) : la caméra est donc fixe pour chaque variante et le poster se superpose exactement
// au rendu 3D (aucun saut quand la 3D remplace le poster). Les cadres « fenêtre » de la DA
// Cosy (AvatarAnchor) placent cette boîte dans leur décor ; sans décor, elle est centrée.
// Pas d'import de three.js ici : ce module est chargé avec les pages (cf. look.ts pour le rendu).

export type Framing = {
  /** Haut de la zone cadrée (m). */
  top: number;
  /** Hauteur de la zone cadrée (m). */
  height: number;
};

const [aspectW, aspectH] = config.aspect;

/** Ratio largeur / hauteur de la boîte de scène (posé en CSS par AvatarFigure : --stage-aspect). */
export const STAGE_ASPECT = aspectW / aspectH;
/** Champ vertical de la caméra (degrés). */
export const STAGE_FOV = config.fov;

export const FRAMINGS: Record<AvatarAnchorVariant, Framing> = config.framings;

/** Cadrage utilisé pour rendre les posters (plein pied). */
export const POSTER_FRAMING: Framing = FRAMINGS[config.poster.framing as AvatarAnchorVariant];
export const POSTER_SIZE = { width: config.poster.width, height: config.poster.height };

/** Hauteur (m) du bas visible des chaussures en pose idle, par tenue (mesurée sur les posters). */
export const FEET_Y: Record<AvatarOutfit, number> = config.feet;
/** Hauteur (m) du haut des cheveux en pose idle, par tenue (mesurée sur les posters). */
export const HEAD_Y: Record<AvatarOutfit, number> = config.head;

/** Position de caméra qui cadre exactement `framing` dans la boîte de scène. */
export function cameraForFraming(framing: Framing): {
  position: [number, number, number];
  target: [number, number, number];
} {
  const centerY = framing.top - framing.height / 2;
  const distance = framing.height / 2 / Math.tan(((STAGE_FOV / 2) * Math.PI) / 180);
  return { position: [0, centerY, distance], target: [0, centerY, 0] };
}

/**
 * Placement CSS du poster (cadré plein pied) pour imiter un autre cadrage :
 * échelle (en % de la boîte) et décalage vertical du haut de l'image.
 */
export function posterPlacement(framing: Framing): { scale: number; offsetTop: number } {
  return {
    scale: POSTER_FRAMING.height / framing.height,
    offsetTop: (framing.top - POSTER_FRAMING.top) / framing.height,
  };
}

/**
 * Ligne des pieds dans la boîte de scène d'un cadrage : 0 = haut, 1 = bas (> 1 : pieds hors
 * cadre, ex. buste du chat). Sert à poser l'ombre de contact et l'île sous Rominou.
 */
export function feetFraction(framing: Framing, outfit: AvatarOutfit): number {
  return (framing.top - FEET_Y[outfit]) / framing.height;
}

/** Haut de la tête dans la boîte de scène d'un cadrage (0 = haut, 1 = bas). */
export function headFraction(framing: Framing, outfit: AvatarOutfit): number {
  return (framing.top - HEAD_Y[outfit]) / framing.height;
}
