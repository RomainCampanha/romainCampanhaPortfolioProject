import { difficultyFor, type Difficulty, type PatternKind } from "./difficulty";
import {
  DOUBLE_AIRTIME,
  maxGapWidth,
  OBSTACLE_INSET,
  PIGEON_WAKE_DISTANCE,
  PLAYER_W,
  SINGLE_APEX,
  GRAVITY,
  singleTimeAbove,
} from "./physics";
import { createRng, hashSeed, type Rng } from "./rng";
import type { GameMode, Gap, Hint, Level, LevelDef, Obstacle, ObstacleKind, Pattern, Stamp } from "./types";

// Génération déterministe d'un niveau : même id + même mode -> même niveau (graine = hash de
// l'id). Les obstacles sont posés par « motifs » (un saut chacun), espacés selon la difficulté ;
// les tampons forment des rangées au sol, des arcs au-dessus des obstacles (récompense du saut)
// et quelques bonus en hauteur (double saut). Genève (niveau 0) suit un script de tutoriel.
// Ailleurs : ouverture en douceur (sauts simples pendant le mot d'accueil), puis tirage pondéré,
// avec au moins un exemplaire de chaque motif annoncé par la ville (oiseaux, piles, bancs…).
// Chaque niveau généré est vérifié par validate.ts (e2e/game.spec.ts : tous les niveaux).

/** Tailles des obstacles (m). Valise : par valise empilée. */
export const OBSTACLE_SIZE: Record<ObstacleKind, { w: number; h: number }> = {
  cone: { w: 0.5, h: 0.72 },
  suitcase: { w: 0.8, h: 0.62 },
  bench: { w: 1.7, h: 0.62 },
  pigeon: { w: 0.62, h: 0.42 },
};

/** Tutoriel de Genève : sauts simples d'abord, puis les trous ; le double saut en bonus. */
const TUTORIAL_SCRIPT: readonly PatternKind[] = [
  "cone",
  "suitcase",
  "cone",
  "suitcase",
  "gap",
  "cone",
  "bench",
  "suitcase",
  "gap",
  "cone",
  "suitcase",
  "bench",
  "gap",
  "cone",
];
/** Le bonus « double saut » du tutoriel arrive après ce motif. */
const TUTORIAL_DOUBLE_AFTER = 8;

/** Mot d'accueil de la ville (bulle de Rominou), en secondes de course depuis le départ. */
export const INTRO_SECONDS = 3.4;

/**
 * Ouverture d'une étape (pendant le mot d'accueil) : 1er motif = un saut simple tout doux,
 * 2e motif = un saut simple (jamais de pile, de paire ni d'oiseau d'emblée).
 */
const FIRST_OPENERS: Partial<Record<PatternKind, number>> = { cone: 1, suitcase: 1 };
const SECOND_OPENERS: readonly PatternKind[] = ["cone", "suitcase", "bench", "gap"];
/** Motifs « difficiles » : jamais deux fois de suite (les autres : pas trois fois). */
const HARD_PATTERNS: ReadonlySet<PatternKind> = new Set(["gap", "pigeon", "tower"]);
/**
 * Motifs garantis au moins une fois par étape (poids suffisant) : le mot d'accueil de chaque
 * ville annonce ses obstacles (bernaches, cerfs-volants, chariot de croissants…). Ce qui vole
 * arrive juste après l'ouverture ; le reste avant ~55 % de l'étape.
 */
const FEATURED_MIN_WEIGHT = 0.8;
const FLYER_DEADLINE = 2; // 3e ou 4e motif
const FEATURED_DEADLINE = 0.55;

/** Hauteur des tampons : au sol (ramassés en courant), bonus (double saut obligatoire). */
const GROUND_STAMP_Y = 0.6;
const BONUS_STAMP_Y = 3.9;
/** Pas entre deux tampons d'une rangée (m). */
const STAMP_STEP = 1.3;

/** Durée d'un niveau raccourci (tests e2e, ?e2e=1), en secondes. */
export const SHORT_LEVEL_SECONDS = 7;

export type GenerateOptions = {
  mode?: GameMode;
  /** Niveau raccourci (~7 s, 1 à 2 obstacles) : tests e2e uniquement. */
  short?: boolean;
};

type Builder = {
  def: LevelDef;
  d: Difficulty;
  rng: Rng;
  speed: number;
  startX: number;
  obstacles: Obstacle[];
  gaps: Gap[];
  stamps: Stamp[];
  hints: Hint[];
  patterns: Pattern[];
};

