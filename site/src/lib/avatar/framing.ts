import config from "./stage-config.json";
import type { AvatarAnchorVariant } from "./store";

// Cadrage de Rominou. La "boîte de scène" (poster ET canvas) a toujours le même ratio
// (2:3), centrée dans l'ancre : la caméra est donc fixe pour chaque variante et le poster
// se superpose exactement au rendu 3D (aucun saut quand la 3D remplace le poster).

export type Framing = {
  /** Haut de la zone cadrée (m). */
  top: number;
  /** Hauteur de la zone cadrée (m). */
  height: number;
};

const [aspectW, aspectH] = config.aspect;

/** Ratio largeur / hauteur de la boîte de scène. */
export const STAGE_ASPECT = aspectW / aspectH;
/** Valeur CSS aspect-ratio correspondante. */
export const STAGE_ASPECT_CSS = `${aspectW} / ${aspectH}`;
/** Champ vertical de la caméra (degrés). */
export const STAGE_FOV = config.fov;
export const STAGE_LIGHTS = config.lights;

export const FRAMINGS: Record<AvatarAnchorVariant, Framing> = config.framings;

/** Cadrage utilisé pour rendre les posters (plein pied). */
export const POSTER_FRAMING: Framing = FRAMINGS[config.poster.framing as AvatarAnchorVariant];
export const POSTER_SIZE = { width: config.poster.width, height: config.poster.height };

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
