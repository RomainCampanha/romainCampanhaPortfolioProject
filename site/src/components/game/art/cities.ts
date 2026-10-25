import type { Rng } from "@/lib/game/rng";
import type { Level, LevelId } from "@/lib/game/types";
import { mix, type Palette } from "../palette";
import type { Theme } from "../themes";
import type { Batch, Kit } from "./kit";
import {
  building,
  cloud,
  flag,
  hanokRoof,
  hill,
  lamp,
  mountain,
  railing,
  sailboat,
  swissCross,
  tree,
} from "./props";

// Décor de chaque ville, en couches (de la caméra vers l'horizon) :
// - devant : bande basse sous le chemin (fleurs, coquillages, feuilles) ;
// - près   : bord du chemin et accessoires (z ≈ -2 à -10), vraie parallaxe de perspective ;
// - fond   : immeubles, bateaux, collines (z ≈ -15 à -80) ;
// - loin   : monument de la ville, montagnes, skyline. Cette couche suit la caméra et glisse
//            lentement de droite à gauche au fil de l'étape (farTrack) : le monument reste en
//            vue du départ à l'arrivée, où il se tient derrière la porte d'embarquement.

export type FarTrack = {
  /** Point local de la couche lointaine au centre de l'écran, au départ puis à l'arrivée. */
  start: number;
  end: number;
  /** « half » : en demi-largeurs visibles (s'adapte au format) ; « m » : en mètres. */
  unit: "half" | "m";
};

export type SceneCtx = {
  c: Palette;
  theme: Theme;
  level: Level;
  rng: Rng;
  /** Étendue du décor le long de la course. */
  from: number;
  to: number;
  front: Batch;
  near: Batch;
  back: Batch;
  /** Couche lointaine (coordonnées locales, centrée sur le monument). */
  far: Kit;
  clouds: Kit;
};

export type Scene = {
  farZ: number;
  farTrack: FarTrack;
  /** Eau derrière le chemin à partir de cette profondeur (lac, fleuve, mer), sinon terre. */
  waterFrom: number | null;
  /** Bande de plage / quai entre le chemin et l'eau (couleur du sol arrière). */
  build: (ctx: SceneCtx) => void;
};

const half = (start: number, end: number): FarTrack => ({ start, end, unit: "half" });

/** Pose `fn(x)` le long de la course, tous les [min, max] m. */
function along(ctx: SceneCtx, min: number, max: number, fn: (x: number, i: number) => void, from = ctx.from, to = ctx.to) {
  let i = 0;
  for (let x = from + ctx.rng.range(0, min); x < to; x += ctx.rng.range(min, max)) fn(x, i++);
}

/** Tranches de 40 m (un lot par tranche) : pour les éléments continus (garde-corps, haies). */
function spans(ctx: SceneCtx, fn: (x0: number, x1: number) => void, from = ctx.from, to = ctx.to) {
  for (let x = from; x < to; x += 40) fn(x, Math.min(to, x + 40));
}

/** Petits détails sur la bande de devant (ne masquent jamais le chemin : < 0,2 m). */
function frontDots(ctx: SceneCtx, colors: string[], kind: "flower" | "leaf" | "shell" | "petal") {
  along(ctx, 0.9, 2.2, (x, i) => {
    const k = ctx.front.at(x);
    const z = ctx.rng.range(2.5, 4.6);
    const col = colors[i % colors.length];
    if (kind === "flower") {
      k.cyl(0.012, 0.012, 0.12, ctx.c.sage500, x, -0.15, z, 3);
      k.ball(0.06, col, x, -0.02, z, undefined, 0);
    } else if (kind === "leaf" || kind === "petal") {
      const s = kind === "leaf" ? 0.16 : 0.07;
      k.cbox(s, 0.015, s * 0.8, col, x, -0.14, z, { ry: i * 1.3, rz: 0.1 });
    } else {
      k.sphere(0.07, col, x, -0.15, z, { sy: 0.5 }, 6, 3, 0.5);
    }
  });
}

/**
 * Touffes et trouvailles plus loin devant (visibles surtout en portrait, sous le chemin) :
 * buissons fleuris, galets, étoiles de mer. Toujours bas (< 0,35 m).
 */
function frontClumps(ctx: SceneCtx, kinds: ("bush" | "rock" | "star")[], flowers: string[]) {
  const { c, rng } = ctx;
  along(ctx, 5, 11, (x, i) => {
    const k = ctx.front.at(x);
    const z = rng.range(4.4, 7);
    const kind = kinds[i % kinds.length];
    k.at(x, -0.15, z, () => {
      if (kind === "bush") {
        k.ball(0.32, c.sage500, 0, 0.06, 0, { sy: 0.55 });
        k.ball(0.24, c.sage300, 0.3, 0.04, 0.1, { sy: 0.6 });
        for (let j = 0; j < 4; j++) k.ball(0.06, flowers[(i + j) % flowers.length], -0.15 + j * 0.13, 0.2, 0.18 - (j % 2) * 0.12, undefined, 0);
      } else if (kind === "rock") {
        k.ball(0.26, mix(c.sand, c.inkSoft, 0.18), 0, 0.02, 0, { sy: 0.5, sx: 1.3 }, 0);
        k.ball(0.14, mix(c.sand, c.cream, 0.4), 0.32, 0, 0.1, { sy: 0.55 }, 0);
      } else {
        for (let j = 0; j < 5; j++) k.cbox(0.26, 0.05, 0.09, flowers[i % flowers.length], 0, 0.03, 0, { ry: (j / 5) * Math.PI * 2, sx: 1 });
        k.ball(0.07, flowers[i % flowers.length], 0, 0.05, 0, { sy: 0.5 }, 0);
      }
    }, { ry: rng.range(0, Math.PI) });
  });
}

/* ====================================================================== Genève */

