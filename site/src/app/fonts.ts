import localFont from "next/font/local";

// Polices auto-hébergées (fichiers des paquets @fontsource), chargées par next/font :
// préchargées (<link rel="preload">) et doublées d'une police de secours aux métriques
// ajustées (« Fraunces Fallback », « Nunito Fallback » : @font-face dans globals.css, valeurs
// calculées par next/font, avec plus de polices locales qu'Arial / Times New Roman) : pas de
// saut de mise en page quand elles arrivent (CLS). Sous-ensemble latin (français, anglais).
// Fraunces « full » : axes wght, opsz, SOFT et WONK, tous utilisés par la DA (le sous-ensemble
// « soft », sans opsz, change le dessin des titres). Jua (coréen) reste chargée à la demande
// par <Hangul>.

export const fraunces = localFont({
  src: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-fraunces",
  adjustFontFallback: false,
  fallback: ["Fraunces Fallback", "Georgia", "serif"],
});

export const nunito = localFont({
  src: "../../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2",
  weight: "200 1000",
  style: "normal",
  variable: "--font-nunito",
  adjustFontFallback: false,
  fallback: ["Nunito Fallback", "ui-rounded", "system-ui", "sans-serif"],
});

/** Classes à poser sur <html> : définissent --font-fraunces et --font-nunito. */
export const fontVariables = `${fraunces.variable} ${nunito.variable}`;
