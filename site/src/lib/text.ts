import type { AppLocale } from "@/i18n/routing";

/**
 * Valeur du profil insérée en milieu de phrase : en français, première lettre en
 * minuscule ("Support technique…" -> "support technique…"), sauf sigle ("CFC", "L2").
 * En anglais, la valeur reste telle quelle ("French rap").
 */
export function inSentence(text: string, locale: AppLocale): string {
  if (locale !== "fr" || text.length < 2) return text;
  const second = text[1];
  const isAcronym = /\d/.test(second) || (second !== second.toLowerCase() && second === second.toUpperCase());
  return isAcronym ? text : `${text[0].toLowerCase()}${text.slice(1)}`;
}