const geneve: Scene = {
  farZ: -105,
  farTrack: half(-0.55, -0.24),
  waterFrom: -2.25,
  build(ctx) {
    const { c, near, back, far, rng } = ctx;
    // Quai : garde-corps, lampadaires, drapeaux suisse et genevois.
    spans(ctx, (x0, x1) => railing(near.at(x0), x0, x1, -1.95, c.cream, mix(c.lake500, c.inkSoft, 0.3), 0.62, 2));
    along(ctx, 13, 16, (x) => lamp(near.at(x), x, -2.15, mix(c.lake500, c.inkSoft, 0.45), c.butter200, "classic"));
    along(ctx, 28, 40, (x, i) => {
      const genevan = i % 2 === 1;
      flag(near.at(x), x + 6, -2.25, 3.4, c.cream, genevan ? c.butter300 : c.clay, (k) => {
        if (genevan) {
          k.box(0.4, 0.55, 0.035, c.clay, 0.2, 0, 0); // moitié rouge (la clé), moitié jaune (l'aigle)
          k.box(0.12, 0.16, 0.04, c.inkSoft, -0.2, 0.2, 0);
          k.box(0.06, 0.2, 0.04, c.butter300, 0.2, 0.17, 0);
        } else {
          swissCross(k, 0.42, 0.34, c.cream);
        }
      });
    });
    // Sur le lac : cygnes, mouettes (bateaux jaunes), voiliers.
    along(ctx, 9, 18, (x) => swan(near.at(x), x, rng.range(-3.6, -6.5), c));
    along(ctx, 30, 50, (x) => mouette(back.at(x), x, rng.range(-10, -15), c));
    along(ctx, 14, 26, (x, i) =>
      sailboat(back.at(x), x, rng.range(-16, -40), rng.range(0.9, 1.3), i % 2 ? c.lake500 : c.cream, c.cream, i % 3 ? c.peach300 : c.butter300),
    );
    frontDots(ctx, [c.clay, c.peach300, c.butter300, c.lilac300, c.cream], "flower");
    frontClumps(ctx, ["bush", "rock", "bush"], [c.clay, c.butter300, c.lilac300, c.cream]);
    // Horloge fleurie (au départ, devant, à gauche de Rominou).
    const clockX = ctx.level.startX - 6.5;
    const k = ctx.front.at(clockX);
    k.at(clockX, -0.15, 3.4, () => {
      k.cyl(1.2, 1.25, 0.18, c.sage500, 0, 0, 0, 16);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        k.ball(0.11, [c.clay, c.butter300, c.lilac300][i % 3], Math.cos(a) * 1.02, 0.2, Math.sin(a) * 1.02, undefined, 0);
      }
      k.box(0.07, 0.03, 0.8, c.ink, 0.3, 0.2, -0.05, { ry: 0.9 });
      k.box(0.06, 0.03, 0.55, c.ink, -0.1, 0.2, 0.1, { ry: -0.4 });
    }, { rx: -0.25 });

    // Loin : le jet d'eau, la rive, le Salève, les Alpes et le Mont-Blanc.
    const spray = mix(c.cream, c.lake100, 0.35);
    far.glow(() => {
      far.cyl(0.35, 0.9, 21, c.cream, 0, 0, 2, 8, { rz: -0.035 });
      far.ball(1.4, c.cream, 0, 0.5, 2, { sy: 0.45, sx: 1.8 });
    });
    [[0.9, 21.2, 1.9], [2.6, 20.6, 1.6], [4, 19.2, 1.3], [5, 17.4, 1.05], [5.7, 15.4, 0.85], [6.2, 13.4, 0.65]].forEach(([x, y, r], i) =>
      far.ball(r, i < 2 ? c.cream : spray, x, y, 2),
    );
    far.box(320, 1.4, 12, mix(c.sage300, c.sage500, 0.35), 0, -0.3, -14);
    for (let x = -150; x < 150; x += rng.range(2.6, 5)) {
      if (rng.chance(0.55)) far.box(rng.range(1.2, 2.4), rng.range(1, 2.6), 1.5, rng.chance(0.5) ? c.cream : c.peach200, x, 1, -9);
      else far.ball(rng.range(0.8, 1.4), c.sage500, x, 1.6, -10);
    }
    far.frustum(80, 13, 20, 0.5, mix(c.sage500, c.lilac300, 0.55), -36, 0, -40);
    for (let x = -140; x < 140; x += rng.range(14, 24)) {
      mountain(far, x, -78 - rng.range(0, 14), rng.range(26, 40), rng.range(16, 26), mix(c.lilac300, c.lake200, 0.3), c.cream, 5);
    }
    mountain(far, 46, -100, 64, 30, mix(c.lilac300, c.lake200, 0.2), c.cream, 7);
    cloudsAcross(ctx, c.cream, mix(c.cream, c.lake100, 0.5));
  },
};

function swan(k: Kit, x: number, z: number, c: Palette) {
  k.at(x, -0.32, z, () => {
    k.ball(0.32, c.cream, 0, 0.12, 0, { sx: 1.5, sy: 0.6 });
    k.ball(0.18, c.cream, 0.25, 0.25, 0, { sx: 1.4, sy: 0.7 });
    k.cyl(0.055, 0.07, 0.45, c.cream, -0.33, 0.12, 0, 6, { rz: -0.15 });
    k.ball(0.08, c.cream, -0.38, 0.6, 0);
    k.cone(0.035, 0.11, c.peach500, -0.48, 0.58, 0, 5, { rz: Math.PI / 2 });
  });
}

/** Mouette genevoise : petit bateau jaune des Mouettes. */
function mouette(k: Kit, x: number, z: number, c: Palette) {
  k.at(x, -0.3, z, () => {
    k.sphere(1, c.butter300, 0, 0.35, 0, { rx: Math.PI, sx: 2, sy: 0.35, sz: 0.7 }, 10, 4, 0.5);
    k.box(2.6, 0.08, 1.2, c.cream, 0, 0.32, 0);
    k.box(1.6, 0.7, 1, c.cream, 0, 0.4, 0);
    for (let i = 0; i < 4; i++) k.box(0.28, 0.3, 0.04, mix(c.lake300, c.inkSoft, 0.2), -0.6 + i * 0.4, 0.68, 0.51);
    k.box(1.8, 0.1, 1.15, c.butter500, 0, 1.1, 0);
  });
}

/** Nuages lointains (couche des nuages, qui dérive doucement). */
function cloudsAcross(ctx: SceneCtx, color: string, shade: string) {
  const { clouds, rng } = ctx;
  for (let x = -150; x < 150; x += rng.range(26, 46)) {
    cloud(clouds, x, rng.range(20, 30), rng.range(-30, -10), rng.range(2.2, 3.6), color, shade);
  }
}

/* ====================================================================== Séoul */

const seoul: Scene = {
  farZ: -110,
  farTrack: half(-0.55, -0.24),
  waterFrom: null,
  build(ctx) {
    const { c, near, back, far, rng } = ctx;
    const roof = mix(mix(c.lake500, c.inkSoft, 0.55), c.lilac300, 0.2);
    const wood = mix(c.clayEdge, c.butter500, 0.25);
    const wall = mix(c.cream, c.sand, 0.35);
    // Murets de hanok, ginkgos, lanternes de pierre, maisons traditionnelles.
    spans(ctx, (x0, x1) => {
      const k = near.at(x0);
      for (let x = x0; x < x1 - 2; x += 9) {
        k.box(6, 0.75, 0.32, wall, x + 3, 0, -2.25);
        k.gable(6.2, 0.22, 0.5, roof, x + 3, 0.75, -2.25);
      }
    });
    along(ctx, 7, 12, (x, i) => tree(near.at(x), x, rng.range(-3.4, -4.4), rng.range(0.9, 1.15), "cone", i % 3 ? c.butter300 : c.butter500, wood, c.butter200));
    along(ctx, 15, 22, (x) => lamp(near.at(x), x, -2.9, mix(c.sand, c.inkSoft, 0.2), c.butter100, "stone"));
    along(ctx, 11, 16, (x) => {
      const k = near.at(x);
      const w = rng.range(3.6, 5);
      k.at(x, 0, rng.range(-7, -8.5), () => {
        k.box(w + 0.3, 0.35, 2.6, mix(c.sand, c.inkSoft, 0.12), 0, 0, 0);
        k.box(w, 1.5, 2.2, wall, 0, 0.35, 0);
        for (let px = -w / 2; px <= w / 2 + 0.01; px += w / 3) k.box(0.14, 1.5, 0.14, wood, px, 0.35, 1.12);
        k.box(w * 0.3, 0.9, 0.05, mix(c.butter200, c.cream, 0.4), -w * 0.18, 0.55, 1.12);
        k.box(w * 0.3, 0.9, 0.05, mix(c.butter200, c.cream, 0.4), w * 0.2, 0.55, 1.12);
        hanokRoof(k, w, 2.2, 1.85, roof);
      });
    });
    // Fond : toits de Bukchon, puis tours modernes.
    along(ctx, 6, 9, (x) => {
      const k = back.at(x);
      const w = rng.range(3.5, 5.5);
      k.at(x, 0, rng.range(-20, -28), () => {
        k.box(w, 1.6, 2.4, wall, 0, 0, 0);
        hanokRoof(k, w, 2.4, 1.6, roof);
      });
    });
    along(ctx, 7, 12, (x, i) => {
      const h = rng.range(4, 8);
      building(back.at(x), x, rng.range(-50, -62), rng.range(4.5, 7), h, 5, [c.lake200, c.lilac200, c.cream, c.peach100][i % 4], {
        roof: "flat",
        roofColor: mix(c.sand, c.inkSoft, 0.15),
        windows: mix(c.lake300, c.inkSoft, 0.15),
        bands: true,
        rows: Math.round(h / 2),
      });
    });
    frontDots(ctx, [c.butter300, c.butter500, c.peach300], "leaf");
    frontClumps(ctx, ["rock", "bush"], [c.butter300, c.peach300, c.cream]);

    // Loin : Namsan et la N Seoul Tower, Bukhansan, la ville.
    hill(far, 0, 0, 22, 9, mix(c.sage500, c.sage300, 0.4), 14);
    far.cyl(0.55, 0.9, 10, c.cream, 0, 7.6, 0, 8);
    far.cyl(1.6, 1.9, 0.6, mix(c.cream, c.sand, 0.4), 0, 8.2, 0, 10);
    far.cyl(2.3, 1.8, 1.6, c.lake300, 0, 14.4, 0, 12);
    far.cyl(2.1, 2.3, 0.7, c.cream, 0, 16, 0, 12);
    far.cyl(1.6, 1.9, 0.6, c.lake500, 0, 16.7, 0, 12);
    for (let i = 0; i < 4; i++) far.cyl(0.24 - i * 0.04, 0.28 - i * 0.04, 1, i % 2 ? c.cream : c.clay, 0, 17.3 + i, 0, 6);
    for (let x = -150; x < 150; x += rng.range(5, 9)) {
      if (Math.abs(x) < 16) continue;
      building(far, x, rng.range(-4, 6), rng.range(3, 6), rng.range(4, 12), 3, rng.chance(0.5) ? c.lake200 : c.lilac200, {
        roof: "flat",
        roofColor: c.sand,
        windows: mix(c.lake300, c.lilac300, 0.4),
        bands: true,
        rows: 3,
      });
    }
    for (let x = -150; x < 150; x += rng.range(14, 22)) {
      mountain(far, x, -45 - rng.range(0, 15), rng.range(22, 36), rng.range(14, 24), mix(c.lilac300, c.sage300, 0.35), mix(c.lilac200, c.cream, 0.5), 5);
    }
    cloudsAcross(ctx, c.cream, mix(c.cream, c.peach100, 0.6));
  },
};