export function generateLevel(def: LevelDef, { mode = "normal", short = false }: GenerateOptions = {}): Level {
  const d = difficultyFor(def.index, mode);
  const seed = hashSeed(`${def.id}:${mode}`);
  const b: Builder = {
    def,
    d,
    rng: createRng(seed),
    speed: d.speed,
    startX: 0,
    obstacles: [],
    gaps: [],
    stamps: [],
    hints: [],
    patterns: [],
  };
  const tutorial = def.index === 0;
  const { speed, startX, rng } = b;
  const gateX = startX + speed * (short ? SHORT_LEVEL_SECONDS : d.duration);
  // Dernier motif au plus tard ~3 s avant la porte : l'arrivée reste dégagée (rangée de tampons).
  const lastPatternX = gateX - speed * (short ? 2.6 : 3.2);
  const maxPatterns = short ? (tutorial ? 1 : 2) : Number.POSITIVE_INFINITY;

  let cursor = startX + speed * (short ? 2.4 : d.leadIn);
  let count = 0;
  let previous: PatternKind | null = null;
  let beforePrevious: PatternKind | null = null;
  const seenHints = new Set<Hint["key"]>();
  // Hors tutoriel, un seul conseil : la première pile de 3 (double saut), après le mot d'accueil.
  const hint = (key: Hint["key"], x: number) => {
    if ((!tutorial && key !== "tower") || seenHints.has(key)) return;
    seenHints.add(key);
    b.hints.push({ key, x: Math.max(startX + speed * (tutorial ? 0.5 : INTRO_SECONDS), x) });
  };

  // Motifs vedettes de l'étape et date limite (rang du motif) pour les placer.
  const featured = tutorial
    ? []
    : (Object.keys(d.weights) as PatternKind[]).filter((k) => (d.weights[k] ?? 0) >= FEATURED_MIN_WEIGHT);
  const expected = (lastPatternX - cursor) / (speed * ((d.spacing[0] + d.spacing[1]) / 2 + 0.25));
  const flyerDeadline = FLYER_DEADLINE + (tutorial ? 0 : rng.int(0, 1));
  const deadline = (kind: PatternKind) =>
    kind === "pigeon" ? flyerDeadline : Math.max(flyerDeadline + 1, Math.floor(expected * FEATURED_DEADLINE));
  const placedKinds = new Set<PatternKind>();

  while (cursor < lastPatternX && count < maxPatterns) {
    let kind: PatternKind;
    if (tutorial) {
      kind = TUTORIAL_SCRIPT[count % TUTORIAL_SCRIPT.length];
    } else if (count === 0) {
      kind = rng.weighted(FIRST_OPENERS);
    } else if (count === 1) {
      kind = rng.weighted(only(d.weights, SECOND_OPENERS));
    } else {
      const due = featured.find((k) => !placedKinds.has(k) && count >= deadline(k));
      kind = due ?? rng.weighted(d.weights);
    }
    // On varie : jamais deux fois de suite le même motif « difficile », ni trois fois un autre.
    const repeated = kind === previous && (HARD_PATTERNS.has(kind) || kind === beforePrevious);
    if (!tutorial && repeated) kind = rng.weighted(without(d.weights, kind));
    placedKinds.add(kind);

    if (count === 0) hint("jump", cursor - speed * 2.4);
    if (kind === "gap") hint("gap", cursor - speed * 2.4);
    // La pile de 3 démarre une demi-seconde plus loin (cf. placePattern).
    if (kind === "tower") hint("tower", cursor - speed * 2.1);

    const placed = placePattern(b, kind, cursor);
    const arc = placed.arcable && rng.chance(d.arcChance);
    if (arc) {
      if (tutorial) hint("stamps", placed.x0 - speed * 2.6);
      addArc(b, (placed.x0 + placed.x1) / 2);
    }

    // Temps libre avant le motif suivant (+ marge après un double saut obligatoire).
    let free = rng.range(d.spacing[0], d.spacing[1]) + placed.extraAfter;
    const doubleBonus = tutorial ? count === TUTORIAL_DOUBLE_AFTER : rng.chance(d.bonusChance);
    if (doubleBonus) free = Math.max(free, DOUBLE_AIRTIME + 1.6);
    const zoneStart = placed.x1;
    const zoneEnd = Math.min(placed.x1 + free * speed, lastPatternX + speed);

    if (doubleBonus && zoneEnd - zoneStart >= speed * (DOUBLE_AIRTIME + 1.2)) {
      // Deux tampons en hauteur : seul un double saut les atteint (facultatif).
      const center = zoneStart + speed * 1.15;
      if (tutorial) hint("double", center - speed * 2.8);
      b.stamps.push({ x: center - 0.45, y: BONUS_STAMP_Y }, { x: center + 0.45, y: BONUS_STAMP_Y });
    } else if (tutorial || rng.chance(0.75)) {
      addRow(b, zoneStart + speed * 0.6, zoneEnd - speed * 0.5);
    }

    beforePrevious = previous;
    previous = kind;
    cursor = zoneStart + free * speed;
    count++;
  }

  // Dernière ligne droite : rangée de tampons jusqu'à la porte.
  const lastEnd = b.patterns.at(-1)?.x1 ?? startX + speed;
  addRow(b, Math.max(lastEnd + speed * 0.7, gateX - speed * 2.2), gateX - 1);
  hint("gate", gateX - speed * 3.2);

  b.stamps.sort((p, q) => p.x - q.x);
  b.hints.sort((p, q) => p.x - q.x);

  return {
    id: def.id,
    index: def.index,
    mode,
    seed,
    speed,
    startX,
    gateX,
    hearts: d.hearts,
    invulnerability: d.invulnerability,
    minSlack: d.minSlack,
    obstacles: b.obstacles,
    gaps: b.gaps,
    stamps: b.stamps,
    hints: b.hints,
    patterns: b.patterns,
    short,
  };
}

