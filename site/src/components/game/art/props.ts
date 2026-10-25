import { Shape } from "three";
import { mix } from "../palette";
import type { Kit } from "./kit";

// Accessoires de décor réutilisés par les villes (arbres, lampadaires, immeubles, montagnes,
// nuages, bateaux…). Tout est modelé en coordonnées locales (pieds à y = 0) puis posé par
// Kit.at(). Les dimensions sont en mètres (Rominou mesure 1,72 m).

export type TreeKind = "round" | "cone" | "cypress" | "blossom" | "palm" | "pine";

export function tree(k: Kit, x: number, z: number, s: number, kind: TreeKind, crown: string, trunk: string, accent?: string) {
  k.at(
    x,
    0,
    z,
    () => {
      switch (kind) {
        case "round":
          k.cyl(0.1, 0.15, 1.2, trunk, 0, 0, 0, 6);
          k.ball(0.85, crown, 0, 1.75, 0);
          k.ball(0.55, accent ?? crown, -0.62, 1.45, 0.15);
          k.ball(0.5, crown, 0.6, 1.5, -0.1);
          break;
        case "cone":
          k.cyl(0.09, 0.13, 0.9, trunk, 0, 0, 0, 6);
          k.cone(0.85, 1.5, crown, 0, 0.7, 0, 7);
          k.cone(0.65, 1.25, accent ?? crown, 0, 1.5, 0, 7);
          break;
        case "pine":
          k.cyl(0.09, 0.13, 1.1, trunk, 0, 0, 0, 6);
          k.ball(0.6, crown, 0.15, 1.55, 0, { sy: 0.55, sx: 1.4 });
          k.ball(0.5, accent ?? crown, -0.35, 1.95, 0.1, { sy: 0.5, sx: 1.4 });
          k.ball(0.42, crown, 0.25, 2.3, -0.05, { sy: 0.5, sx: 1.3 });
          break;
        case "cypress":
          k.cyl(0.07, 0.1, 0.4, trunk, 0, 0, 0, 6);
          k.ball(0.42, crown, 0, 1.45, 0, { sy: 2.6 });
          break;
        case "blossom":
          k.cyl(0.09, 0.14, 1.05, trunk, 0, 0, 0, 6, { rz: 0.08 });
          k.cyl(0.05, 0.07, 0.7, trunk, -0.1, 0.9, 0, 5, { rz: 0.7 });
          k.ball(0.7, crown, 0.05, 1.7, 0);
          k.ball(0.5, accent ?? crown, -0.6, 1.5, 0.1);
          k.ball(0.45, crown, 0.6, 1.45, 0.05);
          k.ball(0.38, accent ?? crown, 0.3, 2.15, -0.1);
          break;
        case "palm": {
          for (let i = 0; i < 5; i++) k.cyl(0.08, 0.1, 0.5, trunk, i * 0.05, i * 0.48, 0, 6, { rz: -0.06 * i });
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            k.at(0.25, 2.45, 0, () => k.box(0.9, 0.05, 0.22, i % 2 ? crown : (accent ?? crown), 0.45, 0, 0), {
              ry: a,
              rz: -0.45,
            });
          }
          break;
        }
      }
    },
    { s },
  );
}

/** Lampadaire : fût, lanterne (allumée la nuit : lot `glow`). */
export function lamp(k: Kit, x: number, z: number, pole: string, bulb: string, style: "classic" | "globe" | "paris" | "stone", lit = false) {
  const light = (draw: () => void) => (lit ? k.glow(draw) : draw());
  k.at(x, 0, z, () => {
    if (style === "stone") {
      // Lanterne de pierre (Séoul, Tokyo) : socle, fût, chambre, toit.
      k.box(0.36, 0.12, 0.36, pole, 0, 0, 0);
      k.cyl(0.08, 0.1, 0.55, pole, 0, 0.12, 0, 6);
      k.box(0.34, 0.06, 0.34, pole, 0, 0.67, 0);
      light(() => k.box(0.22, 0.24, 0.22, bulb, 0, 0.73, 0));
      k.frustum(0.5, 0.2, 0.5, 0.2, pole, 0, 0.97, 0);
      k.ball(0.05, pole, 0, 1.2, 0, undefined, 0);
      return;
    }
    k.cyl(0.05, 0.08, 2.6, pole, 0, 0, 0, 6);
    k.cyl(0.12, 0.14, 0.18, pole, 0, 0, 0, 6);
    if (style === "globe") {
      light(() => k.ball(0.2, bulb, 0, 2.78, 0));
    } else if (style === "paris") {
      k.box(0.6, 0.04, 0.05, pole, 0, 2.45, 0);
      for (const dx of [-0.3, 0.3]) {
        light(() => k.cyl(0.08, 0.12, 0.22, bulb, dx, 2.22, 0, 6));
        k.cone(0.14, 0.12, pole, dx, 2.44, 0, 6);
      }
      k.ball(0.06, pole, 0, 2.62, 0, undefined, 0);
    } else {
      light(() => k.cyl(0.13, 0.1, 0.28, bulb, 0, 2.58, 0, 6));
      k.cone(0.2, 0.18, pole, 0, 2.86, 0, 6);
    }
  });
}