/* ====================================================================== Toronto */

const toronto: Scene = {
  farZ: -110,
  farTrack: half(-0.55, -0.24),
  waterFrom: null,
  build(ctx) {
    const { c, near, back, far, rng } = ctx;
    const iron = mix(c.inkSoft, c.ink, 0.25);
    const autumn = [c.peach500, c.clay, c.butter500, mix(c.peach500, c.butter500, 0.5)];
    along(ctx, 6, 10, (x, i) =>
      tree(near.at(x), x, rng.range(-3.6, -5.5), rng.range(0.9, 1.2), "round", autumn[i % 4], mix(c.clayEdge, c.inkSoft, 0.3), autumn[(i + 1) % 4]),
    );
    along(ctx, 14, 18, (x) => lamp(near.at(x), x, -2.3, iron, c.butter100, "classic"));
    along(ctx, 34, 46, (x) =>
      flag(near.at(x), x + 3, -2.6, 3.4, c.cream, c.cream, (k) => {
        k.box(0.2, 0.55, 0.035, c.clay, -0.3, 0, 0);
        k.box(0.2, 0.55, 0.035, c.clay, 0.3, 0, 0);
        k.cbox(0.16, 0.16, 0.04, c.clay, 0, 0.28, 0, { rz: Math.PI / 4 });
      }),
    );
    // Tramway rouge du TTC.
    along(ctx, 70, 110, (x) => streetcar(near.at(x), x, -8.2, c));
    along(ctx, 6, 10, (x, i) => {
      const h = rng.range(5, 10);
      const w = rng.range(4.5, 7.5);
      const z = rng.range(-50, -64);
      const color = [c.lake200, c.lake300, c.lilac200, c.cream][i % 4];
      building(back.at(x), x, z, w, h, 5, color, {
        roof: "flat",
        roofColor: mix(color, c.inkSoft, 0.2),
        windows: mix(color, c.lake500, 0.35),
        bands: true,
        rows: Math.round(h / 1.8),
      });
      if (i % 3 === 0) back.at(x).frustum(w, 1.6, 5, 0.25, mix(color, c.inkSoft, 0.1), x, h, z);
    });
    frontDots(ctx, autumn, "leaf");
    frontClumps(ctx, ["bush", "rock"], autumn);

    // Loin : la CN Tower, le Rogers Centre, la skyline.
    far.cyl(1.2, 3, 17, c.cream, 0, 0, 0, 3, { ry: Math.PI / 6 });
    far.cyl(0.6, 1.2, 4.5, c.cream, 0, 17, 0, 6);
    far.cyl(2.8, 2.2, 1.3, mix(c.cream, c.sand, 0.4), 0, 14.4, 0, 12);
    far.cyl(3, 2.8, 1, c.lake300, 0, 15.7, 0, 12);
    far.cyl(2.2, 3, 1.1, c.cream, 0, 16.7, 0, 12);
    far.cyl(0.9, 0.8, 0.7, c.lake300, 0, 21.3, 0, 8);
    far.cyl(0.12, 0.4, 4, mix(c.cream, c.inkSoft, 0.15), 0, 22, 0, 6);
    far.sphere(7, c.cream, 13, 0, 4, { sy: 0.45 }, 14, 5, 0.5);
    for (let x = -150; x < 150; x += rng.range(3, 6)) {
      if (Math.abs(x) < 3.5 || (x > 6 && x < 20)) continue;
      const near0 = Math.abs(x) < 45;
      const h = near0 ? rng.range(6, 17) : rng.range(3, 8);
      building(far, x, rng.range(-6, 4), rng.range(2.5, 4.5), h, 3, rng.chance(0.5) ? c.lake200 : mix(c.lilac200, c.lake200, 0.4), {
        roof: "flat",
        roofColor: c.sand,
        windows: mix(c.lake300, c.lake500, 0.3),
        bands: true,
        rows: Math.max(2, Math.round(h / 2)),
      });
    }
    far.box(320, 1, 30, mix(c.sage300, c.oatDeep, 0.4), 0, -0.4, -30);
    cloudsAcross(ctx, c.cream, mix(c.cream, c.lake100, 0.6));
  },
};

function streetcar(k: Kit, x: number, z: number, c: Palette) {
  k.at(x, 0, z, () => {
    k.box(7, 0.25, 2, mix(c.inkSoft, c.ink, 0.2), 0, 0.15, 0);
    k.box(7, 2.2, 2.2, c.clay, 0, 0.4, 0);
    k.box(7.02, 0.3, 2.22, c.cream, 0, 1.15, 0);
    for (let i = 0; i < 6; i++) k.box(0.8, 0.7, 0.05, mix(c.lake200, c.inkSoft, 0.15), -2.9 + i * 1.15, 1.55, 1.11);
    k.box(6.8, 0.2, 2, mix(c.clay, c.cream, 0.5), 0, 2.6, 0);
    for (const wx of [-2.4, 2.4]) k.cyl(0.35, 0.35, 0.2, c.ink, wx, 0.35, 1.0, 8, { rx: Math.PI / 2 });
    k.box(0.05, 1.2, 0.05, c.inkSoft, 1, 2.8, 0, { rz: -0.5 });
  });
}

/* ====================================================================== Brighton & Dubrovnik */