type Weights = Partial<Record<PatternKind, number>>;

/** Poids restreints à certains motifs (repli : un cône si aucun n'est permis). */
function only(weights: Weights, kinds: readonly PatternKind[]): Weights {
  const kept = Object.fromEntries(kinds.map((k) => [k, weights[k] ?? 0]).filter(([, w]) => (w as number) > 0));
  return Object.keys(kept).length ? kept : { cone: 1 };
}

/** Poids sans un motif (anti-répétition). */
function without(weights: Weights, kind: PatternKind): Weights {
  return only(weights, (Object.keys(weights) as PatternKind[]).filter((k) => k !== kind));
}

/**
 * Marge d'un saut simple au-dessus d'un obstacle posé (s) : temps passé plus haut que lui moins
 * le temps pour le traverser. C'est la fenêtre de décollage réussie.
 */
function singleJumpSlack(w: number, h: number, speed: number): number {
  return singleTimeAbove(h - OBSTACLE_INSET) - (w - 2 * OBSTACLE_INSET + PLAYER_W) / speed;
}

type Placed = { x0: number; x1: number; extraAfter: number; arcable: boolean };

function obstacle(kind: ObstacleKind, x: number, stack = 1, y = 0): Obstacle {
  const size = OBSTACLE_SIZE[kind];
  return { kind, x, y, w: size.w, h: size.h * stack, stack, vx: 0, flyAt: 0 };
}

