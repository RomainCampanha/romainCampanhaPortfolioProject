import { DT } from "@/lib/game/physics";
import type { Level, RunState } from "@/lib/game/types";

// Ce que les rendus (3D ou 2D) lisent à chaque image : la partie en cours (mutée par la
// simulation), l'interpolation et les instants des effets visuels. Aucun état React ici :
// les rendus lisent ce ref sans provoquer de re-rendu.

export type Phase = "loading" | "countdown" | "playing" | "paused" | "complete" | "failed";

export type Effects = {
  jumpAt: number;
  doubleAt: number;
  /** Hauteur des pieds au double saut (anneau de poussière). */
  doubleY: number;
  landAt: number;
  /** Position et force de l'atterrissage (plus de poussière après un double saut). */
  landX: number;
  landPower: number;
  hitAt: number;
  /** Choc contre un obstacle ou chute dans l'eau, et où. */
  hitKind: "hit" | "splash";
  hitX: number;
  /** Instant (temps simulé) où chaque tampon a été ramassé (-1 = pas encore). */
  collectedAt: Float32Array;
  /** Instant où chaque obstacle a été percuté (-1 = jamais). */
  knockedAt: Float32Array;
  /** Instant de l'arrivée (-1 = pas encore) : révérence et confettis. */
  finishAt: number;
};

export type FrameSource = {
  level: Level;
  run: RunState;
  fx: Effects;
  /** Fraction du pas suivant (interpolation). */
  alpha: number;
  phase: Phase;
  reducedMotion: boolean;
};

export function createEffects(level: Level): Effects {
  return {
    jumpAt: -1,
    doubleAt: -1,
    doubleY: 0,
    landAt: -1,
    landX: 0,
    landPower: 1,
    hitAt: -1,
    hitKind: "hit",
    hitX: 0,
    collectedAt: new Float32Array(level.stamps.length).fill(-1),
    knockedAt: new Float32Array(level.obstacles.length).fill(-1),
    finishAt: -1,
  };
}

/** Position interpolée de Rominou et temps simulé correspondant. */
export function interpolated(source: FrameSource): { x: number; y: number; t: number } {
  const { run, alpha } = source;
  const a = run.status === "failed" ? 1 : alpha;
  return {
    x: run.prevX + (run.x - run.prevX) * a,
    y: run.prevY + (run.y - run.prevY) * a,
    t: run.t - (1 - a) * DT,
  };
}

/** Clignotement d'invulnérabilité : < 3 éclats par seconde (WCAG 2.3.1). */
export function blinkHidden(run: RunState, t: number): boolean {
  return run.invulnerable > 0 && t % 0.4 > 0.26;
}

/** Secousse de la caméra au choc (pas en mode tranquille ni en mouvement réduit). */
export function shakeAmount(source: FrameSource, t: number): number {
  const { fx, reducedMotion, level } = source;
  if (reducedMotion || level.mode === "tranquille" || fx.hitAt < 0) return 0;
  const age = t - fx.hitAt;
  return age < 0 || age > 0.32 ? 0 : (1 - age / 0.32) ** 2;
}

/** Cadrage horizontal : mètres visibles derrière / devant Rominou selon la vitesse. */
export function viewSpan(speed: number, aspect: number): { behind: number; ahead: number } {
  const portrait = aspect < 1;
  return {
    behind: portrait ? 1.9 : 3.2,
    // Au moins 1,1 s de course visible devant, même en portrait (moins de recul derrière).
    ahead: portrait ? Math.max(5.8, speed * 1.1) : Math.max(6.5, speed * 1.15),
  };
}
