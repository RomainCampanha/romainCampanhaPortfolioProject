import {
  COYOTE_TIME,
  DOUBLE_JUMP_VELOCITY,
  DT,
  FALL_DEPTH,
  GAP_EDGE,
  GRAVITY,
  JUMP_BUFFER,
  JUMP_VELOCITY,
  OBSTACLE_INSET,
  PLAYER_H,
  PLAYER_W,
  STAMP_RADIUS,
} from "./physics";
import type { Level, Obstacle, RunState } from "./types";

// Simulation du runner à pas de temps fixe (DT), indépendante du rendu : le rendu lit l'état
// et interpole entre prevX/prevY et x/y. Déterministe : mêmes entrées -> même partie (c'est ce
// qui permet au validateur de prouver qu'un niveau est faisable avec le vrai moteur).
// Collisions : boîtes alignées (AABB), un peu indulgentes (OBSTACLE_INSET, GAP_EDGE).

export function createRun(level: Level): RunState {
  return {
    step: 0,
    t: 0,
    x: level.startX,
    y: 0,
    vy: 0,
    prevX: level.startX,
    prevY: 0,
    grounded: true,
    jumps: 0,
    coyote: 0,
    buffer: 0,
    sinking: false,
    hearts: level.hearts,
    invulnerable: 0,
    stamps: 0,
    collected: new Uint8Array(level.stamps.length),
    knocked: new Uint8Array(level.obstacles.length),
    splashed: new Uint8Array(level.gaps.length),
    hits: 0,
    status: "running",
    finishedFor: 0,
    events: [],
  };
}

/** Bord gauche d'un obstacle à l'instant t (les pigeons volent vers la gauche après flyAt). */
export function obstacleX(o: Obstacle, t: number): number {
  return o.vx === 0 ? o.x : o.x - o.vx * Math.max(0, t - o.flyAt);
}

/** Index du trou sous le centre de Rominou (hors trous déjà « franchis » en tombant), ou -1. */
function gapUnder(level: Level, run: RunState, x: number): number {
  for (let i = 0; i < level.gaps.length; i++) {
    const g = level.gaps[i];
    if (run.splashed[i]) continue;
    if (x > g.x + GAP_EDGE && x < g.x + g.w - GAP_EDGE) return i;
  }
  return -1;
}

/** Avance la partie d'un pas fixe. `jump` = appui (front montant) pendant ce pas. */
export function stepRun(level: Level, run: RunState, jump: boolean): void {
  if (run.status === "failed") return;
  run.prevX = run.x;
  run.prevY = run.y;
  run.step += 1;
  run.t = run.step * DT;

  if (run.status === "finished") {
    // Après la porte : Rominou ralentit et s'arrête (célébration), sans collisions.
    run.finishedFor += DT;
    run.x += level.speed * Math.max(0, 1 - run.finishedFor / 0.9) * DT;
    if (!run.grounded) {
      run.vy -= GRAVITY * DT;
      run.y = Math.max(0, run.y + run.vy * DT);
      if (run.y === 0) {
        run.grounded = true;
        run.vy = 0;
      }
    }
    return;
  }

  // Saut : au sol (ou juste après le bord d'un trou), sinon double saut, sinon mémorisé.
  if (jump) run.buffer = JUMP_BUFFER;
  if (run.buffer > 0) {
    if (run.grounded || run.coyote > 0) {
      run.vy = JUMP_VELOCITY;
      run.grounded = false;
      run.coyote = 0;
      run.jumps = 1;
      run.buffer = 0;
      run.sinking = false;
      run.events.push({ type: "jump" });
    } else if (run.jumps < 2 && !run.sinking) {
      run.vy = DOUBLE_JUMP_VELOCITY;
      run.jumps = 2;
      run.buffer = 0;
      run.events.push({ type: "double" });
    } else {
      run.buffer = Math.max(0, run.buffer - DT);
    }
  }
  if (run.coyote > 0) run.coyote = Math.max(0, run.coyote - DT);

  // Vitesse horizontale constante : x ne dépend que du temps (pas de dérive d'arrondi).
  run.x = level.startX + level.speed * run.t;

  if (!run.grounded) {
    run.vy -= GRAVITY * DT;
    run.y += run.vy * DT;
  }
  const gap = gapUnder(level, run, run.x);
  if (run.grounded && gap >= 0) {
    // Bord d'un trou : chute, mais on peut encore sauter un court instant.
    run.grounded = false;
    run.vy = 0;
    run.coyote = COYOTE_TIME;
  } else if (!run.grounded && run.y <= 0 && run.vy <= 0) {
    // Atterrissage : on arrive d'au-dessus du sol (ou on remonte d'à peine quelques cm).
    if (gap < 0 && (run.prevY >= 0 || run.y > -0.08)) {
      run.y = 0;
      run.vy = 0;
      run.grounded = true;
      run.jumps = 0;
      run.sinking = false;
      run.events.push({ type: "land" });
    } else if (gap < 0 || run.y < -FALL_DEPTH) {
      // Contre la paroi du trou, ou tout au fond : plouf.
      fall(level, run, gap >= 0 ? gap : nearestGap(level, run.x));
      return;
    } else {
      run.sinking = true;
    }
  }

  if (run.invulnerable > 0) {
    run.invulnerable = Math.max(0, run.invulnerable - DT);
  } else {
    collideObstacles(level, run);
    if (run.status !== "running") return;
  }

  collectStamps(level, run);

  if (run.x >= level.gateX) {
    run.status = "finished";
    run.events.push({ type: "finish" });
  }
}