const brightonDubrovnik: Scene = {
  farZ: -110,
  farTrack: { start: -32, end: 30, unit: "m" },
  waterFrom: -11,
  build(ctx) {
    const { c, near, back, far, rng, level } = ctx;
    const switchX = (level.startX + level.gateX) / 2;
    const iron = mix(c.lake500, c.inkSoft, 0.2);
    const stone = mix(c.cream, c.sand, 0.45);
    const terracotta = mix(c.peach500, c.clay, 0.3);
    // Brighton : garde-corps bleu, cabines de plage, transats, lampadaires.
    spans(ctx, (x0, x1) => railing(near.at(x0), x0, x1, -1.95, iron, c.cream, 0.85), ctx.from, switchX);
    along(ctx, 12, 15, (x) => lamp(near.at(x), x, -2.15, iron, c.cream, "globe"), ctx.from, switchX);
    along(ctx, 2.2, 3.4, (x, i) => {
      const k = near.at(x);
      const color = [c.peach300, c.lake300, c.butter300, c.lilac300, c.sage300][i % 5];
      k.at(x, 0, -5.2, () => {
        k.box(1.6, 1.7, 1.5, c.cream, 0, 0, 0);
        for (let s = 0; s < 4; s++) k.box(0.2, 1.7, 1.52, color, -0.6 + s * 0.4, 0, 0);
        k.box(0.7, 1.2, 0.05, color, 0, 0.1, 0.76);
        k.gable(1.8, 0.7, 1.8, color, 0, 1.7, 0);
      });
    }, ctx.from, switchX - 8);
    // Dubrovnik : parapet de pierre, cyprès, palmiers, maisons aux toits de tuiles.
    spans(ctx, (x0, x1) => {
      const k = near.at(x0);
      k.box(x1 - x0, 0.75, 0.4, stone, (x0 + x1) / 2, 0, -2.1);
      k.box(x1 - x0, 0.1, 0.5, mix(stone, c.inkSoft, 0.1), (x0 + x1) / 2, 0.75, -2.1);
    }, switchX, ctx.to);
    along(ctx, 5, 9, (x, i) => {
      const k = near.at(x);
      if (i % 3 === 2) tree(k, x, rng.range(-3.4, -4.4), rng.range(0.9, 1.1), "palm", c.sage500, mix(c.clayEdge, c.butter500, 0.4), c.sage300);
      else tree(k, x, rng.range(-3.2, -4.6), rng.range(1, 1.4), "cypress", mix(c.sage500, c.sage800, 0.3), c.clayEdge);
    }, switchX, ctx.to);
    along(ctx, 5, 8, (x, i) => {
      const w = rng.range(2.6, 3.8);
      building(near.at(x), x, rng.range(-7, -9.5), w, rng.range(2.6, 4.2), 2.6, [stone, c.cream, mix(c.butter100, stone, 0.5)][i % 3], {
        roof: "hip",
        roofColor: terracotta,
        windows: mix(c.sage500, c.inkSoft, 0.3),
        cols: 2,
        rows: 2,
      });
    }, switchX + 2, ctx.to);
    // Mer : voiliers, île de Lokrum au large de Dubrovnik.
    along(ctx, 22, 40, (x, i) =>
      sailboat(back.at(x), x, rng.range(-16, -40), rng.range(0.9, 1.4), i % 2 ? c.cream : c.lake500, c.cream, i % 2 ? c.peach300 : c.lilac300),
    );
    along(ctx, 60, 80, (x) => {
      hill(back.at(x), x, -58, 18, 5, c.sage500, 9);
      for (let i = 0; i < 7; i++) tree(back.at(x), x - 12 + i * 4, -54 + (i % 2), 1.6, "pine", c.sage800, c.clayEdge, c.sage500);
    }, switchX + 10, ctx.to);
    frontDots(ctx, [c.cream, c.peach200, c.lilac200, c.butter200], "shell");
    frontClumps(ctx, ["star", "rock", "star"], [c.peach500, c.peach300, c.butter500]);

    // Loin, à gauche : la jetée de Brighton et sa grande roue.
    far.at(-32, 0, 0, () => {
      far.box(34, 0.5, 3, c.cream, 0, 2.2, 0);
      for (let x = -16; x <= 16; x += 2) far.box(0.25, 2.4, 0.25, mix(c.cream, c.inkSoft, 0.2), x, 0, 0);
      for (const x of [-12, -4, 4]) {
        far.box(3.4, 2, 2.4, c.cream, x, 2.7, 0);
        far.sphere(1.1, c.lake300, x, 4.7, 0, undefined, 8, 4, 0.5);
      }
      far.at(10, 9.5, 1, () => {
        far.torus(6.5, 0.18, c.cream, 0, 0, 0, undefined, Math.PI * 2, 4, 28);
        for (let i = 0; i < 8; i++) far.cbox(13, 0.1, 0.1, c.cream, 0, 0, 0, { rz: (i / 8) * Math.PI });
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          far.ball(0.42, [c.peach300, c.lake300, c.butter300, c.lilac300][i % 4], Math.cos(a) * 6.5, Math.sin(a) * 6.5 - 0.5, 0, undefined, 0);
        }
      });
      far.box(0.5, 9.5, 0.5, c.cream, 7, 0, 1, { rz: 0.25 });
      far.box(0.5, 9.5, 0.5, c.cream, 13, 0, 1, { rz: -0.25 });
    });
    // Loin, à droite : remparts et toits de Dubrovnik, sur sa colline.
    far.at(32, 0, 0, () => {
      hill(far, 6, -8, 24, 12, mix(c.sage500, c.sage300, 0.3), 12);
      far.box(26, 4.2, 2.6, stone, 0, 0, 4);
      for (let x = -12.5; x <= 12.5; x += 1.4) far.box(0.7, 0.7, 2.6, stone, x, 4.2, 4);
      far.cyl(2.4, 2.8, 8, stone, 12, 0, 3, 10);
      far.cone(2.7, 1.6, terracotta, 12, 8, 3, 10);
      far.cyl(1.8, 2, 5.5, stone, -12, 0, 3, 10);
      for (let i = 0; i < 26; i++) {
        const x = -11 + (i % 9) * 2.8 + rng.range(-0.5, 0.5);
        const row = Math.floor(i / 9);
        const y = 3.6 + row * 1.6;
        far.box(2.3, 2, 2, [c.cream, stone, mix(c.butter100, stone, 0.4)][i % 3], x, y, 1 - row * 2);
        far.frustum(2.5, 1.1, 2.2, 0.1, terracotta, x, y + 2, 1 - row * 2);
      }
      far.cyl(0.8, 0.9, 6, stone, 3, 6, -2, 8);
      far.cone(0.9, 2.2, mix(c.sage500, c.inkSoft, 0.2), 3, 12, -2, 8);
    });
    far.box(320, 0.6, 20, mix(c.sage300, c.sand, 0.4), 0, -0.4, -40);
    for (let x = -150; x < 150; x += rng.range(16, 26)) {
      mountain(far, x, -70, rng.range(30, 44), rng.range(12, 20), mix(c.lilac300, c.lake200, 0.4), undefined, 5);
    }
    cloudsAcross(ctx, c.cream, mix(c.cream, c.peach100, 0.6));
  },
};

/* ====================================================================== Paris */