/** Drapeau sur mât (tissu = boîte fine ; emblème optionnel). */
export function flag(k: Kit, x: number, z: number, h: number, pole: string, cloth: string, draw?: (k: Kit) => void) {
  k.at(x, 0, z, () => {
    k.cyl(0.03, 0.04, h, pole, 0, 0, 0, 5);
    k.ball(0.06, pole, 0, h + 0.03, 0, undefined, 0);
    k.at(0.42, h - 0.62, 0, () => {
      k.box(0.8, 0.55, 0.03, cloth, 0, 0, 0);
      draw?.(k);
    });
  });
}

/** Croix suisse (sur fond rouge), dans le plan XY, centrée à (0, y). */
export function swissCross(k: Kit, y: number, size: number, white: string, z = 0.02) {
  k.box(size * 0.6, size * 0.2, 0.02, white, 0, y - size * 0.1, z);
  k.box(size * 0.2, size * 0.6, 0.02, white, 0, y - size * 0.3, z);
}

export type Roof = "flat" | "mansard" | "gable" | "hip" | "hanok" | "none";

export type BuildingOptions = {
  roof: Roof;
  roofColor: string;
  windows?: string;
  /** Une fenêtre sur trois allumée (couche lumineuse) : soir. */
  litColor?: string;
  /** Rangées / colonnes de fenêtres (sinon calculées). */
  rows?: number;
  cols?: number;
  /** Bandes horizontales au lieu de fenêtres (lointain). */
  bands?: boolean;
  trim?: string;
};

/** Immeuble posé au sol, face avant vers +z. */
export function building(k: Kit, x: number, z: number, w: number, h: number, d: number, wall: string, o: BuildingOptions) {
  k.at(x, 0, z, () => {
    k.box(w, h, d, wall, 0, 0, 0);
    if (o.trim) k.box(w + 0.12, 0.14, d + 0.12, o.trim, 0, h - 0.14, 0);
    // Fenêtres sur la façade avant (et allumées le soir).
    const cols = o.cols ?? Math.max(1, Math.round(w / 1.1));
    const rows = o.rows ?? Math.max(1, Math.floor((h - 0.6) / 1.15));
    if (o.windows) {
      if (o.bands) {
        for (let r = 0; r < rows; r++) k.quad(w * 0.86, 0.28, o.windows, 0, 0.84 + r * ((h - 1) / rows), d / 2 + 0.01);
      } else {
        const sx = w / cols;
        const sy = (h - 0.7) / rows;
        for (let r = 0; r < rows; r++) {
          for (let ci = 0; ci < cols; ci++) {
            const lit = o.litColor !== undefined && (r * 7 + ci * 3 + Math.round(Math.abs(x))) % 3 === 0;
            const wx = -w / 2 + sx * (ci + 0.5);
            const wy = 0.55 + sy * r;
            const ww = Math.min(0.42, sx * 0.5);
            const wh = Math.min(0.5, sy * 0.55);
            const draw = () => k.quad(ww, wh, lit ? o.litColor! : o.windows!, wx, wy + wh / 2, d / 2 + 0.01);
            if (lit) k.glow(draw);
            else draw();
          }
        }
      }
    }
    switch (o.roof) {
      case "flat":
        k.box(w + 0.1, 0.12, d + 0.1, o.roofColor, 0, h, 0);
        break;
      case "mansard":
        // Toit de zinc mansardé, lucarnes et cheminées (Haussmann).
        k.frustum(w + 0.1, 0.9, d + 0.1, 0.72, o.roofColor, 0, h, 0);
        for (let i = 0; i < Math.max(1, Math.round(w / 1.6)); i++) {
          const lx = -w / 2 + (w / Math.max(1, Math.round(w / 1.6))) * (i + 0.5);
          k.box(0.38, 0.42, 0.3, wall, lx, h + 0.15, d / 2 - 0.12);
          k.gable(0.5, 0.18, 0.36, o.roofColor, lx, h + 0.57, d / 2 - 0.12, { ry: Math.PI / 2 });
        }
        k.box(0.3, 0.5, 0.3, o.trim ?? wall, -w / 2 + 0.4, h + 0.6, -0.1);
        k.box(0.3, 0.42, 0.3, o.trim ?? wall, w / 2 - 0.5, h + 0.6, 0.1);
        break;
      case "gable":
        k.gable(w + 0.2, Math.min(1.4, d * 0.55), d + 0.25, o.roofColor, 0, h, 0);
        break;
      case "hip":
        k.frustum(w + 0.3, Math.min(1.2, d * 0.5), d + 0.3, 0.12, o.roofColor, 0, h, 0);
        break;
      case "hanok":
        hanokRoof(k, w, d, h, o.roofColor);
        break;
      case "none":
        break;
    }
  });
}

