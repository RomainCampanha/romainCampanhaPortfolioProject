import type { ModelQuality } from "./assets";

// Détection des capacités de l'appareil (client uniquement, évalué une seule fois).

let webgl2: boolean | undefined;

/** three.js (r163+) exige WebGL 2. Résultat mis en cache, contexte de test libéré. */
export function supportsWebGL2(): boolean {
  if (webgl2 !== undefined) return webgl2;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    webgl2 = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl2 = false;
  }
  return webgl2;
}

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/** Petit écran, peu de mémoire ou mode économie de données => modèle mobile (plus léger). */
export function preferredModelQuality(): ModelQuality {
  const nav = navigator as NavigatorHints;
  const smallScreen = window.matchMedia("(max-width: 767px)").matches;
  const touchTablet = window.matchMedia("(pointer: coarse) and (max-width: 1024px)").matches;
  const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory < 4;
  const fewCores = nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2;
  const saveData = nav.connection?.saveData === true;
  return smallScreen || touchTablet || lowMemory || fewCores || saveData ? "mobile" : "desktop";
}
