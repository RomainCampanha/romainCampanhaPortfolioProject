import {
  DOUBLE_APEX,
  DT,
  GAP_EDGE,
  GRAVITY,
  JUMP_VELOCITY,
  OBSTACLE_INSET,
  PLAYER_W,
  SINGLE_AIRTIME,
  STAMP_RADIUS,
} from "./physics";
import { createRun, stepRun } from "./sim";
import type { Level, Pattern, RunState } from "./types";

// Validateur de faisabilité : prouve qu'un niveau généré peut être terminé SANS PERDRE UN
// SEUL CŒUR, avec une marge de timing humaine, en utilisant le vrai moteur (sim.ts).
// 1. Contrôles analytiques : hauteur des obstacles vs double saut, largeur des trous vs durée
//    d'un saut à cette vitesse, tampons hors des obstacles, durée du niveau.
// 2. Fenêtre de saut de chaque motif : on simule un saut (simple, sinon double) depuis chaque
//    pas de temps possible ; la fenêtre de décollage réussie doit durer >= level.minSlack, et
//    rester ouverte quel que soit le moment où le joueur a sauté au motif précédent.
// 3. Partie complète jouée par un « pilote » (sauts au milieu de chaque fenêtre) : 0 choc, arrivée.
// Le double saut n'est exigé que devant une pile de 3 valises (annoncée par un conseil) : jamais
// ailleurs, donc jamais en mode tranquille.
// Utilisé par e2e/game.spec.ts sur tous les niveaux, dans les deux modes.

/** Temps minimal au sol entre deux sauts enchaînés (s) : l'appui peut être anticipé (buffer). */
const GROUND_TIME = 0.12;
/** Pas de double saut essayés (après le décollage), autour du sommet du premier saut. */
const APEX_STEPS = Math.round(JUMP_VELOCITY / GRAVITY / DT);
const DOUBLE_TIMINGS = [APEX_STEPS, APEX_STEPS - 12, APEX_STEPS + 8, APEX_STEPS - 22];
/** Durée acceptée d'un niveau complet (s). */
const DURATION_RANGE: [number, number] = [38, 62];

export type PlannedJump = { step: number; doubleAfter: number | null };

export type PatternCheck = {
  pattern: number;
  /** Fenêtre de décollage (pas) et sa durée (s). */
  window: [number, number];
  slack: number;
  double: boolean;
};

export type ValidationReport = {
  ok: boolean;
  issues: string[];
  checks: PatternCheck[];
  plan: PlannedJump[];
  /** Plus petite fenêtre de saut du niveau (s). */
  tightest: number;
  /** Durée du niveau à vitesse constante (s). */
  duration: number;
};

const stepAtX = (level: Level, x: number) => Math.ceil((x - level.startX) / level.speed / DT);

/** Partie isolée : seulement les obstacles et trous du motif. */
function patternLevel(level: Level, pattern: Pattern): Level {
  return {
    ...level,
    obstacles: pattern.obstacles.map((i) => level.obstacles[i]),
    gaps: pattern.gaps.map((i) => level.gaps[i]),
    stamps: [],
    gateX: Number.POSITIVE_INFINITY,
  };
}

/** Place une partie à l'instant `step`, au sol (x ne dépend que du temps). */
function runAt(level: Level, step: number): RunState {
  const run = createRun(level);
  run.step = step;
  run.t = step * DT;
  run.x = level.startX + level.speed * run.t;
  run.prevX = run.x;
  return run;
}

/**
 * Saute à `takeoff` (et double saut `doubleAfter` pas plus tard) : renvoie le pas
 * d'atterrissage après le motif, ou null en cas de choc / chute.
 */
function tryJump(sub: Level, pattern: Pattern, takeoff: number, doubleAfter: number | null): number | null {
  // Départ au sol au plus tard 1 m avant le motif : au bord d'un trou, la chute (et le court
  // délai pour sauter encore) est simulée comme en vrai.
  const run = runAt(sub, Math.min(takeoff - 1, stepAtX(sub, pattern.x0 - 1)));
  const end = pattern.x1 + PLAYER_W;
  for (let i = 0; i < 600; i++) {
    const step = run.step + 1;
    const press = step === takeoff || (doubleAfter !== null && step === takeoff + doubleAfter);
    stepRun(sub, run, press);
    if (run.hits > 0) return null;
    if (run.grounded && run.x > end) return run.step;
  }
  return null;
}

type Window = { a: number; b: number; landing: number; double: number | null };

/** Première fenêtre contiguë de décollages réussis à partir de `earliest`. */
function findWindow(level: Level, pattern: Pattern, earliest: number, doubleAfter: number | null): Window | null {
  const sub = patternLevel(level, pattern);
  const from = Math.max(earliest, stepAtX(level, pattern.x0 - level.speed * 1.4));
  const to = stepAtX(level, pattern.x1 + 0.2);
  let start = -1;
  let landing = 0;
  for (let s = from; s <= to + 1; s++) {
    const land = s <= to ? tryJump(sub, pattern, s, doubleAfter) : null;
    if (land !== null) {
      if (start < 0) start = s;
      landing = Math.max(landing, land);
    } else if (start >= 0) {
      return { a: start, b: s - 1, landing, double: doubleAfter };
    }
  }
  return null;
}

