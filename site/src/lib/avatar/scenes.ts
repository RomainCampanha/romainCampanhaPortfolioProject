import type { AvatarAnchorVariant } from "./store";

// Décors des cadres de Rominou (DA Cosy) : une « fenêtre » arrondie en argile crème, avec un
// décor SVG derrière le Canvas transparent (ou le poster).

export type AvatarScene =
  /** Pro : Genève sur le Léman (jet d'eau, Alpes lilas, soleil), Rominou sur son île. */
  | "geneva"
  /** Hobby : plage au coucher du soleil (tenue de vacances). */
  | "beach"
  /** Chat : ciel du soir lilas, lune et étoiles ; bulle « … » quand Rominou écrit. */
  | "dusk"
  /** Sans cadre ni décor : Rominou seul (ombre de contact), centré dans l'ancre. */
  | "none";

/** Décor par défaut de chaque variante d'ancre. */
export const DEFAULT_SCENE: Record<AvatarAnchorVariant, AvatarScene> = {
  hero: "geneva",
  column: "beach",
  chat: "dusk",
  // Compagnon de la visite : décor de la page courante (choisi par la visite)
  companion: "geneva",
};
