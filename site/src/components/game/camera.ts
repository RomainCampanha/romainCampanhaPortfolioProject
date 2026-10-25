import { viewSpan } from "./frame";

// Cadrage de la caméra 3D (calcul pur, partagé par la caméra et la couche lointaine du décor) :
// vue de côté, Rominou au même endroit de l'écran quel que soit le format, chemin à ~21 % du bas
// (le décor et le monument de la ville gardent le reste, sous le HUD).

export const FOV = 30;
export const FOV_TAN = Math.tan(((FOV / 2) * Math.PI) / 180);
/** Inclinaison vers le bas (rad) : on voit le dessus du chemin, l'horizon reste bas. */
export const TILT = 0.05;
/** Hauteur minimale visible au niveau du chemin (m). */
const MIN_VIEW_HEIGHT = 6.4;

export type Framing = {
  /** Point visé au niveau du chemin (centre de l'écran). */
  x: number;
  y: number;
  distance: number;
  visibleW: number;
  visibleH: number;
};

export function frameFor(px: number, speed: number, aspect: number): Framing {
  const span = viewSpan(speed, aspect);
  const wanted = span.behind + span.ahead;
  const distance = Math.max(wanted / (2 * FOV_TAN * aspect), MIN_VIEW_HEIGHT / (2 * FOV_TAN));
  const visibleH = 2 * distance * FOV_TAN;
  const visibleW = visibleH * aspect;
  return {
    x: px - (span.behind / wanted) * visibleW + visibleW / 2,
    y: visibleH * (0.5 - (aspect < 1 ? 0.22 : 0.21)),
    distance,
    visibleW,
    visibleH,
  };
}
