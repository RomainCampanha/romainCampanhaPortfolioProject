import { DT, MAX_STEPS_PER_FRAME } from "./physics";

// Boucle de jeu (navigateur) : UNE seule boucle requestAnimationFrame qui fait avancer la
// simulation à pas fixe (DT) puis demande une image au rendu, avec le reste du temps
// accumulé (alpha, 0..1) pour interpoler les positions. Arrêtée en pause / onglet caché.

export type LoopHandlers = {
  /** Un pas de simulation fixe. */
  step: () => void;
  /** Une image : alpha = fraction du pas suivant déjà écoulée ; now en ms. */
  render: (alpha: number, now: number) => void;
};

export class GameLoop {
  private raf = 0;
  private last = 0;
  private accumulator = 0;
  private running = false;

  constructor(private readonly handlers: LoopHandlers) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.accumulator = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** Dessine une image sans avancer (pause, redimensionnement). */
  renderOnce(): void {
    this.handlers.render(this.accumulator / DT, performance.now());
  }

  private tick = (now: number) => {
    if (!this.running) return;
    // Borne les gros écarts (onglet en arrière-plan, à-coup) : le jeu ralentit plutôt que de sauter.
    const elapsed = Math.min(Math.max(now - this.last, 0) / 1000, MAX_STEPS_PER_FRAME * DT);
    this.last = now;
    this.accumulator += elapsed;
    let steps = 0;
    while (this.accumulator >= DT && steps < MAX_STEPS_PER_FRAME) {
      this.handlers.step();
      this.accumulator -= DT;
      steps++;
      if (!this.running) return;
    }
    this.handlers.render(this.accumulator / DT, now);
    if (this.running) this.raf = requestAnimationFrame(this.tick);
  };
}