const paris: Scene = {
  farZ: -110,
  farTrack: half(-0.55, -0.24),
  waterFrom: null,
  build(ctx) {
    const { c, near, back, far, rng } = ctx;
    const iron = mix(c.inkSoft, c.sage800, 0.3);
    const zinc = mix(c.lilac300, c.inkSoft, 0.28);
    const stone = mix(c.cream, c.butter100, 0.5);
    // Haie taillée, réverbères, colonnes Morris, terrasses de café, platanes.
    spans(ctx, (x0, x1) => {
      const k = near.at(x0);
      k.box(x1 - x0 - 1.5, 0.42, 0.45, mix(c.sage300, c.sage500, 0.4), (x0 + x1) / 2, 0, -2.2);
    });
    along(ctx, 12, 15, (x) => lamp(near.at(x), x, -2.7, iron, c.butter100, "paris"));
    along(ctx, 6, 10, (x, i) => {
      const k = near.at(x);
      if (i % 4 === 1) {
        k.at(x, 0, -3.6, () => {
          k.cyl(0.45, 0.48, 2.3, iron, 0, 0, 0, 10);
          k.cyl(0.47, 0.47, 1.3, c.cream, 0, 0.6, 0, 10);
          for (let j = 0; j < 3; j++) k.box(0.32, 0.5, 0.05, [c.peach300, c.lake300, c.butter300][j], -0.3 + j * 0.3, 0.75, 0.46, { ry: (j - 1) * 0.6 });
          k.sphere(0.5, iron, 0, 2.3, 0, undefined, 10, 4, 0.5);
          k.ball(0.1, iron, 0, 2.85, 0, undefined, 0);
        });
      } else if (i % 4 === 3) {
        k.at(x, 0, -3.4, () => {
          k.cyl(0.04, 0.04, 0.72, iron, 0, 0, 0, 5);
          k.cyl(0.4, 0.4, 0.04, c.cream, 0, 0.72, 0, 10);
          k.cyl(0.03, 0.03, 2.1, iron, 0, 0.76, 0, 4);
          k.cone(1.2, 0.5, i % 8 === 3 ? c.peach300 : c.lake300, 0, 2.2, 0, 8);
          k.cone(1.21, 0.1, c.cream, 0, 2.2, 0, 8);
          for (const s of [-1, 1]) {
            k.cyl(0.21, 0.2, 0.05, mix(c.butter300, c.cream, 0.4), s * 0.75, 0.42, 0, 8);
            k.torus(0.16, 0.022, mix(c.butter500, c.clayEdge, 0.45), s * 0.92, 0.6, 0, { ry: Math.PI / 2 }, Math.PI, 3, 8);
            for (const dz of [-0.13, 0.13]) k.box(0.03, 0.42, 0.03, mix(c.butter500, c.clayEdge, 0.45), s * 0.75, 0, dz);
          }
        });
      } else {
        tree(k, x, rng.range(-4.8, -6.2), rng.range(1.05, 1.3), "round", c.sage300, mix(c.sand, c.sage500, 0.35), c.sage500);
      }
    });
    // Fond : rangée d'immeubles haussmanniens.
    let x = ctx.from;
    while (x < ctx.to) {
      const w = rng.range(5, 7);
      const h = rng.range(4.2, 5.4);
      const z = -58 - rng.range(0, 2);
      building(back.at(x), x + w / 2, z, w, h, 6, stone, {
        roof: "mansard",
        roofColor: zinc,
        windows: mix(c.lake200, c.inkSoft, 0.25),
        trim: mix(stone, c.sand, 0.6),
        rows: 4,
      });
      for (let r = 1; r < 4; r += 2) back.at(x).box(w - 0.4, 0.06, 0.3, iron, x + w / 2, 0.55 + r * ((h - 0.7) / 4) - 0.08, z + 3.1);
      x += w + rng.range(0.1, 0.4);
    }
    frontDots(ctx, [c.lilac300, c.peach300, c.cream, c.butter300], "flower");
    frontClumps(ctx, ["bush", "bush", "rock"], [c.lilac300, c.peach300, c.cream, c.clay]);

    // Loin : la tour Eiffel, le Sacré-Cœur sur sa butte, les toits de Paris.
    const eiffel = mix(mix(c.peach500, c.lilac500, 0.3), c.inkSoft, 0.12);
    far.at(0, 0, 0, () => {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) far.box(1.9, 7.2, 1.9, eiffel, sx * 4.1, 0, sz * 4.1, { rz: sx * 0.42, rx: -sz * 0.42 });
      }
      far.torus(3, 0.42, eiffel, 0, 3, 4.2, undefined, Math.PI, 3, 12);
      far.torus(3, 0.42, eiffel, 0, 3, -4.2, undefined, Math.PI, 3, 12);
      far.box(9.4, 0.9, 9.4, eiffel, 0, 5.8, 0);
      far.box(9.8, 0.25, 9.8, mix(eiffel, c.cream, 0.35), 0, 6.7, 0);
      far.frustum(6.2, 6.4, 6.2, 0.5, eiffel, 0, 6.9, 0);
      far.box(4.2, 0.7, 4.2, eiffel, 0, 13.2, 0);
      far.box(4.4, 0.2, 4.4, mix(eiffel, c.cream, 0.35), 0, 13.9, 0);
      far.frustum(3, 7.6, 3, 0.22, eiffel, 0, 14.1, 0);
      far.box(1.1, 1, 1.1, mix(eiffel, c.cream, 0.3), 0, 21.5, 0);
      far.cyl(0.08, 0.2, 1.8, eiffel, 0, 22.5, 0, 5);
    }, { s: 1.2 });
    far.at(-46, 0, -10, () => {
      hill(far, 0, 0, 16, 7, mix(c.sage300, c.sage500, 0.4), 10);
      far.box(7, 3.5, 4, c.cream, 0, 6.2, 0);
      far.sphere(2.2, c.cream, 0, 9.7, 0, { sy: 1.25 }, 10, 5, 0.5);
      far.cyl(0.3, 0.4, 1.4, c.cream, 0, 12.3, 0, 6);
      for (const s of [-1, 1]) far.sphere(1, c.cream, s * 2.6, 9.7, 0.5, { sy: 1.3 }, 8, 4, 0.5);
    });
    for (let xx = -150; xx < 150; xx += rng.range(3.5, 6)) {
      if (Math.abs(xx) < 6) continue;
      building(far, xx, rng.range(2, 8), rng.range(3, 5.5), rng.range(3, 5.5), 3, mix(stone, c.peach100, 0.3), {
        roof: "hip",
        roofColor: zinc,
      });
    }
    cloudsAcross(ctx, c.cream, mix(c.cream, c.lilac100, 0.6));
  },
};

/* ====================================================================== Shanghai */

const shanghai: Scene = {
  farZ: -105,
  farTrack: half(-0.55, -0.24),
  waterFrom: -2.6,
  build(ctx) {
    const { c, near, back, far, rng, theme } = ctx;
    const stone = mix(c.cream, c.sand, 0.4);
    const iron = mix(c.inkSoft, c.ink, 0.2);
    const lights = [c.butter200, c.peach200, c.lilac200, c.lake100];
    // Le Bund : balustrade de pierre, lampadaires, guirlandes de lanternes.
    spans(ctx, (x0, x1) => {
      const k = near.at(x0);
      railing(k, x0, x1, -2.2, stone, stone, 0.95, 1.1);
      for (let x = x0 + 4; x < x1; x += 10) {
        for (const px of [x, x + 8]) k.cyl(0.035, 0.05, 2.9, mix(c.clay, c.inkSoft, 0.4), px, 0, -2.4, 5);
        for (let j = 0; j < 8; j++) {
          // Fil de la guirlande (petits segments en chaînette).
          const a = j / 8;
          const b = (j + 1) / 8;
          const ya = 2.9 - Math.sin(a * Math.PI) * 0.55;
          const yb = 2.9 - Math.sin(b * Math.PI) * 0.55;
          k.cbox(Math.hypot(1, yb - ya), 0.025, 0.025, mix(c.clay, c.inkSoft, 0.4), x + (a + b) * 4, (ya + yb) / 2, -2.4, { rz: Math.atan2(yb - ya, 1) });
        }
        for (let j = 0; j < 6; j++) {
          const t = (j + 0.5) / 6;
          k.glow(() => k.ball(0.16, mix(c.clay, c.peach300, 0.45), x + t * 8, 2.72 - Math.sin(t * Math.PI) * 0.55, -2.4, { sy: 0.85 }, 0));
        }
      }
    });
    along(ctx, 13, 16, (x) => lamp(near.at(x), x + 2, -2.5, iron, c.butter200, "globe", theme.night));
    // Huangpu : ferries illuminés, sampans.
    along(ctx, 26, 40, (x, i) => {
      const k = back.at(x);
      k.at(x, -0.3, rng.range(-12, -26), () => {
        k.sphere(1, i % 2 ? c.cream : c.lake500, 0, 0.5, 0, { rx: Math.PI, sx: 3, sy: 0.5, sz: 0.9 }, 10, 4, 0.5);
        k.box(5, 0.9, 1.4, c.cream, 0, 0.5, 0);
        k.glow(() => {
          for (let j = 0; j < 6; j++) k.box(0.45, 0.35, 0.05, lights[j % 4], -2 + j * 0.8, 0.8, 0.71);
        });
        k.box(5.2, 0.1, 1.5, c.clay, 0, 1.4, 0);
      });
    });
    frontDots(ctx, [c.clay, c.peach300, c.butter300], "flower");
    frontClumps(ctx, ["bush", "rock"], [c.clay, c.peach300, c.butter300]);

    // Loin, rive de Pudong : perle de l'Orient, Jin Mao, Shanghai Tower, « décapsuleur ».
    far.box(320, 1.2, 16, mix(c.sage300, c.oatDeep, 0.5), 0, -0.4, -8);
    const pearl = mix(c.peach500, c.lilac500, 0.35);
    far.at(0, 0, 0, () => {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        far.cyl(0.7, 0.85, 6, c.cream, Math.cos(a) * 1.8, 0, Math.sin(a) * 1.8, 6, { rz: Math.cos(a) * 0.12, rx: -Math.sin(a) * 0.12 });
      }
      far.ball(2.8, pearl, 0, 6.8, 0);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        far.cyl(0.5, 0.55, 6.2, c.cream, Math.cos(a) * 0.9, 8.6, Math.sin(a) * 0.9, 6);
      }
      far.ball(2, pearl, 0, 15.2, 0);
      far.cyl(0.45, 0.55, 2.2, c.cream, 0, 16.6, 0, 6);
      far.ball(0.85, pearl, 0, 19.2, 0);
      far.cyl(0.1, 0.3, 2.6, c.cream, 0, 19.8, 0, 6);
    });
    // Jin Mao : tour à gradins.
    far.at(8.5, 0, -4, () => {
      for (let i = 0; i < 8; i++) far.box(3.2 - i * 0.3, 2.6 - i * 0.1, 3.2 - i * 0.3, mix(c.lilac300, c.butter300, 0.3 + (i % 2) * 0.2), 0, i * 2.4, 0);
      far.cyl(0.06, 0.4, 3.5, c.cream, 0, 19.4, 0, 6);
    });
    // Shanghai Tower : torsadée, la plus haute.
    far.at(14, 0, -6, () => {
      for (let i = 0; i < 12; i++) far.box(4 - i * 0.18, 2.6, 4 - i * 0.18, mix(c.lake300, c.lake200, (i % 2) * 0.5), 0, i * 2.5, 0, { ry: i * 0.12 });
      far.frustum(1.8, 2, 1.8, 0.4, c.lake200, 0, 30, 0, { ry: 1.4 });
    });
    // SWFC : le « décapsuleur ».
    far.at(20, 0, -3, () => {
      far.box(1.3, 21, 3, c.lake200, -1.4, 0, 0, { rz: -0.04 });
      far.box(1.3, 21, 3, c.lake200, 1.4, 0, 0, { rz: 0.04 });
      far.box(4, 2, 3, c.lake200, 0, 21, 0);
      far.box(4.2, 15, 3, c.lake200, 0, 0, -0.6);
    });
    for (let xx = -150; xx < 150; xx += rng.range(3.5, 6)) {
      if (xx > -4 && xx < 24) continue;
      const h = Math.abs(xx) < 50 ? rng.range(6, 14) : rng.range(3, 7);
      building(far, xx, rng.range(-6, 2), rng.range(2.6, 4.5), h, 3, rng.chance(0.5) ? c.lilac200 : mix(c.lake200, c.peach100, 0.3), {
        roof: "flat",
        roofColor: c.sand,
        windows: mix(c.lilac300, c.inkSoft, 0.15),
        litColor: lights[Math.abs(Math.round(xx)) % 4],
        rows: Math.max(2, Math.round(h / 1.6)),
        cols: 2,
      });
    }
    cloudsAcross(ctx, mix(c.peach100, c.cream, 0.4), mix(c.peach200, c.lilac200, 0.4));
  },
};

