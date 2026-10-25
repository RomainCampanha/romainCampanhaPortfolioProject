// Couleurs des rendus du jeu, lues dans les tokens du design system (globals.css) : le canvas
// et three.js ont besoin de valeurs, pas de classes. Le ton de l'étape (--tone-*) vient de
// l'attribut data-tone de l'écran de jeu. Les mondes des villes (themes.ts) composent leurs
// teintes à partir de ces tokens (mix), jamais de couleur en dur.

const TOKENS = {
  cream: "--color-cream",
  oat: "--color-oat",
  oatDeep: "--color-oat-deep",
  sand: "--color-sand",
  creamEdge: "--color-cream-edge",
  ink: "--color-ink",
  inkSoft: "--color-ink-soft",
  clay: "--color-clay",
  clayEdge: "--color-clay-edge",
  tone100: "--tone-100",
  tone200: "--tone-200",
  tone300: "--tone-300",
  tone500: "--tone-500",
  tone800: "--tone-800",
  sage100: "--color-sage-100",
  sage200: "--color-sage-200",
  sage300: "--color-sage-300",
  sage500: "--color-sage-500",
  sage800: "--color-sage-800",
  lake100: "--color-lake-100",
  lake200: "--color-lake-200",
  lake300: "--color-lake-300",
  lake500: "--color-lake-500",
  lake800: "--color-lake-800",
  lilac100: "--color-lilac-100",
  lilac200: "--color-lilac-200",
  lilac300: "--color-lilac-300",
  lilac500: "--color-lilac-500",
  lilac800: "--color-lilac-800",
  peach100: "--color-peach-100",
  peach200: "--color-peach-200",
  peach300: "--color-peach-300",
  peach500: "--color-peach-500",
  peach800: "--color-peach-800",
  butter100: "--color-butter-100",
  butter200: "--color-butter-200",
  butter300: "--color-butter-300",
  butter500: "--color-butter-500",
  butter800: "--color-butter-800",
} as const;

export type Palette = Record<keyof typeof TOKENS, string>;

/** Lit la palette sur un élément (hérite du ton de l'écran). Repli : encre / crème. */
export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const palette = {} as Palette;
  for (const [key, variable] of Object.entries(TOKENS) as [keyof Palette, string][]) {
    palette[key] = style.getPropertyValue(variable).trim() || (key === "ink" ? "#2b2433" : "#fffbf4");
  }
  return palette;
}

/* ------------------------------------------------------------------ Mélanges de tokens */

function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) return [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16)) as [number, number, number];
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
  }
  return null;
}

const toHex = (rgb: number[]) =>
  `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

/** Mélange sRGB de deux couleurs hexadécimales (t = 0 : a, t = 1 : b), comme color-mix(in srgb). */
export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return t < 0.5 ? a : b;
  return toHex(ca.map((v, i) => v + (cb[i] - v) * t));
}
