/**
 * Les 5 familles pastel du design system. Chaque ton fournit --tone-100/200/300/500/800
 * (cf. globals.css) ; le texte posé sur un pastel utilise TOUJOURS sa teinte -800 (AA).
 */
export const TONES = ["sage", "peach", "butter", "lake", "lilac"] as const;
export type Tone = (typeof TONES)[number];

/** Attribut à poser sur un élément pour lui donner un ton (undefined = neutre crème). */
export function toneAttr(tone: Tone | undefined): { "data-tone"?: Tone } {
  return tone ? { "data-tone": tone } : {};
}