/* ====================================================================== Tokyo */

const tokyo: Scene = {
  farZ: -110,
  farTrack: half(-0.55, -0.24),
  waterFrom: null,
  build(ctx) {
    const { c, near, back, far, rng } = ctx;
    const red = mix(c.clay, c.peach500, 0.25);
    const neon = [c.peach300, c.lilac300, c.lake300, c.butter300, c.sage300];
    const wall = [c.lilac200, c.lake200, c.peach200, c.cream];
    // Cerisiers, torii, lanternes de pierre, distributeurs, enseignes lumineuses, petites boutiques.
    along(ctx, 5, 8, (x, i) => {
      const k = near.at(x);
      const kind = i % 6;
      if (kind === 0) {
        k.at(x, 0, -4.2, () => {
          for (const s of [-1, 1]) k.cyl(0.13, 0.16, 3, red, s * 1.2, 0, 0, 8);
          k.box(3.4, 0.22, 0.3, red, 0, 2.3, 0);
          k.box(3.9, 0.22, 0.34, red, 0, 2.95, 0);
          k.box(4.3, 0.14, 0.4, mix(c.ink, c.inkSoft, 0.5), 0, 3.15, 0);
          k.box(0.25, 0.65, 0.1, mix(c.ink, c.inkSoft, 0.5), 0, 2.4, 0.1);
        });
      } else if (kind === 2) {
        k.at(x, 0, -2.8, () => {
          k.box(0.9, 1.8, 0.7, i % 4 ? c.cream : c.lake300, 0, 0, 0);
          k.glow(() => {
            k.box(0.72, 0.9, 0.02, c.lake100, 0, 0.8, 0.36);
            for (let r = 0; r < 3; r++) for (let j = 0; j < 4; j++) k.cyl(0.05, 0.05, 0.16, neon[(r + j) % 5], -0.25 + j * 0.17, 0.86 + r * 0.28, 0.38, 5);
          });
          k.box(0.9, 0.14, 0.72, c.peach500, 0, 1.8, 0);
        });
      } else if (kind === 4) {
        k.at(x, 0, -5.5, () => {
          k.cyl(0.05, 0.05, 2, mix(c.inkSoft, c.ink, 0.2), 0, 0, 0, 5);
          k.glow(() => {
            k.box(0.7, 2.2, 0.15, neon[i % 5], 0, 1.6, 0);
            for (let j = 0; j < 4; j++) k.box(0.4, 0.3, 0.05, c.cream, 0, 1.85 + j * 0.48, 0.08);
          });
        });
      } else {
        tree(k, x, rng.range(-3.6, -5), rng.range(0.95, 1.2), "blossom", mix(c.peach200, c.lilac200, 0.3), mix(c.clayEdge, c.inkSoft, 0.35), mix(c.peach100, c.cream, 0.3));
        if (kind === 5) lamp(k, x + 2, -2.6, mix(c.sand, c.inkSoft, 0.2), c.butter200, "stone", true);
      }
    });
    along(ctx, 7, 10, (x, i) => {
      const k = near.at(x);
      const w = rng.range(3.2, 4.6);
      const z = rng.range(-8.5, -10);
      building(k, x, z, w, rng.range(2.8, 3.8), 3, wall[i % 4], { roof: "flat", roofColor: mix(c.inkSoft, c.lilac300, 0.5) });
      k.glow(() => k.box(w * 0.7, 0.45, 0.06, neon[i % 5], x, 2.2, z + 1.55));
      for (let j = 0; j < 4; j++) k.quad(w * 0.16, 0.7, [c.lake500, c.clay][i % 2], x - w * 0.3 + j * w * 0.2, 1.45, z + 1.52);
    });
    // Fond : la ville dense, fenêtres et enseignes allumées.
    along(ctx, 3.5, 6, (x, i) => {
      const h = rng.range(3, 6.5);
      const z = rng.range(-44, -58);
      building(back.at(x), x, z, rng.range(3, 5), h, 4, wall[i % 4], {
        roof: "flat",
        roofColor: mix(c.inkSoft, c.lilac300, 0.45),
        windows: mix(c.lilac300, c.inkSoft, 0.25),
        litColor: c.butter200,
        rows: Math.round(h / 1.5),
        cols: 3,
      });
      if (i % 2 === 0) back.at(x).glow(() => back.at(x).box(0.6, Math.min(4, h * 0.4), 0.15, neon[i % 5], x + 1.8, h * 0.4, z + 2.1));
    });
    frontDots(ctx, [c.peach200, c.cream, mix(c.peach200, c.lilac200, 0.5)], "petal");
    frontClumps(ctx, ["rock", "bush"], [c.peach200, c.cream, c.lilac300]);

    // Loin : la tour de Tokyo (orange et blanc), le mont Fuji, la ville.
    const orange = c.peach500;
    far.at(0, 0, 0, () => {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) far.box(1.4, 6, 1.4, orange, sx * 3.2, 0, sz * 3.2, { rz: sx * 0.4, rx: -sz * 0.4 });
      }
      far.torus(2.4, 0.34, orange, 0, 2.4, 3.4, undefined, Math.PI, 3, 12);
      const bands = [orange, c.cream];
      for (let i = 0; i < 5; i++) far.frustum(4.8 - i * 0.62, 2.1, 4.8 - i * 0.62, (4.8 - (i + 1) * 0.62) / (4.8 - i * 0.62), bands[i % 2], 0, 5 + i * 2.1, 0);
      far.box(5.2, 1.6, 5.2, c.cream, 0, 8.4, 0);
      far.glow(() => far.box(5.22, 0.45, 5.22, c.butter200, 0, 9.2, 0));
      far.box(2.6, 1, 2.6, c.cream, 0, 15.4, 0);
      for (let i = 0; i < 3; i++) far.cyl(0.36 - i * 0.08, 0.44 - i * 0.08, 1.6, bands[i % 2], 0, 16.4 + i * 1.6, 0, 6);
    }, { s: 1.15 });
    far.at(-34, 0, -45, () => {
      far.cone(36, 24, mix(c.lilac300, c.lake300, 0.3), 0, -0.5, 0, 9, { sz: 0.5 });
      far.cone(11, 7.4, c.cream, 0, 16.1, 0, 9, { sz: 0.5 });
    });
    for (let xx = -150; xx < 150; xx += rng.range(3, 5)) {
      if (Math.abs(xx) < 5) continue;
      const h = rng.range(3, 9);
      building(far, xx, rng.range(-2, 8), rng.range(2.4, 4), h, 3, mix(c.lilac300, c.lilac200, rng.range(0, 1)), {
        roof: "flat",
        roofColor: c.lilac300,
        windows: mix(c.lilac300, c.inkSoft, 0.2),
        litColor: c.butter200,
        rows: Math.max(2, Math.round(h / 1.5)),
        cols: 2,
      });
    }
    cloudsAcross(ctx, mix(c.lilac200, c.peach100, 0.5), mix(c.lilac300, c.peach200, 0.4));
  },
};