/** Toit de hanok : large débord, faîtage, coins relevés. */
export function hanokRoof(k: Kit, w: number, d: number, y: number, color: string) {
  k.frustum(w + 0.9, 0.42, d + 0.9, 0.62, color, 0, y, 0);
  k.gable(w * 0.75, 0.38, d * 0.62, color, 0, y + 0.4, 0);
  k.box(w * 0.8, 0.1, 0.16, color, 0, y + 0.74, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      k.cone(0.12, 0.3, color, sx * (w / 2 + 0.42), y + 0.28, sz * (d / 2 + 0.42), 5, { rz: -sx * 0.9, rx: sz * 0.9 });
    }
  }
}

/** Montagne à facettes (sommet enneigé en option). */
export function mountain(k: Kit, x: number, z: number, w: number, h: number, color: string, snow?: string, seg = 6) {
  k.cone(w / 2, h, color, x, -0.2, z, seg, { sz: 0.6 });
  if (snow) k.cone((w / 2) * 0.32, h * 0.32, snow, x, h * 0.68 - 0.2 + 0.02, z, seg, { sz: 0.6 });
}

/** Colline douce (demi-boule aplatie). */
export function hill(k: Kit, x: number, z: number, rx: number, ry: number, color: string, rz = rx * 0.6) {
  k.sphere(1, color, x, -0.3, z, { sx: rx, sy: ry, sz: rz }, 12, 5, 0.5);
}

/** Nuage de pâte à modeler (quelques boules). */
export function cloud(k: Kit, x: number, y: number, z: number, s: number, color: string, shade: string) {
  k.at(
    x,
    y,
    z,
    () => {
      k.ball(1, color, 0, 0, 0, { sx: 1.25 });
      k.ball(0.8, color, -1.1, -0.25, 0.1);
      k.ball(0.75, shade, 1.15, -0.3, 0);
      k.ball(0.6, color, 0.4, 0.55, -0.1);
    },
    { s, sy: 0.85 },
  );
}

/** Voilier (lac, mer). */
export function sailboat(k: Kit, x: number, z: number, s: number, hull: string, sail: string, sail2: string) {
  k.at(
    x,
    -0.25,
    z,
    () => {
      k.sphere(1, hull, 0, 0.32, 0, { rx: Math.PI, sx: 1.1, sy: 0.32, sz: 0.38 }, 10, 4, 0.5);
      k.box(2.1, 0.06, 0.66, mix(hull, sail, 0.5), 0, 0.3, 0);
      k.cyl(0.03, 0.03, 2.4, sail2, 0.1, 0.3, 0, 4);
      k.shape(
        "sail",
        () => {
          // Grand-voile triangulaire.
          const s2 = new Shape();
          s2.moveTo(0, 0);
          s2.lineTo(0, 2.1);
          s2.lineTo(1, 0);
          s2.closePath();
          return s2;
        },
        0.03,
        sail,
        0.14,
        0.45,
        0,
      );
      k.shape(
        "jib",
        () => {
          const s2 = new Shape();
          s2.moveTo(0, 0);
          s2.lineTo(0, 1.7);
          s2.lineTo(-0.8, 0);
          s2.closePath();
          return s2;
        },
        0.03,
        sail2,
        0.06,
        0.45,
        0,
      );
    },
    { s },
  );
}

/** Garde-corps le long de la course (poteaux + main courante), de x0 à x1 à la profondeur z. */
export function railing(k: Kit, x0: number, x1: number, z: number, post: string, rail: string, h = 0.9, step = 1.6) {
  k.box(x1 - x0, 0.07, 0.08, rail, (x0 + x1) / 2, h, z);
  k.box(x1 - x0, 0.05, 0.06, rail, (x0 + x1) / 2, h * 0.45, z);
  for (let x = x0 + step / 2; x < x1; x += step) k.box(0.09, h, 0.09, post, x, 0, z);
}

/** Ombre de contact (disque plat plus sombre que le sol). */
export function contact(k: Kit, x: number, z: number, r: number, color: string) {
  k.cyl(r, r, 0.01, color, x, 0.005, z, 10, { sz: 0.7 });
}