/** Pose un motif à partir de x et l'enregistre (obstacles, trous, étendue). */
function placePattern(b: Builder, kind: PatternKind, x: number): Placed {
  const { d, rng, speed } = b;
  const added: Obstacle[] = [];
  const gaps: Gap[] = [];
  let x0 = x;
  let x1 = x;
  let extraAfter = 0;
  let arcable = true;

  switch (kind) {
    case "cone":
      added.push(obstacle("cone", x));
      break;
    case "suitcase":
      added.push(obstacle("suitcase", x));
      break;
    case "stack": {
      // Pile de 2 : d'un saut simple avec de la marge (lent : mode tranquille), sinon une valise.
      // Le double saut n'est jamais exigé ailleurs que devant une pile de 3 (cf. validate.ts).
      const { w, h } = OBSTACLE_SIZE.suitcase;
      const roomy = singleJumpSlack(w, 2 * h, speed) >= Math.min(d.minSlack + 0.06, 0.21);
      added.push(obstacle("suitcase", x, roomy ? 2 : 1));
      break;
    }
    case "tower":
      // 3 valises (1,86 m) : plus haut qu'un saut simple -> double saut obligatoire. Le double
      // saut part plus tôt : un peu plus d'élan avant la pile.
      x0 = x1 = x + speed * 0.5;
      added.push(obstacle("suitcase", x0, 3));
      extraAfter = 0.45;
      arcable = false;
      break;
    case "bench": {
      // Banc (large) : seulement s'il passe d'un saut simple avec de la marge, sinon une valise.
      const { w, h } = OBSTACLE_SIZE.bench;
      const roomy = singleJumpSlack(w, h, speed) >= Math.min(d.minSlack + 0.06, 0.21);
      added.push(obstacle(roomy ? "bench" : "suitcase", x));
      break;
    }
    case "pair": {
      // Deux obstacles proches, franchis d'un seul saut : écart borné par la physique. Valise
      // en second si elle passe, sinon deux cônes (plus étroits) ; à défaut, un seul cône.
      const top = Math.max(OBSTACLE_SIZE.cone.h, OBSTACLE_SIZE.suitcase.h) - OBSTACLE_INSET;
      const window = singleTimeAbove(top) - d.minSlack - 0.08;
      const w1 = OBSTACLE_SIZE.cone.w;
      const room = (second: ObstacleKind) =>
        speed * window - PLAYER_W - (w1 + OBSTACLE_SIZE[second].w - 2 * OBSTACLE_INSET);
      const wanted: ObstacleKind = rng.chance(0.5) ? "cone" : "suitcase";
      const second: ObstacleKind = room(wanted) >= 0.8 ? wanted : "cone";
      const maxSpace = room(second);
      if (maxSpace < 0.8) {
        added.push(obstacle("cone", x));
        break;
      }
      const space = rng.range(0.8, Math.min(1.6, maxSpace));
      added.push(obstacle("cone", x), obstacle(second, x + w1 + space));
      break;
    }
    case "gap": {
      const max = Math.min(d.gapWidth[1], maxGapWidth(speed, d.minSlack + 0.14));
      const w = rng.range(d.gapWidth[0], Math.max(d.gapWidth[0], max));
      gaps.push({ x, w });
      x1 = x + w;
      break;
    }
    case "pigeon": {
      // Le pigeon s'envole quand Rominou approche et glisse vers lui : on le pose plus loin
      // pour que la rencontre ait lieu à x (l'espacement entre motifs reste juste).
      const vx = d.pigeonSpeed;
      const shift = (vx * PIGEON_WAKE_DISTANCE) / (speed + vx);
      const bird = obstacle("pigeon", x + shift, 1, rng.range(d.pigeonY[0], d.pigeonY[1]));
      bird.vx = vx;
      bird.flyAt = Math.max(0, (bird.x - PIGEON_WAKE_DISTANCE - b.startX) / speed);
      added.push(bird);
      x1 = x + bird.w;
      break;
    }
  }

  const firstObstacle = b.obstacles.length;
  for (const o of added) {
    b.obstacles.push(o);
    if (o.vx === 0) x1 = Math.max(x1, o.x + o.w);
  }
  const firstGap = b.gaps.length;
  b.gaps.push(...gaps);
  b.patterns.push({
    obstacles: added.map((_, i) => firstObstacle + i),
    gaps: gaps.map((_, i) => firstGap + i),
    x0,
    x1,
  });
  return { x0, x1, extraAfter, arcable };
}

/** Arc de 3 tampons qui suit un saut simple centré sur x (ramassés seulement en sautant). */
function addArc(b: Builder, center: number) {
  const dt = 0.17;
  const step = b.speed * dt;
  const drop = (GRAVITY * dt * dt) / 2;
  const top = SINGLE_APEX + 0.75;
  b.stamps.push(
    { x: center - step, y: top - drop },
    { x: center, y: top },
    { x: center + step, y: top - drop },
  );
}

/** Rangée de tampons au sol entre from et to (rien si la place manque). */
function addRow(b: Builder, from: number, to: number) {
  const length = to - from;
  if (length < STAMP_STEP * 1.5) return;
  const count = Math.min(4, Math.floor(length / STAMP_STEP) + 1);
  const start = from + (length - (count - 1) * STAMP_STEP) / 2;
  for (let i = 0; i < count; i++) {
    const x = start + i * STAMP_STEP;
    // Jamais au-dessus d'un trou (on le ramasserait en tombant).
    if (b.gaps.some((g) => x > g.x - 0.5 && x < g.x + g.w + 0.5)) continue;
    b.stamps.push({ x, y: GROUND_STAMP_Y });
  }
}