/* ====================================================================== Berlin */

const berlin: Scene = {
  farZ: -110,
  farTrack: half(-0.55, -0.24),
  waterFrom: null,
  build(ctx) {
    const { c, near, back, far, rng, level } = ctx;
    const iron = mix(c.inkSoft, c.ink, 0.25);
    const concrete = mix(c.cream, c.sand, 0.55);
    const blobs = [c.peach300, c.lake300, c.butter300, c.lilac300, c.sage300];
    along(ctx, 6, 9, (x, i) => {
      const k = near.at(x);
      const kind = i % 5;
      if (kind === 1) {
        // Feu de piéton avec l'Ampelmännchen.
        k.at(x, 0, -2.6, () => {
          k.cyl(0.05, 0.06, 2.5, iron, 0, 0, 0, 6);
          k.box(0.34, 0.7, 0.3, mix(c.butter500, iron, 0.2), 0, 1.8, 0.05);
          k.glow(() => {
            k.ball(0.11, c.clay, 0, 2.3, 0.2, { sz: 0.3 }, 0);
            k.ball(0.11, c.sage300, 0, 1.98, 0.2, { sz: 0.3 }, 0);
          });
        });
      } else if (kind === 3) {
        // Pan de mur peint.
        k.at(x, 0, -4.4, () => {
          for (let j = 0; j < 3; j++) {
            k.box(1.18, 2.5, 0.3, concrete, -1.2 + j * 1.2, 0, 0);
            k.cyl(0.13, 0.13, 1.18, mix(concrete, c.cream, 0.4), -0.61 + j * 1.2, 2.4, 0, 8, { rz: Math.PI / 2 });
          }
          // Fresque : bandes de couleur et un grand cœur.
          for (let j = 0; j < 4; j++) k.quad(3.4, 0.32, blobs[(j + i) % 5], 0, 0.46 + j * 0.42, 0.16);
          k.cbox(0.6, 0.6, 0.03, c.clay, -0.18, 1.9, 0.17, { rz: Math.PI / 4 });
          k.ball(0.3, c.clay, -0.38, 2.08, 0.17, { sz: 0.1 }, 1);
          k.ball(0.3, c.clay, 0.02, 2.08, 0.17, { sz: 0.1 }, 1);
        });
      } else {
        tree(k, x, rng.range(-3.8, -5.4), rng.range(1, 1.25), "round", c.sage300, mix(c.clayEdge, c.inkSoft, 0.3), c.sage500);
        if (kind === 4) lamp(k, x + 2.5, -2.4, iron, c.butter100, "classic");
      }
    });
    // Fond : immeubles anciens pastel, la cathédrale et son dôme vert-de-gris.
    along(ctx, 5.5, 8, (x, i) => {
      const color = [c.peach200, c.butter200, c.lake200, c.lilac200, c.sage200][i % 5];
      const h = rng.range(3.6, 5.2);
      building(back.at(x), x, rng.range(-42, -50), rng.range(4.5, 6), h, 5, color, {
        roof: i % 2 ? "hip" : "flat",
        roofColor: mix(c.clay, c.inkSoft, 0.35),
        windows: mix(color, c.inkSoft, 0.3),
        trim: mix(color, c.cream, 0.5),
        rows: 4,
      });
    });
    const domeX = level.startX + (level.gateX - level.startX) * 0.55;
    back.at(domeX).at(domeX, 0, -64, () => {
      const k = back.at(domeX);
      k.box(12, 8, 9, mix(c.sand, c.cream, 0.4), 0, 0, 0);
      k.cyl(3.8, 4, 2.5, mix(c.sand, c.cream, 0.4), 0, 8, 0, 12);
      k.sphere(3.8, mix(c.sage500, c.lake300, 0.4), 0, 10.5, 0, { sy: 1.3 }, 12, 6, 0.5);
      k.cyl(0.4, 0.6, 2, mix(c.sage500, c.lake300, 0.4), 0, 15.3, 0, 8);
      for (const s of [-1, 1]) {
        k.cyl(1, 1.1, 3, mix(c.sand, c.cream, 0.4), s * 5, 8, 0, 8);
        k.sphere(1.1, mix(c.sage500, c.lake300, 0.4), s * 5, 11, 0, { sy: 1.4 }, 8, 4, 0.5);
      }
    }, { s: 0.6 });
    // La porte de Brandebourg, juste derrière la porte d'embarquement.
    const bx = level.gateX + 3;
    back.at(bx).at(bx, 0, -22, () => {
      const k = back.at(bx);
      const sandstone = mix(c.butter200, c.cream, 0.4);
      k.box(13, 0.5, 3.4, sandstone, 0, 0, 0);
      for (let i = 0; i < 6; i++) {
        const px = -5.5 + i * 2.2;
        k.cyl(0.38, 0.42, 5.4, sandstone, px, 0.5, 0.9, 10);
        k.cyl(0.38, 0.42, 5.4, sandstone, px, 0.5, -0.9, 10);
      }
      k.box(13.2, 1.1, 3.4, sandstone, 0, 5.9, 0);
      k.box(13.4, 0.2, 3.6, mix(sandstone, c.sand, 0.5), 0, 7, 0);
      k.box(6, 1.2, 2.6, sandstone, 0, 7.2, 0);
      const patina = mix(c.sage500, c.lake300, 0.35);
      k.box(1.8, 0.7, 1, patina, 0, 8.4, 0);
      for (let i = 0; i < 4; i++) {
        const hx = -1.1 + i * 0.73;
        k.ball(0.32, patina, hx, 8.95, 0.5, { sx: 1.4 });
        k.ball(0.18, patina, hx - 0.25, 9.35, 0.5);
      }
      k.cyl(0.04, 0.05, 1.4, patina, 0.3, 8.9, 0, 4);
      k.ball(0.2, patina, 0.3, 10.4, 0);
    }, { s: 0.62 });
    frontDots(ctx, [c.butter300, c.cream, c.lilac300], "flower");
    frontClumps(ctx, ["bush", "rock"], [c.butter300, c.cream, c.lilac300]);

    // Loin : la tour de télévision (Fernsehturm) et la ville.
    far.at(0, 0, 0, () => {
      far.box(6, 1.2, 4, mix(c.cream, c.sand, 0.4), 0, 0, 0);
      far.cyl(0.55, 1.1, 17, c.cream, 0, 0, 0, 8);
      far.ball(2.6, mix(c.lilac200, c.cream, 0.45), 0, 19.3, 0);
      far.cyl(2.65, 2.65, 0.6, mix(c.lilac300, c.inkSoft, 0.25), 0, 19.1, 0, 14);
      far.cyl(0.4, 0.55, 2.4, c.cream, 0, 21.6, 0, 6);
      for (let i = 0; i < 4; i++) far.cyl(0.18 - i * 0.03, 0.22 - i * 0.03, 1.1, i % 2 ? c.cream : c.clay, 0, 24 + i * 1.1, 0, 6);
    });
    for (let xx = -150; xx < 150; xx += rng.range(4, 7)) {
      if (Math.abs(xx) < 4) continue;
      const h = rng.range(3, 8);
      building(far, xx, rng.range(-2, 6), rng.range(3, 6), h, 3, mix(c.lake200, c.lilac200, rng.range(0, 1)), {
        roof: rng.chance(0.4) ? "hip" : "flat",
        roofColor: mix(c.clay, c.lilac300, 0.5),
        windows: mix(c.lilac300, c.inkSoft, 0.15),
        bands: true,
        rows: 3,
      });
    }
    cloudsAcross(ctx, c.cream, mix(c.cream, c.lilac100, 0.6));
  },
};

