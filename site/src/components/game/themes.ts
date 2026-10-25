import type { LevelId } from "@/lib/game/types";
import { mix, type Palette } from "./palette";

// Ambiance de chaque étape (sans three.js : partagée par l'écran de jeu, le rendu 3D et le
// rendu 2D de secours) : ciel (dégradé CSS derrière le Canvas transparent, même couleur
// d'horizon que le brouillard 3D), soleil ou lune, lumière et couleurs du sol. Toutes les
// teintes sont des tokens du design system (palette.ts), mélangés au besoin.

export type Sky = {
  top: string;
  mid: string;
  /** Couleur de l'horizon = brouillard 3D : le décor lointain s'y fond. */
  horizon: string;
  sun: string;
  glow: string;
  /** Position (%) et rayon (rem) du soleil (ou de la lune) dans l'écran de jeu. */
  sunX: number;
  sunY: number;
  sunSize: number;
  /** Ciel du soir : quelques étoiles. */
  stars: boolean;
};

export type Ground = {
  /** Chemin de course (dessus). */
  path: string;
  /** Socle d'argile sous le chemin (épaisseur). */
  socle: string;
  /** Bande devant le chemin (bas de l'écran). */
  front: string;
  /** Sol derrière le chemin, jusqu'à l'horizon (ou l'eau). */
  back: string;
};

export type Theme = {
  id: LevelId;
  sky: Sky;
  ground: Ground;
  /** Lumière d'ambiance (ciel / sol de l'hémisphère), teintée par la ville. */
  hemisphere: { sky: string; ground: string };
  /** Le soir : lampes et enseignes allumées. */
  night: boolean;
};

const sky = (s: Partial<Sky> & Pick<Sky, "top" | "mid" | "horizon" | "sun" | "glow">): Sky => ({
  sunX: 76,
  sunY: 24,
  sunSize: 2.3,
  stars: false,
  ...s,
});

