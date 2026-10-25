// Hasard déterministe pour la génération des niveaux : même graine -> même niveau,
// sur tous les navigateurs (pas de Math.random).

/** Graine 32 bits stable d'une chaîne (FNV-1a). */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export type Rng = {
  /** Réel dans [0, 1). */
  next(): number;
  /** Réel dans [min, max). */
  range(min: number, max: number): number;
  /** Entier dans [min, max] (bornes incluses). */
  int(min: number, max: number): number;
  /** true avec la probabilité p. */
  chance(p: number): boolean;
  /** Élément tiré selon des poids positifs (au moins un poids > 0). */
  weighted<T extends string>(weights: Partial<Record<T, number>>): T;
};

/** Générateur mulberry32 (rapide, bonne distribution pour un jeu). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    weighted<T extends string>(weights: Partial<Record<T, number>>): T {
      const entries = Object.entries(weights) as [T, number][];
      const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
      let roll = next() * total;
      for (const [key, w] of entries) {
        roll -= Math.max(0, w);
        if (roll < 0) return key;
      }
      return entries[entries.length - 1][0];
    },
  };
}