export function validateLevel(level: Level): ValidationReport {
  const issues: string[] = [];
  const duration = (level.gateX - level.startX) / level.speed;

  // 1. Contrôles analytiques ------------------------------------------------------------
  if (!level.short && (duration < DURATION_RANGE[0] || duration > DURATION_RANGE[1])) {
    issues.push(`durée ${duration.toFixed(1)} s hors de [${DURATION_RANGE.join(", ")}]`);
  }
  level.obstacles.forEach((o, i) => {
    const top = o.y + o.h - OBSTACLE_INSET;
    if (top > DOUBLE_APEX - 0.25) issues.push(`obstacle ${i} (${o.kind}) trop haut : ${top.toFixed(2)} m`);
  });
  const maxGap = level.speed * (SINGLE_AIRTIME - level.minSlack) + 2 * GAP_EDGE;
  level.gaps.forEach((g, i) => {
    if (g.w > maxGap) issues.push(`trou ${i} trop large : ${g.w.toFixed(2)} m > ${maxGap.toFixed(2)} m`);
  });
  level.stamps.forEach((s, i) => {
    for (const o of level.obstacles) {
      if (o.vx !== 0) continue;
      const inside =
        s.x + STAMP_RADIUS > o.x && s.x - STAMP_RADIUS < o.x + o.w && s.y - STAMP_RADIUS < o.y + o.h;
      if (inside) issues.push(`tampon ${i} dans un obstacle (${o.kind})`);
    }
  });
  for (let i = 1; i < level.patterns.length; i++) {
    if (level.patterns[i].x0 <= level.patterns[i - 1].x1) issues.push(`motifs ${i - 1} et ${i} se chevauchent`);
  }
  const lastPattern = level.patterns.at(-1);
  if (lastPattern && lastPattern.x1 >= level.gateX) issues.push("un obstacle bloque la porte d'embarquement");

  // 2. Fenêtres de saut, motif par motif -----------------------------------------------------
  const checks: PatternCheck[] = [];
  const plan: PlannedJump[] = [];
  const minSteps = Math.ceil(level.minSlack / DT);
  let earliest = 1;
  let tightest = Number.POSITIVE_INFINITY;
  level.patterns.forEach((pattern, index) => {
    let best: Window | null = null;
    for (const doubleAfter of [null, ...DOUBLE_TIMINGS]) {
      const w = findWindow(level, pattern, earliest, doubleAfter);
      if (w && (!best || w.b - w.a > best.b - best.a)) best = w;
      if (best && best.b - best.a + 1 >= minSteps) break;
    }
    if (!best) {
      issues.push(`motif ${index} (x=${pattern.x0.toFixed(1)}) infranchissable`);
      return;
    }
    const slack = (best.b - best.a + 1) * DT;
    tightest = Math.min(tightest, slack);
    if (best.b - best.a + 1 < minSteps) {
      issues.push(
        `motif ${index} (x=${pattern.x0.toFixed(1)}) : fenêtre de ${Math.round(slack * 1000)} ms < ${Math.round(level.minSlack * 1000)} ms`,
      );
    }
    const tower = pattern.obstacles.some((i) => level.obstacles[i].stack >= 3);
    if (best.double !== null && !tower) {
      issues.push(`motif ${index} (x=${pattern.x0.toFixed(1)}) : double saut exigé sans pile de 3`);
    }
    checks.push({ pattern: index, window: [best.a, best.b], slack, double: best.double !== null });
    plan.push({ step: Math.round((best.a + best.b) / 2), doubleAfter: best.double });
    // Quel que soit le moment du saut dans la fenêtre, le motif suivant reste jouable.
    earliest = best.landing + Math.ceil(GROUND_TIME / DT);
  });

  // 3. Partie complète avec le pilote ------------------------------------------------------
  if (issues.length === 0) {
    const run = createRun(level);
    const presses = new Set<number>();
    for (const jump of plan) {
      presses.add(jump.step);
      if (jump.doubleAfter !== null) presses.add(jump.step + jump.doubleAfter);
    }
    const limit = stepAtX(level, level.gateX) + 240;
    while (run.status === "running" && run.step < limit) {
      stepRun(level, run, presses.has(run.step + 1));
    }
    if (run.status !== "finished") issues.push(`partie pilotée : ${run.status} à x=${run.x.toFixed(1)}`);
    if (run.hits > 0) issues.push(`partie pilotée : ${run.hits} choc(s)`);
  }

  return {
    ok: issues.length === 0,
    issues,
    checks,
    plan,
    tightest: Number.isFinite(tightest) ? tightest : 0,
    duration,
  };
}
