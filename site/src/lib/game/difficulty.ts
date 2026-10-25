import type { GameMode } from "./types";

// Courbe de difficulté : Genève est un tutoriel tout doux ; ensuite la vitesse, la densité et
// la variété des obstacles montent en douceur d'une étape à l'autre (légère accélération en
// fin de voyage : Busan est la plus exigeante, mais chaque saut garde une vraie marge, vérifiée
// par validate.ts). Nouveaux obstacles introduits un par un : pigeons et piles de 2 (Toronto),
// paires (Brighton), piles de 3 au double saut (Paris, jamais en mode tranquille).
// Le mode tranquille ralentit, espace, pardonne davantage (5 cœurs) et garde des sauts larges.

export type PatternKind = "cone" | "suitcase" | "bench" | "gap" | "pigeon" | "stack" | "pair" | "tower";

export type Difficulty = {
  /** Vitesse de course (m/s). */
  speed: number;
  /** Durée visée du niveau (s), de 40 à 60 s. */
  duration: number;
  /** Temps de course libre avant le premier obstacle (s). */
  leadIn: number;
  /** Temps de course entre deux obstacles (s) : [min, max]. */
  spacing: [number, number];
  /** Poids de tirage des motifs d'obstacles. */
  weights: Partial<Record<PatternKind, number>>;
  /** Largeur des trous (m) : [min, max] (le max est encore borné par la physique). */
  gapWidth: [number, number];
  /** Hauteur du bas des pigeons (m) : [min, max]. */
  pigeonY: [number, number];
  /** Vitesse de vol des pigeons (m/s). */
  pigeonSpeed: number;
  /** Probabilité d'un arc de tampons au-dessus d'un obstacle / d'un bonus en hauteur. */
  arcChance: number;
  bonusChance: number;
  hearts: number;
  invulnerability: number;
  /** Marge de timing minimale de chaque saut (s), vérifiée par le validateur. */
  minSlack: number;
};

/** Le rang de difficulté plafonne ici (si d'autres voyages s'ajoutent au profil). */
const MAX_RANK = 9;

export function difficultyFor(index: number, mode: GameMode): Difficulty {
  const rank = Math.min(Math.max(index, 0), MAX_RANK);
  const tutorial = rank === 0;
  const tranquille = mode === "tranquille";
  /** Étapes depuis Séoul (0 = Séoul, 7 = Busan). */
  const step = Math.max(0, rank - 1);

  const baseSpeed = tutorial ? 5.6 : 6.2 + 0.42 * step + 0.012 * step * step;
  const spacingMin = tutorial ? 2.5 : Math.max(1.05, 2.15 - 0.15 * step);
  const spacing: [number, number] = tranquille
    ? [spacingMin * 1.45 + 0.35, spacingMin * 1.45 + 1.3]
    : [spacingMin, spacingMin + (tutorial ? 1 : 0.85)];

  const weights: Partial<Record<PatternKind, number>> = tutorial
    ? { cone: 1 }
    : {
        cone: 3,
        suitcase: 3,
        bench: 2,
        gap: 2,
        stack: rank >= 2 ? 1.2 + 0.05 * step : 0.4,
        pigeon: rank >= 2 ? (1.5 + 0.25 * (rank - 2)) * (tranquille ? 0.7 : 1) : 0,
        pair: rank >= 3 ? 1 + 0.15 * (rank - 3) : 0,
        // Pile de 3 : double saut obligatoire (jamais en mode tranquille).
        tower: rank >= 4 && !tranquille ? 0.8 + 0.1 * (rank - 4) : 0,
      };

  return {
    speed: tranquille ? baseSpeed * 0.78 : baseSpeed,
    duration: Math.min(60, 42 + 2.2 * rank),
    leadIn: tutorial ? 4 : tranquille ? 3 : 2.6,
    spacing,
    weights,
    gapWidth: tutorial ? [1.2, 1.4] : tranquille ? [1.3, 1.4 + 0.12 * rank] : [1.4, 1.55 + 0.22 * rank],
    pigeonY: tranquille ? [0.7, 0.85] : rank >= 5 ? [0.7, 1.1] : [0.7, 0.95],
    pigeonSpeed: (1.1 + 0.1 * rank) * (tranquille ? 0.6 : 1),
    arcChance: tutorial ? 0.5 : 0.45,
    bonusChance: rank >= 1 ? 0.18 : 0,
    hearts: tranquille ? 5 : 3,
    invulnerability: tranquille ? 1.8 : 1.2,
    // Marge de saut : large au tutoriel et en mode tranquille, puis de 182 ms (Séoul) à 130 ms (Busan).
    minSlack: tutorial || tranquille ? 0.2 : Math.max(0.13, 0.19 - 0.0075 * rank),
  };
}
