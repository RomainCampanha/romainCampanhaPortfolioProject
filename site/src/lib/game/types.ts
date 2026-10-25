import type { TravelId } from "@/content/profile";

// Types partagés de « La course de Rominou » (logique pure, sans React ni three.js).
// Unités : mètres et secondes. Monde vu de côté : x vers la droite (sens de la course),
// y vers le haut, sol à y = 0.

/** Niveau 0 = Genève (profile.location), puis un niveau par voyage (id du voyage). */
export type LevelId = "geneve" | TravelId;

/** Mode tranquille : plus lent, plus d'espace, plus de cœurs (proposé si mouvement réduit). */
export type GameMode = "normal" | "tranquille";

/** Ce qu'il faut pour générer un niveau (dérivé de profile.ts par catalog.ts). */
export type LevelDef = {
  id: LevelId;
  /** Rang dans la carte du voyage : 0 = Genève (tutoriel), puis du plus ancien au plus récent. */
  index: number;
};

export type ObstacleKind = "cone" | "suitcase" | "bench" | "pigeon";

export type Obstacle = {
  kind: ObstacleKind;
  /** Bord gauche au départ (m). Les pigeons glissent ensuite vers Rominou (cf. vx). */
  x: number;
  /** Bas de l'obstacle (0 = posé au sol ; > 0 : pigeon en vol). */
  y: number;
  w: number;
  h: number;
  /** Valises : nombre de valises empilées (1 à 3). */
  stack: number;
  /** Vitesse de vol vers la gauche (m/s, pigeons) ; 0 = immobile. */
  vx: number;
  /** Instant (s) où le pigeon se met à voler (Rominou approche). */
  flyAt: number;
};

/** Trou dans le sol (eau du lac, flaque) : à sauter. */
export type Gap = { x: number; w: number };

/** Tampon de passeport à ramasser (score). */
export type Stamp = { x: number; y: number };

/** Conseils (bulles de Rominou), affichés quand Rominou passe à x : tutoriel, puis piles de 3. */
/** "tower" : avant la première pile de 3 d'une étape (double saut obligatoire). */
export type HintKey = "jump" | "stamps" | "gap" | "double" | "gate" | "tower";
export type Hint = { x: number; key: HintKey };

/** Groupe d'obstacles franchi d'un seul saut (unité de la validation). */
export type Pattern = {
  obstacles: number[];
  gaps: number[];
  /** Étendue horizontale au départ (m). */
  x0: number;
  x1: number;
};

export type Level = {
  id: LevelId;
  index: number;
  mode: GameMode;
  seed: number;
  /** Vitesse de course (m/s), constante pendant le niveau. */
  speed: number;
  /** Position de départ de Rominou (m). */
  startX: number;
  /** Position de la porte d'embarquement (arrivée, m). */
  gateX: number;
  hearts: number;
  /** Invulnérabilité après un choc (s). */
  invulnerability: number;
  /** Marge de timing minimale exigée par le validateur pour chaque saut (s). */
  minSlack: number;
  obstacles: Obstacle[];
  gaps: Gap[];
  stamps: Stamp[];
  hints: Hint[];
  patterns: Pattern[];
  /** Niveau raccourci (tests e2e uniquement, ?e2e=1). */
  short: boolean;
};

export type RunStatus = "running" | "finished" | "failed";

export type GameEvent =
  | { type: "jump" }
  | { type: "double" }
  | { type: "land" }
  | { type: "stamp"; index: number }
  | { type: "hit"; index: number; hearts: number }
  | { type: "splash"; index: number; hearts: number }
  | { type: "finish" }
  | { type: "fail" };

/** État d'une partie (muté en place par stepRun, à pas de temps fixe). */
export type RunState = {
  /** Nombre de pas simulés depuis le départ. */
  step: number;
  /** Temps simulé (s) = step × DT. */
  t: number;
  x: number;
  y: number;
  vy: number;
  /** Position au pas précédent (interpolation du rendu). */
  prevX: number;
  prevY: number;
  grounded: boolean;
  /** Sauts utilisés depuis le dernier appui au sol (0, 1 ou 2). */
  jumps: number;
  /** Temps restant pour sauter après avoir quitté le bord d'un trou (s). */
  coyote: number;
  /** Appui mémorisé juste avant l'atterrissage (s). */
  buffer: number;
  /** Dans un trou, sous le niveau du sol. */
  sinking: boolean;
  hearts: number;
  /** Invulnérabilité restante (s) : Rominou clignote. */
  invulnerable: number;
  stamps: number;
  collected: Uint8Array;
  /** Obstacles déjà percutés (renversés : plus de collision). */
  knocked: Uint8Array;
  /** Trous où Rominou est tombé (il en ressort d'un bond). */
  splashed: Uint8Array;
  hits: number;
  status: RunStatus;
  /** Temps écoulé depuis l'arrivée (s), pour la célébration. */
  finishedFor: number;
  /** Événements depuis la dernière lecture (sons, annonces, effets). */
  events: GameEvent[];
};
