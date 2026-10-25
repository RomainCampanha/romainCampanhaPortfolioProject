// Mode de test e2e du jeu (Playwright, e2e/game.spec.ts), activé UNIQUEMENT par le paramètre
// d'URL explicite `?e2e=1` (ex. /hobby?e2e=1#jeu). Il :
// - raccourcit les niveaux (~7 s, 1 à 2 obstacles : generateLevel({ short: true })), sauf avec
//   `&full=1` (niveaux complets : le robot de test les joue de bout en bout) ;
// - range la progression sous une clé de stockage à part (la vraie progression est intacte) ;
// - expose l'état de la partie en lecture seule sur window.__rominouGame (+ mesures de rendu) ;
// - accepte `&renderer=2d` pour forcer le rendu 2D de secours (les navigateurs de test rendent
//   le WebGL en logiciel, trop lentement pour jouer une étape en temps réel).
// Sans ?e2e=1, rien ne change : niveaux complets, état non exposé, rendu choisi normalement.

export const E2E_PARAM = "e2e";

function param(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

/** Le jeu tourne-t-il en mode test e2e ? (client uniquement ; false côté serveur) */
export function isE2E(): boolean {
  if (typeof window === "undefined") return false;
  return param(E2E_PARAM) === "1";
}

/** Rendu forcé par un test (?e2e=1&renderer=2d), sinon null. */
export function forcedRenderer(): "2d" | null {
  if (!isE2E()) return null;
  return param("renderer") === "2d" ? "2d" : null;
}

/** Niveaux raccourcis ? (mode e2e, sauf ?e2e=1&full=1). */
export function shortLevels(): boolean {
  return isE2E() && param("full") !== "1";
}

/** Instantané lisible par les tests (window.__rominouGame.state()). */
export type E2EGameState = {
  screen: string;
  levelId: string;
  levelIndex: number;
  mode: string;
  status: string;
  /** Temps simulé (s) depuis le départ. */
  t: number;
  x: number;
  y: number;
  grounded: boolean;
  hearts: number;
  stamps: number;
  progress: number;
  renderer: string;
  /** Temps moyen entre deux images (ms) et coût du rendu 3D (appels de dessin, triangles). */
  frameMs: number;
  render: { calls: number; triangles: number; meshes: number; vertices: number; cpuMs: number } | null;
};

declare global {
  interface Window {
    __rominouGame?: { state: () => E2EGameState };
  }
}

/** Expose l'état en mode e2e seulement ; renvoie la fonction de nettoyage. */
export function exposeForE2E(state: () => E2EGameState): () => void {
  if (!isE2E()) return () => {};
  window.__rominouGame = { state };
  return () => {
    if (window.__rominouGame?.state === state) delete window.__rominouGame;
  };
}