/* ====================================================================== Busan */

const busan: Scene = {
  farZ: -105,
  farTrack: half(-0.55, -0.24),
  waterFrom: -13,
  build(ctx) {
    const { c, near, back, far, rng } = ctx;
    const wood = mix(c.butter500, c.clayEdge, 0.4);
    const umbrellas = [c.peach300, c.lake300, c.butter300, c.lilac300, c.sage300];
    // Plage de Gwangalli : parasols, serviettes, poste de sauveteur, pins.
    spans(ctx, (x0, x1) => near.at(x0).box(x1 - x0, 0.12, 0.4, wood, (x0 + x1) / 2, -0.06, -1.95));
    along(ctx, 4, 7, (x, i) => {
      const k = near.at(x);
      const z = rng.range(-4.5, -9);
      if (i % 9 === 4) {
        k.at(x, 0, z - 1, () => {
          for (const s of [-1, 1]) for (const t of [-1, 1]) k.box(0.1, 2.2, 0.1, wood, s * 0.6, 0, t * 0.6);
          k.box(1.6, 0.1, 1.6, wood, 0, 2.2, 0);
          k.box(1.4, 0.9, 1.4, c.cream, 0, 2.3, 0);
          k.frustum(1.9, 0.6, 1.9, 0.2, c.clay, 0, 3.2, 0);
        });
        return;
      }
      k.at(x, 0, z, () => {
        const color = umbrellas[i % 5];
        k.cyl(0.03, 0.03, 2.1, c.cream, 0, 0, 0, 4, { rz: 0.12 });
        k.cone(1.15, 0.45, color, -0.22, 1.85, 0, 8);
        k.cone(1.16, 0.1, c.cream, -0.22, 1.85, 0, 8);
        k.box(1.7, 0.03, 0.9, umbrellas[(i + 2) % 5], 0.6, 0, 0.6, { ry: 0.3 });
      });
    });
    along(ctx, 18, 30, (x) => tree(near.at(x), x, rng.range(-3.4, -4), rng.range(1, 1.3), "pine", c.sage500, c.clayEdge, mix(c.sage500, c.sage800, 0.4)));
    // Mer : bateaux de pêche colorés.
    along(ctx, 18, 34, (x, i) => {
      const k = back.at(x);
      k.at(x, -0.3, rng.range(-18, -36), () => {
        k.sphere(1, [c.lake500, c.cream, c.peach500][i % 3], 0, 0.45, 0, { rx: Math.PI, sx: 2.2, sy: 0.45, sz: 0.75 }, 10, 4, 0.5);
        k.box(1.1, 0.8, 1, c.cream, 0.5, 0.4, 0);
        k.box(1.2, 0.1, 1.1, [c.clay, c.lake500][i % 2], 0.5, 1.2, 0);
        k.cyl(0.03, 0.03, 1.8, c.cream, -0.6, 0.4, 0, 4);
      });
    });
    frontDots(ctx, [c.cream, c.peach300, c.lilac200, c.peach500], "shell");
    frontClumps(ctx, ["star", "rock", "star"], [c.peach500, c.butter500, c.lilac300]);

    // Loin : le pont de Gwangan, les montagnes, Haeundae, le village de Gamcheon.
    const deck = mix(c.cream, c.lake200, 0.3);
    far.at(0, 0, 0, () => {
      far.box(120, 0.7, 2, deck, 0, 4, 0);
      for (let x = -56; x <= 56; x += 8) far.box(0.8, 4, 0.8, deck, x, 0, 0);
      for (const tx of [-13, 13]) {
        far.box(0.9, 15, 0.9, c.cream, tx, 0, 0.8);
        far.box(0.9, 15, 0.9, c.cream, tx, 0, -0.8);
        far.box(1, 0.6, 2.4, c.cream, tx, 13.2, 0);
      }
      // Câbles porteurs (paraboles en petits segments).
      const cable = (x0: number, y0: number, x1: number, y1: number, sag: number) => {
        const n = 12;
        for (let i = 0; i < n; i++) {
          const t0 = i / n;
          const t1 = (i + 1) / n;
          const px = (t: number) => x0 + (x1 - x0) * t;
          const py = (t: number) => y0 + (y1 - y0) * t - sag * 4 * t * (1 - t);
          const ax = px(t0);
          const ay = py(t0);
          const bx2 = px(t1);
          const by2 = py(t1);
          const len = Math.hypot(bx2 - ax, by2 - ay);
          far.cbox(len, 0.14, 0.14, c.lake500, (ax + bx2) / 2, (ay + by2) / 2, 0.6, { rz: Math.atan2(by2 - ay, bx2 - ax) });
        }
      };
      cable(-13, 14.5, 13, 14.5, 9.5);
      cable(-40, 4.5, -13, 14.5, 3);
      cable(13, 14.5, 40, 4.5, 3);
      far.glow(() => {
        for (let x = -50; x <= 50; x += 4) far.ball(0.28, [c.lilac200, c.lake100, c.butter100][Math.abs(x / 4) % 3], x, 4.9, 1.1, undefined, 0);
      });
    });
    for (let x = -160; x < 160; x += rng.range(16, 26)) hill(far, x, -36 - rng.range(0, 10), rng.range(16, 26), rng.range(10, 18), mix(c.sage500, c.sage300, rng.range(0.2, 0.6)), 10);
    for (let i = 0; i < 9; i++) {
      const h = rng.range(10, 20);
      building(far, 42 + i * 3.4, -12, 2.8, h, 3, i % 2 ? c.lake200 : c.cream, { roof: "flat", roofColor: c.sand, windows: c.lake300, bands: true, rows: Math.round(h / 2) });
    }
    far.at(-46, 0, -16, () => {
      hill(far, 0, 0, 20, 12, mix(c.sage500, c.sage300, 0.3), 12);
      const houses = [c.peach300, c.lake300, c.butter300, c.lilac300, c.sage200, c.peach500, c.cream];
      for (let i = 0; i < 46; i++) {
        const a = rng.range(-1.15, 1.15);
        const r = rng.range(0.25, 0.92);
        const hx = Math.sin(a) * 20 * r;
        const hy = Math.cos(a) * 12 * Math.sqrt(1 - r * r * 0.6) * 0.92;
        far.box(1.6, 1.3, 1.6, houses[i % houses.length], hx, Math.max(0, hy - 0.6), 6 + r * 4);
        far.box(1.7, 0.18, 1.7, mix(houses[(i + 3) % houses.length], c.cream, 0.3), hx, Math.max(0, hy - 0.6) + 1.3, 6 + r * 4);
      }
    });
    cloudsAcross(ctx, c.cream, mix(c.cream, c.lake100, 0.6));
  },
};

const SCENES: Partial<Record<LevelId, Scene>> = {
  geneve,
  seoul,
  toronto,
  "brighton-dubrovnik": brightonDubrovnik,
  paris,
  shanghai,
  tokyo,
  berlin,
  busan,
};

export function sceneFor(id: LevelId): Scene {
  return SCENES[id] ?? geneve;
}