function nearestGap(level: Level, x: number): number {
  let best = -1;
  let distance = Number.POSITIVE_INFINITY;
  level.gaps.forEach((g, i) => {
    const d = Math.abs(g.x + g.w / 2 - x);
    if (d < distance) {
      distance = d;
      best = i;
    }
  });
  return best;
}

/** Tombé dans un trou : un cœur en moins, puis Rominou ressort d'un bond (le trou est franchi). */
function fall(level: Level, run: RunState, gapIndex: number) {
  if (gapIndex >= 0) run.splashed[gapIndex] = 1;
  run.hearts -= 1;
  run.hits += 1;
  run.sinking = false;
  run.events.push({ type: "splash", index: gapIndex, hearts: run.hearts });
  if (run.hearts <= 0) {
    run.status = "failed";
    run.events.push({ type: "fail" });
    return;
  }
  run.invulnerable = level.invulnerability;
  run.y = 0;
  run.vy = JUMP_VELOCITY * 0.95;
  run.grounded = false;
  run.jumps = 2;
}

function collideObstacles(level: Level, run: RunState) {
  const left = run.x - PLAYER_W / 2;
  const right = run.x + PLAYER_W / 2;
  const bottom = run.y;
  const top = run.y + PLAYER_H;
  for (let i = 0; i < level.obstacles.length; i++) {
    if (run.knocked[i]) continue;
    const o = level.obstacles[i];
    const ox = obstacleX(o, run.t);
    if (ox + o.w < left - 1 || ox > right + 1) continue;
    const oBottom = o.y > 0 ? o.y + OBSTACLE_INSET : 0;
    if (
      right > ox + OBSTACLE_INSET &&
      left < ox + o.w - OBSTACLE_INSET &&
      top > oBottom &&
      bottom < o.y + o.h - OBSTACLE_INSET
    ) {
      run.knocked[i] = 1;
      run.hearts -= 1;
      run.hits += 1;
      run.events.push({ type: "hit", index: i, hearts: run.hearts });
      if (run.hearts <= 0) {
        run.status = "failed";
        run.events.push({ type: "fail" });
        return;
      }
      run.invulnerable = level.invulnerability;
      return;
    }
  }
}

function collectStamps(level: Level, run: RunState) {
  const reach = PLAYER_W / 2 + STAMP_RADIUS;
  for (let i = 0; i < level.stamps.length; i++) {
    if (run.collected[i]) continue;
    const s = level.stamps[i];
    if (s.x > run.x + reach) break; // triés par x
    if (Math.abs(s.x - run.x) > reach) continue;
    if (s.y + STAMP_RADIUS >= run.y && s.y - STAMP_RADIUS <= run.y + PLAYER_H) {
      run.collected[i] = 1;
      run.stamps += 1;
      run.events.push({ type: "stamp", index: i });
    }
  }
}

/** Progression vers la porte (0 -> 1). */
export function runProgress(level: Level, run: RunState): number {
  const span = level.gateX - level.startX;
  return span <= 0 ? 1 : Math.min(1, Math.max(0, (run.x - level.startX) / span));
}
