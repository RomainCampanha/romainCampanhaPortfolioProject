// Constantes physiques du runner (pas de temps fixe) et formules de saut utilisées par le
// générateur (placement prudent) et le validateur (contrôles analytiques).

/** Pas de simulation fixe (s) : la logique est indépendante de la fréquence d'affichage. */
export const DT = 1 / 120;
/** Au plus N pas par image (onglet ralenti, gros à-coup) : pas de « spirale de la mort ». */
export const MAX_STEPS_PER_FRAME = 12;

export const GRAVITY = 30;
export const JUMP_VELOCITY = 10.5;
export const DOUBLE_JUMP_VELOCITY = 9;
/** Saut encore permis juste après avoir quitté le bord d'un trou (s). */
export const COYOTE_TIME = 0.08;
/** Un appui juste avant l'atterrissage déclenche le saut à l'atterrissage (s). */
export const JUMP_BUFFER = 0.12;

/** Boîte de collision de Rominou (centrée sur x, pieds à y). Un peu plus fine que le modèle. */
export const PLAYER_W = 0.5;
export const PLAYER_H = 1.45;

/** Indulgence des boîtes d'obstacles (m retirés de chaque côté et en haut). */
export const OBSTACLE_INSET = 0.06;
/** Indulgence des bords de trou : on tient debout tant que le centre est à moins de ça du bord. */
export const GAP_EDGE = 0.15;
/** Profondeur à laquelle on considère Rominou tombé dans un trou (m). */
export const FALL_DEPTH = 1.1;
/** Rayon de ramassage d'un tampon (m, ajouté à la boîte de Rominou). */
export const STAMP_RADIUS = 0.32;
/** Un pigeon s'envole quand Rominou est à cette distance (m). */
export const PIGEON_WAKE_DISTANCE = 16;

/** Hauteur max des pieds avec un saut simple (m). */
export const SINGLE_APEX = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);
/** Durée d'un saut simple, du décollage à l'atterrissage (s). */
export const SINGLE_AIRTIME = (2 * JUMP_VELOCITY) / GRAVITY;
/** Hauteur max des pieds avec un double saut déclenché au sommet du premier (m). */
export const DOUBLE_APEX = SINGLE_APEX + (DOUBLE_JUMP_VELOCITY * DOUBLE_JUMP_VELOCITY) / (2 * GRAVITY);
/** Durée en l'air avec un double saut au sommet (s). */
export const DOUBLE_AIRTIME =
  JUMP_VELOCITY / GRAVITY +
  (DOUBLE_JUMP_VELOCITY + Math.sqrt(DOUBLE_JUMP_VELOCITY ** 2 + 2 * GRAVITY * SINGLE_APEX)) / GRAVITY;

/** Temps passé avec les pieds au-dessus de `height` pendant un saut simple (s ; 0 si inatteignable). */
export function singleTimeAbove(height: number): number {
  const disc = JUMP_VELOCITY * JUMP_VELOCITY - 2 * GRAVITY * height;
  return disc <= 0 ? 0 : (2 * Math.sqrt(disc)) / GRAVITY;
}

/**
 * Temps passé au-dessus de `height` avec un double saut au sommet du premier (s) : montée du
 * premier saut, puis seconde parabole depuis SINGLE_APEX.
 */
export function doubleTimeAbove(height: number): number {
  if (height >= DOUBLE_APEX) return 0;
  // Premier saut : du moment où l'on dépasse height jusqu'au sommet.
  const firstDisc = JUMP_VELOCITY * JUMP_VELOCITY - 2 * GRAVITY * height;
  const rise = firstDisc <= 0 ? 0 : Math.sqrt(firstDisc) / GRAVITY;
  // Seconde parabole : y = SINGLE_APEX + v1 τ − g τ² / 2 ≥ height.
  const v1 = DOUBLE_JUMP_VELOCITY;
  const disc = v1 * v1 + 2 * GRAVITY * (SINGLE_APEX - height);
  const tauEnd = (v1 + Math.sqrt(disc)) / GRAVITY;
  const tauStart = height > SINGLE_APEX ? (v1 - Math.sqrt(disc)) / GRAVITY : 0;
  return rise + (tauEnd - tauStart);
}

/** Largeur max d'un trou franchissable d'un saut simple à `speed`, avec `slack` s de marge. */
export function maxGapWidth(speed: number, slack: number): number {
  return speed * (SINGLE_AIRTIME - slack) + 2 * GAP_EDGE;
}