export function themeFor(id: LevelId, c: Palette): Theme {
  const warm = { sky: mix(c.butter100, c.cream, 0.4), ground: mix(c.sand, c.peach200, 0.4) };
  switch (id) {
    case "seoul":
      return {
        id,
        sky: sky({
          top: mix(c.lilac200, c.lake200, 0.45),
          mid: mix(c.lilac100, c.peach100, 0.5),
          horizon: c.peach100,
          sun: mix(c.peach200, c.cream, 0.35),
          glow: c.peach100,
          sunX: 22,
          sunY: 26,
        }),
        ground: { path: mix(c.oat, c.sand, 0.35), socle: c.sand, front: c.sage300, back: mix(c.oatDeep, c.sage200, 0.35) },
        hemisphere: { sky: mix(warm.sky, c.lilac100, 0.4), ground: warm.ground },
        night: false,
      };
    case "toronto":
      return {
        id,
        sky: sky({ top: c.lake300, mid: c.lake100, horizon: mix(c.lake100, c.cream, 0.6), sun: c.butter200, glow: c.butter100, sunX: 24, sunY: 20 }),
        ground: { path: c.oat, socle: c.sand, front: c.sage300, back: mix(c.sage200, c.oatDeep, 0.3) },
        hemisphere: warm,
        night: false,
      };
    case "brighton-dubrovnik":
      return {
        id,
        sky: sky({
          top: c.lake200,
          mid: mix(c.lake100, c.peach100, 0.5),
          horizon: mix(c.peach100, c.cream, 0.3),
          sun: c.butter300,
          glow: c.peach100,
          sunX: 84,
          sunY: 28,
        }),
        ground: { path: mix(c.peach200, c.oat, 0.55), socle: c.sand, front: mix(c.sand, c.butter200, 0.35), back: mix(c.sand, c.oat, 0.4) },
        hemisphere: warm,
        night: false,
      };
    case "paris":
      return {
        id,
        sky: sky({
          top: c.lilac200,
          mid: mix(c.lilac100, c.peach100, 0.6),
          horizon: mix(c.peach100, c.cream, 0.4),
          sun: mix(c.peach200, c.butter200, 0.5),
          glow: c.peach100,
          sunX: 26,
          sunY: 26,
        }),
        ground: { path: mix(c.lilac200, c.oat, 0.45), socle: c.sand, front: c.sage300, back: mix(c.oatDeep, c.lilac100, 0.35) },
        hemisphere: { sky: mix(warm.sky, c.lilac100, 0.35), ground: warm.ground },
        night: false,
      };
    case "shanghai":
      return {
        id,
        sky: sky({
          top: c.lilac300,
          mid: mix(c.lilac200, c.peach200, 0.55),
          horizon: c.peach200,
          sun: c.peach300,
          glow: mix(c.peach200, c.butter200, 0.5),
          sunX: 70,
          sunY: 44,
          sunSize: 3,
        }),
        ground: { path: mix(c.oat, c.peach100, 0.4), socle: c.sand, front: c.sage300, back: mix(c.oatDeep, c.peach100, 0.4) },
        hemisphere: { sky: mix(c.peach100, c.lilac200, 0.35), ground: mix(c.sand, c.peach200, 0.6) },
        night: true,
      };
    case "tokyo":
      return {
        id,
        sky: sky({
          top: c.lilac500,
          mid: c.lilac300,
          horizon: mix(c.peach200, c.lilac200, 0.35),
          sun: c.cream,
          glow: mix(c.lilac300, c.cream, 0.45),
          sunX: 18,
          sunY: 22,
          sunSize: 1.5,
          stars: true,
        }),
        ground: { path: mix(c.lilac200, c.oat, 0.55), socle: mix(c.sand, c.lilac200, 0.3), front: mix(c.sage300, c.lilac200, 0.25), back: mix(c.oatDeep, c.lilac200, 0.45) },
        hemisphere: { sky: mix(c.lilac100, c.peach100, 0.4), ground: mix(c.sand, c.lilac300, 0.4) },
        night: true,
      };
    case "berlin":
      return {
        id,
        sky: sky({
          top: c.lake200,
          mid: mix(c.lake100, c.lilac100, 0.5),
          horizon: c.lilac100,
          sun: mix(c.cream, c.butter200, 0.4),
          glow: c.butter100,
          sunX: 22,
          sunY: 22,
        }),
        ground: { path: mix(c.sand, c.oat, 0.5), socle: mix(c.sand, c.lilac200, 0.25), front: c.sage300, back: mix(c.sage200, c.oatDeep, 0.45) },
        hemisphere: { sky: mix(warm.sky, c.lake100, 0.35), ground: warm.ground },
        night: false,
      };
    case "busan":
      return {
        id,
        sky: sky({ top: c.lake300, mid: c.lake200, horizon: mix(c.lake100, c.cream, 0.5), sun: c.butter300, glow: c.butter200, sunX: 20, sunY: 22 }),
        ground: { path: mix(c.butter200, c.oat, 0.45), socle: c.sand, front: mix(c.butter200, c.sand, 0.4), back: mix(c.butter100, c.sand, 0.45) },
        hemisphere: warm,
        night: false,
      };
    default:
      // Genève (et repli) : matin clair sur le Léman.
      return {
        id,
        sky: sky({
          top: c.lake300,
          mid: c.lake200,
          horizon: mix(c.lake100, c.cream, 0.35),
          sun: c.butter300,
          glow: c.butter200,
          sunX: 20,
          sunY: 22,
        }),
        ground: { path: c.oat, socle: c.sand, front: c.sage300, back: c.sage200 },
        hemisphere: warm,
        night: false,
      };
  }
}

/** Variables CSS du ciel, posées sur l'écran de jeu (dégradé et soleil derrière le Canvas). */
export function skyStyle(theme: Theme): Record<string, string> {
  const s = theme.sky;
  return {
    "--sky-top": s.top,
    "--sky-mid": s.mid,
    "--sky-horizon": s.horizon,
    "--sun": s.sun,
    "--sun-glow": s.glow,
    "--sun-x": `${s.sunX}%`,
    "--sun-y": `${s.sunY}%`,
    "--sun-size": `${s.sunSize}rem`,
  };
}
