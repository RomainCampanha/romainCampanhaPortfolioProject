import { Shape } from "three";
import type { LevelId } from "@/lib/game/types";
import { mix, type Palette } from "../palette";
import type { Kit } from "./kit";
import { swissCross } from "./props";

// Habillage des obstacles par ville. La simulation ne connaît que 4 boîtes de collision
// (generate.ts : OBSTACLE_SIZE) ; chaque habillage reste DANS sa boîte (largeur centrée sur
// x = 0, de y = 0 au sommet) pour que ce qu'on voit soit ce qui touche :
// - « cône »    0,50 × 0,72 m  : petit objet debout (pot de géraniums, jarre, borne…)
// - « valise »  0,80 × 0,62 m par étage (piles de 1 à 3 : 3 = double saut obligatoire)
// - « banc »    1,70 × 0,62 m  : long et bas (banc, canoë, chariot de croissants…)
// - « pigeon »  0,62 × 0,42 m  : ce qui vole vers Rominou (pigeon, mouette, cerf-volant…)

export type FlyMotion = "flap" | "sway" | "tumble" | "hover";

export type Flyer = {
  body: (k: Kit, v: number) => void;
  /** Aile droite (côté +z), pivot à l'origine ; la gauche est son miroir si `mirror`. */
  wing?: (k: Kit) => void;
  pivot: [number, number, number];
  mirror: boolean;
  motion: FlyMotion;
};

export type Skins = {
  cone: (k: Kit, v: number) => void;
  stack: (k: Kit, v: number, stack: number) => void;
  bench: (k: Kit, v: number) => void;
  flyer: Flyer;
  /** Nombre de variantes de couleur (géométries distinctes mises en cache). */
  variants: number;
};

const H = 0.62; // hauteur d'un étage de « valise »

export function skinsFor(id: LevelId, c: Palette): Skins {
  const wood = mix(c.butter500, c.clayEdge, 0.35);
  const woodDark = mix(c.clayEdge, c.inkSoft, 0.25);
  const iron = mix(c.inkSoft, c.ink, 0.3);
  const pick = (v: number, list: string[]) => list[((v % list.length) + list.length) % list.length];

  const pigeon: Flyer = {
    body: (k) => {
      const body = mix(c.lilac300, c.sand, 0.35);
      k.ball(0.2, body, 0.04, 0.21, 0, { sx: 1.35, sy: 0.95, sz: 0.85 });
      k.ball(0.12, body, -0.22, 0.32, 0);
      k.ball(0.09, c.sage300, -0.17, 0.25, 0, { sz: 1.2 }); // cou irisé
      k.cone(0.035, 0.1, c.butter500, -0.33, 0.31, 0, 6, { rz: Math.PI / 2 });
      for (const z of [-0.07, 0.07]) k.ball(0.022, c.ink, -0.27, 0.35, z, undefined, 0);
      k.box(0.18, 0.04, 0.16, c.lilac500, 0.3, 0.2, 0, { rz: 0.25 });
    },
    wing: (k) => k.ball(0.2, c.lilac500, 0.03, 0, 0.12, { sx: 1.05, sy: 0.2, sz: 0.75 }),
    pivot: [0.04, 0.27, 0.06],
    mirror: true,
    motion: "flap",
  };

  /** Pile de « valises » : un étage dessiné par `unit(k, v, i, top)`. */
  const stacked = (unit: (k: Kit, v: number, i: number, top: boolean) => void) => (k: Kit, v: number, n: number) => {
    for (let i = 0; i < n; i++) k.at(0, i * H, 0, () => unit(k, v + i, i, i === n - 1));
  };

  switch (id) {
    /* ------------------------------------------------------------------ Séoul */
    case "seoul":
      return {
        variants: 3,
        // Onggi : jarre à kimchi en terre brune, couvercle et bouton.
        cone: (k) => {
          const clay = mix(c.clayEdge, c.peach800, 0.5);
          k.cyl(0.13, 0.11, 0.05, woodDark, 0, 0, 0, 9);
          k.sphere(0.24, clay, 0, 0.31, 0, { sy: 1.12 }, 10, 7);
          k.torus(0.2, 0.018, mix(clay, c.butter500, 0.4), 0, 0.42, 0, { rx: Math.PI / 2 }, Math.PI * 2, 4, 16);
          k.cyl(0.14, 0.15, 0.05, clay, 0, 0.55, 0, 9);
          k.cyl(0.16, 0.16, 0.05, mix(clay, c.ink, 0.15), 0, 0.6, 0, 9);
          k.ball(0.045, mix(clay, c.ink, 0.15), 0, 0.68, 0, undefined, 0);
        },
        // Paquets bojagi : boîtes emballées de tissu, nœud sur le dessus.
        stack: stacked((k, v) => {
          const cloth = pick(v, [c.lilac300, c.peach300, c.sage300]);
          const band = pick(v + 1, [c.peach500, c.lake500, c.butter500]);
          k.box(0.74, 0.46, 0.5, cloth, 0, 0, 0);
          k.box(0.13, 0.475, 0.52, band, 0, 0, 0);
          k.ball(0.085, band, -0.09, 0.5, 0, { sx: 1.4, sy: 0.7 });
          k.ball(0.085, band, 0.09, 0.5, 0, { sx: 1.4, sy: 0.7 });
          k.ball(0.06, cloth, 0, 0.5, 0);
        }),
        // Pyeongsang : estrade de bois basse, coussins, petite table et bol de thé.
        bench: (k) => {
          for (const x of [-0.74, 0.74]) for (const z of [-0.3, 0.3]) k.box(0.1, 0.3, 0.1, woodDark, x, 0, z);
          k.box(1.7, 0.1, 0.78, wood, 0, 0.3, 0);
          k.box(0.5, 0.1, 0.5, c.peach300, -0.48, 0.4, 0);
          k.box(0.5, 0.1, 0.5, c.lake300, 0.5, 0.4, 0);
          k.box(0.36, 0.04, 0.3, woodDark, 0.02, 0.5, -0.05);
          k.cyl(0.05, 0.035, 0.07, c.cream, 0.05, 0.54, -0.05, 8);
        },
        flyer: pigeon,
      };

    /* ------------------------------------------------------------------ Toronto */
    case "toronto":
      return {
        variants: 3,
        // Borne d'incendie.
        cone: (k) => {
          const red = c.clay;
          k.cyl(0.18, 0.2, 0.06, iron, 0, 0, 0, 10);
          k.cyl(0.15, 0.15, 0.44, red, 0, 0.06, 0, 10);
          k.cyl(0.17, 0.17, 0.05, c.butter500, 0, 0.47, 0, 10);
          k.sphere(0.15, c.butter500, 0, 0.5, 0, undefined, 10, 5, 0.5);
          k.cyl(0.04, 0.05, 0.07, c.butter500, 0, 0.64, 0, 6);
          for (const s of [-1, 1]) k.cyl(0.06, 0.06, 0.1, c.butter500, s * 0.14, 0.32, 0, 8, { rz: -s * (Math.PI / 2) });
          k.cyl(0.07, 0.07, 0.1, c.butter500, 0, 0.28, 0.13, 8, { rx: Math.PI / 2 });
        },
        // Caisses de sirop d'érable.
        stack: stacked((k, v) => {
          const crate = pick(v, [mix(c.butter500, c.peach300, 0.5), mix(c.butter300, c.peach300, 0.4)]);
          k.box(0.76, 0.56, 0.5, crate, 0, 0, 0);
          for (const y of [0.12, 0.36]) k.box(0.78, 0.06, 0.52, mix(crate, c.clayEdge, 0.25), 0, y, 0);
          k.at(0, 0.27, 0.26, () => {
            // Feuille d'érable stylisée.
            k.cbox(0.13, 0.13, 0.02, c.clay, 0, 0, 0, { rz: Math.PI / 4 });
            k.cbox(0.07, 0.07, 0.02, c.clay, -0.08, 0.06, 0, { rz: Math.PI / 4 });
            k.cbox(0.07, 0.07, 0.02, c.clay, 0.08, 0.06, 0, { rz: Math.PI / 4 });
            k.box(0.02, 0.08, 0.02, c.clay, 0, -0.17, 0);
          });
        }),
        // Canoë sur tréteaux.
        bench: (k) => {
          for (const x of [-0.55, 0.55]) {
            k.box(0.06, 0.36, 0.36, woodDark, x, 0, 0);
            k.box(0.12, 0.04, 0.42, wood, x, 0.33, 0);
          }
          k.sphere(1, c.peach500, 0, 0.47, 0, { sx: 0.85, sy: 0.13, sz: 0.21 }, 14, 6);
          k.sphere(1, c.cream, 0, 0.52, 0, { sx: 0.84, sy: 0.04, sz: 0.215 }, 14, 4);
          k.box(0.05, 0.03, 0.4, wood, -0.2, 0.55, 0);
          k.box(0.05, 0.03, 0.4, wood, 0.25, 0.55, 0);
        },
        // Bernache du Canada.
        flyer: {
          body: (k) => {
            const brown = mix(c.sand, c.clayEdge, 0.35);
            k.ball(0.2, brown, 0.06, 0.2, 0, { sx: 1.3, sy: 0.85, sz: 0.85 });
            k.ball(0.15, c.cream, 0.05, 0.14, 0, { sx: 1.1, sy: 0.6, sz: 0.7 });
            k.cyl(0.04, 0.05, 0.2, c.ink, -0.1, 0.22, 0, 6, { rz: 0.75 });
            k.ball(0.085, c.ink, -0.25, 0.35, 0);
            for (const z of [-0.05, 0.05]) k.ball(0.04, c.cream, -0.23, 0.33, z, undefined, 0);
            k.cone(0.03, 0.09, c.ink, -0.34, 0.34, 0, 6, { rz: Math.PI / 2 });
            k.box(0.1, 0.06, 0.12, c.ink, 0.3, 0.2, 0);
          },
          wing: (k) => k.ball(0.22, mix(c.sand, c.clayEdge, 0.5), 0.03, 0, 0.14, { sx: 1.05, sy: 0.18, sz: 0.8 }),
          pivot: [0.06, 0.26, 0.07],
          mirror: true,
          motion: "flap",
        },
      };

    /* ------------------------------------------------------------------ Brighton & Dubrovnik */
    case "brighton-dubrovnik":
      return {
        variants: 3,
        // Château de sable et son fanion.
        cone: (k) => {
          const sand = mix(c.butter300, c.sand, 0.45);
          k.frustum(0.46, 0.28, 0.46, 0.78, sand, 0, 0, 0);
          k.cyl(0.15, 0.17, 0.2, sand, 0, 0.28, 0, 8);
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            k.box(0.07, 0.07, 0.07, sand, Math.cos(a) * 0.14, 0.48, Math.sin(a) * 0.14);
          }
          k.cone(0.09, 0.12, mix(sand, c.peach300, 0.3), 0, 0.48, 0, 7);
          k.cyl(0.01, 0.01, 0.13, woodDark, 0, 0.58, 0, 4);
          k.box(0.09, 0.05, 0.01, c.lake500, 0.045, 0.66, 0);
        },
        // Glacières rayées.
        stack: stacked((k, v) => {
          const body = pick(v, [c.lake300, c.peach300, c.sage300]);
          k.box(0.74, 0.42, 0.46, body, 0, 0, 0);
          k.box(0.75, 0.06, 0.47, c.cream, 0, 0.18, 0);
          k.box(0.76, 0.1, 0.48, c.cream, 0, 0.42, 0);
          for (const x of [-0.14, 0.14]) k.box(0.03, 0.05, 0.03, iron, x, 0.52, 0);
          k.box(0.32, 0.035, 0.05, iron, 0, 0.565, 0);
        }),
        // Deux transats rayés.
        bench: (k, v) => {
          for (const dx of [-0.55, 0.55]) {
            k.at(dx, 0, 0, () => {
              for (const z of [-0.2, 0.2]) {
                k.box(0.03, 0.3, 0.03, wood, 0.2, 0, z);
                k.box(0.03, 0.46, 0.03, wood, -0.2, 0, z, { rz: -0.28 });
                k.box(0.66, 0.03, 0.03, wood, 0, 0.36, z, { rz: 0.72 });
              }
              const stripes = [pick(v + (dx > 0 ? 1 : 0), [c.peach300, c.lake300, c.lilac300]), c.cream];
              for (let i = 0; i < 5; i++) {
                k.box(0.6, 0.02, 0.08, stripes[i % 2], 0, 0.35, -0.16 + i * 0.08, { rz: 0.72 });
              }
            });
          }
        },
        // Mouette.
        flyer: {
          body: (k) => {
            k.ball(0.18, c.cream, 0.04, 0.2, 0, { sx: 1.4, sy: 0.8, sz: 0.8 });
            k.ball(0.1, c.cream, -0.2, 0.29, 0);
            k.cone(0.025, 0.1, c.butter500, -0.3, 0.28, 0, 6, { rz: Math.PI / 2 });
            for (const z of [-0.06, 0.06]) k.ball(0.02, c.ink, -0.25, 0.32, z, undefined, 0);
            k.box(0.12, 0.03, 0.12, mix(c.lilac200, c.sand, 0.5), 0.27, 0.21, 0);
          },
          wing: (k) => {
            k.box(0.26, 0.03, 0.3, mix(c.lilac200, c.sand, 0.5), 0.02, 0, 0.15);
            k.box(0.13, 0.03, 0.1, c.inkSoft, 0.07, 0, 0.33);
          },
          pivot: [0.04, 0.25, 0.06],
          mirror: true,
          motion: "flap",
        },
      };

    /* ------------------------------------------------------------------ Paris */
    case "paris":
      return {
        variants: 4,
        // Chaise de bistrot en rotin.
        cone: (k) => {
          const rattan = mix(c.butter500, c.clayEdge, 0.45);
          for (const x of [-0.15, 0.15]) for (const z of [-0.14, 0.14]) k.cyl(0.018, 0.018, 0.42, rattan, x, 0, z, 5);
          k.cyl(0.21, 0.2, 0.05, mix(c.butter300, c.cream, 0.4), 0, 0.42, 0, 10);
          k.torus(0.205, 0.022, rattan, 0, 0.45, 0, { rx: Math.PI / 2 }, Math.PI * 2, 4, 16);
          k.torus(0.17, 0.024, rattan, 0, 0.47, -0.17, undefined, Math.PI, 4, 10);
          k.box(0.3, 0.17, 0.02, mix(c.butter300, c.cream, 0.4), 0, 0.48, -0.17);
        },
        // Boîtes de macarons, ruban et nœud.
        stack: stacked((k, v) => {
          const box = pick(v, [c.lilac300, c.peach300, c.sage300, c.lake300]);
          k.box(0.74, 0.38, 0.5, box, 0, 0, 0);
          k.box(0.76, 0.1, 0.52, mix(box, c.cream, 0.45), 0, 0.36, 0);
          k.box(0.08, 0.47, 0.53, c.clay, 0, 0, 0);
          for (const s of [-1, 1]) k.ball(0.06, c.clay, s * 0.07, 0.5, 0, { sx: 1.6, sy: 0.9 });
          k.ball(0.035, c.clay, 0, 0.5, 0, undefined, 0);
        }),
        // Chariot de croissants.
        bench: (k) => {
          const golden = mix(c.butter500, c.peach500, 0.45);
          for (const x of [-0.5, 0.5]) {
            for (const z of [0.25, -0.3]) {
              k.cyl(0.17, 0.17, 0.05, iron, x, 0.17, z, 12, { rx: Math.PI / 2 });
              k.ball(0.04, c.cream, x, 0.17, z + (z > 0 ? 0.06 : -0.01), undefined, 0);
            }
          }
          k.box(1.5, 0.26, 0.56, mix(c.butter500, c.peach300, 0.3), 0, 0.2, 0);
          k.box(1.52, 0.05, 0.57, c.cream, 0, 0.28, 0);
          k.box(1.58, 0.04, 0.6, wood, 0, 0.46, 0);
          [-0.5, -0.17, 0.17, 0.5].forEach((x, i) =>
            k.torus(0.1, 0.045, golden, x, 0.53, 0.02 * (i % 2 ? 1 : -1), { rx: Math.PI / 2, rz: 0.9 + i }, 3.7, 5, 9),
          );
          k.box(0.04, 0.04, 0.5, wood, -0.82, 0.52, 0);
          for (const z of [-0.2, 0.2]) k.box(0.04, 0.14, 0.04, wood, -0.79, 0.4, z);
        },
        flyer: pigeon,
      };

    /* ------------------------------------------------------------------ Shanghai */
    case "shanghai":
      return {
        variants: 2,
        // Lanterne rouge suspendue à son petit portique.
        cone: (k) => {
          for (const x of [-0.2, 0.2]) k.box(0.05, 0.68, 0.05, woodDark, x, 0, 0);
          k.box(0.5, 0.05, 0.08, woodDark, 0, 0.67, 0);
          k.box(0.36, 0.05, 0.3, woodDark, 0, 0, 0);
          k.cyl(0.01, 0.01, 0.12, c.butter500, 0, 0.56, 0, 4);
          k.sphere(0.17, c.clay, 0, 0.42, 0, { sy: 0.85 }, 10, 7);
          k.cyl(0.08, 0.1, 0.04, c.butter500, 0, 0.54, 0, 8);
          k.cyl(0.1, 0.08, 0.04, c.butter500, 0, 0.27, 0, 8);
          k.cyl(0.015, 0.015, 0.12, c.butter500, 0, 0.15, 0, 4);
        },
        // Paniers vapeur en bambou (xiaolongbao).
        stack: stacked((k, _v, _i, top) => {
          const bamboo = mix(c.butter300, c.sand, 0.3);
          const band = mix(c.butter500, c.clayEdge, 0.2);
          for (const y of [0, 0.27]) {
            k.cyl(0.37, 0.37, 0.26, bamboo, 0, y, 0, 12);
            for (const dy of [0.02, 0.2]) k.cyl(0.38, 0.38, 0.04, band, 0, y + dy, 0, 12);
          }
          if (top) {
            k.sphere(0.37, bamboo, 0, 0.53, 0, { sy: 0.2 }, 12, 4, 0.5);
            k.ball(0.035, band, 0, 0.61, 0, undefined, 0);
          }
        }),
        // Longue jardinière fleurie.
        bench: (k) => {
          const stone = mix(c.cream, c.sand, 0.5);
          k.box(1.64, 0.36, 0.5, stone, 0, 0, 0);
          k.box(1.7, 0.06, 0.56, mix(stone, c.inkSoft, 0.12), 0, 0.33, 0);
          for (let i = 0; i < 6; i++) k.ball(0.16, i % 2 ? c.sage500 : c.sage300, -0.68 + i * 0.272, 0.44, i % 2 ? 0.04 : -0.04);
          const flowers = [c.clay, c.peach300, c.butter300, c.lilac300];
          for (let i = 0; i < 9; i++) k.ball(0.055, flowers[i % 4], -0.72 + i * 0.18, 0.56, (i % 3) * 0.08 - 0.08, undefined, 0);
        },
        // Cerf-volant hirondelle et sa queue.
        flyer: {
          body: (k) => {
            k.at(0, 0.21, 0, () => {
              k.cbox(0.3, 0.3, 0.02, c.peach500, 0, 0, 0, { rz: Math.PI / 4 });
              k.cbox(0.18, 0.18, 0.03, c.butter300, 0, 0, 0, { rz: Math.PI / 4 });
              k.ball(0.05, c.clay, 0, 0, 0.02, undefined, 0);
              k.box(0.5, 0.02, 0.02, woodDark, 0, -0.01, 0.015);
            });
          },
          wing: (k) => {
            k.box(0.2, 0.03, 0.01, c.clay, 0.1, -0.015, 0, { rz: -0.2 });
            k.box(0.16, 0.03, 0.01, c.butter500, 0.27, -0.06, 0, { rz: 0.2 });
          },
          pivot: [0.2, 0.06, 0],
          mirror: false,
          motion: "sway",
        },
      };

    /* ------------------------------------------------------------------ Tokyo */
    case "tokyo":
      return {
        variants: 4,
        // Maneki-neko sur son coussin.
        cone: (k) => {
          k.box(0.36, 0.08, 0.3, c.clay, 0, 0, 0);
          k.ball(0.17, c.cream, 0, 0.26, 0, { sy: 1.15 });
          k.ball(0.15, c.cream, 0, 0.52, 0);
          for (const s of [-1, 1]) {
            k.cone(0.05, 0.09, c.cream, s * 0.08, 0.62, 0, 5, { rz: -s * 0.35 });
            k.cone(0.025, 0.05, c.peach300, s * 0.08, 0.63, 0.02, 4, { rz: -s * 0.35 });
            k.ball(0.022, c.ink, s * 0.055, 0.54, 0.13, undefined, 0);
          }
          k.ball(0.02, c.peach300, 0, 0.5, 0.15, undefined, 0);
          k.torus(0.125, 0.02, c.clay, 0, 0.4, 0, { rx: Math.PI / 2 }, Math.PI * 2, 4, 14);
          k.ball(0.035, c.butter500, 0, 0.37, 0.13, undefined, 0);
          k.cyl(0.045, 0.05, 0.2, c.cream, 0.13, 0.32, 0.03, 6, { rz: -0.25 });
          k.ball(0.055, c.cream, 0.18, 0.53, 0.03);
          k.box(0.1, 0.13, 0.02, c.butter500, -0.07, 0.2, 0.17);
        },
        // Distributeurs de capsules (1 ou 2 étages) ; 3 étages = distributeur de boissons.
        stack: (k, v, n) => {
          if (n >= 3) {
            const body = pick(v, [c.cream, c.lake300]);
            k.box(0.78, 1.72, 0.6, body, 0, 0, 0);
            k.box(0.78, 0.14, 0.62, c.peach500, 0, 1.72, 0);
            k.glow(() => {
              k.box(0.64, 0.8, 0.02, c.lake100, 0, 0.82, 0.31);
              const drinks = [c.peach300, c.sage300, c.butter300, c.lilac300];
              for (let r = 0; r < 3; r++) {
                for (let i = 0; i < 4; i++) k.cyl(0.045, 0.045, 0.15, drinks[(r + i) % 4], -0.22 + i * 0.147, 0.88 + r * 0.25, 0.33, 6);
              }
            });
            for (let r = 0; r < 3; r++) k.box(0.6, 0.03, 0.03, c.butter500, 0, 0.84 + r * 0.25, 0.32);
            k.box(0.16, 0.26, 0.03, mix(c.inkSoft, body, 0.4), 0.24, 0.42, 0.31);
            k.box(0.5, 0.14, 0.03, mix(c.inkSoft, body, 0.3), -0.08, 0.16, 0.31);
            return;
          }
          for (let i = 0; i < n; i++) {
            k.at(0, i * H, 0, () => {
              const cab = pick(v + i, [c.peach500, c.lake500, c.lilac500, c.sage500]);
              k.box(0.76, 0.3, 0.44, cab, 0, 0, 0);
              k.box(0.2, 0.12, 0.02, c.cream, 0, 0.09, 0.225);
              k.cyl(0.05, 0.05, 0.03, iron, 0, 0.2, 0.22, 8, { rx: Math.PI / 2 });
              k.sphere(0.28, mix(c.lake100, c.cream, 0.3), 0, 0.3, 0, { sy: 0.85 }, 10, 5, 0.5);
              [c.peach300, c.butter300, c.sage300, c.lilac300].forEach((col, j) =>
                k.ball(0.05, col, -0.12 + j * 0.08, 0.36 + (j % 2) * 0.06, 0.2, undefined, 0),
              );
              k.cyl(0.08, 0.1, 0.06, cab, 0, 0.53, 0, 8);
            });
          }
        },
        // Banc de maison de thé : feutre rouge, thé et brochette de dango.
        bench: (k) => {
          for (const x of [-0.72, 0, 0.72]) k.box(0.08, 0.38, 0.4, wood, x, 0, 0);
          k.box(1.7, 0.06, 0.5, wood, 0, 0.38, 0);
          k.box(1.6, 0.03, 0.46, c.clay, 0, 0.44, 0);
          k.box(1.6, 0.13, 0.02, c.clay, 0, 0.33, 0.25);
          k.cyl(0.05, 0.04, 0.07, c.cream, 0.45, 0.47, 0, 8);
          k.at(-0.3, 0.47, 0, () => {
            k.cyl(0.008, 0.008, 0.24, woodDark, 0, 0, 0, 4, { rz: -0.5 });
            [c.peach200, c.cream, c.sage300].forEach((col, j) => k.ball(0.042, col, 0.04 + j * 0.035, 0.06 + j * 0.06, 0, undefined, 0));
          });
        },
        // Parapluie emporté par le vent.
        flyer: {
          body: (k, v) => {
            const canopy = pick(v, [c.lilac300, c.peach300, c.lake300]);
            k.cyl(0.012, 0.012, 0.32, iron, 0, 0.04, 0, 4);
            k.cone(0.31, 0.15, canopy, 0, 0.22, 0, 8);
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              k.ball(0.025, c.cream, Math.cos(a) * 0.3, 0.22, Math.sin(a) * 0.3, undefined, 0);
            }
            k.cyl(0.01, 0.01, 0.06, iron, 0, 0.37, 0, 4);
            k.torus(0.04, 0.012, iron, -0.04, 0.05, 0, { rz: Math.PI }, Math.PI, 3, 8);
          },
          pivot: [0, 0.21, 0],
          mirror: false,
          motion: "tumble",
        },
      };

    /* ------------------------------------------------------------------ Berlin */
    case "berlin":
      return {
        variants: 4,
        // Buddy Bär peint, bras levés.
        cone: (k, v) => {
          const fur = pick(v, [c.lake300, c.peach300, c.butter300, c.lilac300]);
          const paint = pick(v + 2, [c.peach500, c.lake500, c.sage500, c.butter500]);
          k.box(0.4, 0.06, 0.3, mix(c.sand, c.inkSoft, 0.15), 0, 0, 0);
          for (const s of [-1, 1]) k.cyl(0.07, 0.08, 0.14, fur, s * 0.08, 0.06, 0, 6);
          k.ball(0.16, fur, 0, 0.33, 0, { sy: 1.25 });
          k.ball(0.09, paint, 0, 0.3, 0.1, { sy: 1.2, sz: 0.5 });
          k.ball(0.04, c.cream, -0.08, 0.42, 0.12, undefined, 0);
          for (const s of [-1, 1]) {
            k.cyl(0.045, 0.05, 0.2, fur, s * 0.12, 0.38, 0, 6, { rz: -s * 0.55 });
            k.ball(0.05, paint, s * 0.22, 0.56, 0, undefined, 0);
            k.ball(0.04, fur, s * 0.08, 0.68, 0, undefined, 0);
          }
          k.ball(0.12, fur, 0, 0.58, 0);
          k.ball(0.05, c.cream, 0, 0.56, 0.1, undefined, 0);
          k.ball(0.02, c.ink, 0, 0.58, 0.15, undefined, 0);
        },
        // Pans du Mur peints (1, 2 ou 3 étages : un seul pan, de plus en plus haut).
        stack: (k, v, n) => {
          const concrete = mix(c.cream, c.sand, 0.55);
          const top = n * H;
          k.box(0.8, 0.1, 0.5, mix(concrete, c.inkSoft, 0.1), 0, 0, -0.05);
          k.box(0.74, top - 0.12, 0.2, concrete, 0, 0, 0);
          k.cyl(0.07, 0.07, 0.8, mix(concrete, c.cream, 0.4), 0.4, top - 0.07, 0, 8, { rz: Math.PI / 2 });
          const blobs = [c.peach300, c.lake300, c.butter300, c.lilac300, c.sage300, c.peach500];
          const count = 3 + n * 2;
          for (let i = 0; i < count; i++) {
            const bx = -0.24 + ((i * 0.37 + v * 0.13) % 0.48);
            const by = 0.18 + (i / count) * (top - 0.4);
            k.ball(0.11 + (i % 3) * 0.03, blobs[(i + v) % blobs.length], bx, by, 0.1, { sz: 0.18, sx: 1.3 }, 0);
          }
          k.ball(0.06, c.clay, 0.1, top * 0.55, 0.11, { sz: 0.2 }, 0);
        },
        // Deux vélos garés (paniers à l'avant).
        bench: (k, v) => {
          [-0.42, 0.42].forEach((dx, i) => {
            const frame = pick(v + i, [c.lake500, c.peach500, c.sage500, c.lilac500]);
            k.at(dx, 0, i ? 0.08 : -0.08, () => {
              for (const wx of [-0.24, 0.24]) {
                k.torus(0.18, 0.025, iron, wx, 0.19, 0, undefined, Math.PI * 2, 4, 14);
                k.ball(0.025, c.cream, wx, 0.19, 0, undefined, 0);
              }
              k.box(0.44, 0.03, 0.03, frame, 0, 0.4, 0);
              k.box(0.03, 0.3, 0.03, frame, -0.08, 0.17, 0, { rz: -0.25 });
              k.box(0.03, 0.34, 0.03, frame, 0.13, 0.15, 0, { rz: 0.55 });
              k.box(0.3, 0.03, 0.03, frame, -0.12, 0.19, 0);
              k.box(0.13, 0.04, 0.07, c.ink, -0.14, 0.47, 0);
              k.box(0.03, 0.17, 0.03, iron, 0.22, 0.4, 0);
              k.box(0.03, 0.03, 0.16, iron, 0.22, 0.57, 0);
              k.box(0.15, 0.1, 0.15, c.butter500, 0.32, 0.42, 0);
            });
          });
        },
        // Corneille mantelée.
        flyer: {
          body: (k) => {
            const grey = mix(c.sand, c.inkSoft, 0.3);
            const dark = mix(c.ink, c.lilac800, 0.3);
            k.ball(0.19, grey, 0.04, 0.2, 0, { sx: 1.35, sy: 0.85, sz: 0.8 });
            k.ball(0.11, dark, -0.21, 0.3, 0);
            k.cone(0.035, 0.12, dark, -0.33, 0.29, 0, 6, { rz: Math.PI / 2 });
            for (const z of [-0.06, 0.06]) k.ball(0.02, c.cream, -0.26, 0.33, z, undefined, 0);
            k.box(0.16, 0.04, 0.14, dark, 0.29, 0.2, 0, { rz: 0.2 });
          },
          wing: (k) => k.ball(0.21, mix(c.ink, c.lilac800, 0.3), 0.03, 0, 0.13, { sx: 1.05, sy: 0.18, sz: 0.78 }),
          pivot: [0.04, 0.26, 0.06],
          mirror: true,
          motion: "flap",
        },
      };

    /* ------------------------------------------------------------------ Busan */
    case "busan":
      return {
        variants: 3,
        // Petit phare rouge et blanc du port.
        cone: (k) => {
          k.cyl(0.22, 0.24, 0.06, c.cream, 0, 0, 0, 10);
          k.cyl(0.13, 0.18, 0.44, c.clay, 0, 0.06, 0, 10);
          for (const y of [0.18, 0.36]) k.cyl(0.15, 0.162, 0.07, c.cream, 0, y, 0, 10);
          k.cyl(0.17, 0.17, 0.03, iron, 0, 0.5, 0, 10);
          k.glow(() => k.cyl(0.1, 0.1, 0.1, c.butter200, 0, 0.53, 0, 8));
          k.cone(0.13, 0.09, c.clay, 0, 0.63, 0, 8);
        },
        // Caisses de poissons (marché de Jagalchi).
        stack: stacked((k, v) => {
          const crate = pick(v, [c.lake500, mix(c.lake500, c.sage500, 0.4)]);
          k.box(0.76, 0.4, 0.5, crate, 0, 0, 0);
          k.box(0.78, 0.05, 0.52, mix(crate, c.cream, 0.3), 0, 0.37, 0);
          for (const x of [-0.22, 0.22]) k.box(0.16, 0.06, 0.02, mix(crate, c.ink, 0.35), x, 0.27, 0.255);
          k.box(0.64, 0.05, 0.4, c.cream, 0, 0.4, 0);
          [-0.2, 0.02, 0.22].forEach((x, j) => {
            const fish = j % 2 ? c.lilac300 : mix(c.sand, c.lake300, 0.4);
            k.ball(0.07, fish, x, 0.49, (j - 1) * 0.08, { sx: 2, sy: 0.7 });
            k.cone(0.05, 0.07, fish, x + 0.17, 0.49, (j - 1) * 0.08, 4, { rz: Math.PI / 2 });
          });
        }),
        // Petite barque de pêche sur cales.
        bench: (k) => {
          for (const x of [-0.45, 0.45]) k.box(0.2, 0.12, 0.3, woodDark, x, 0, 0);
          k.sphere(1, c.lake500, 0, 0.42, 0, { rx: Math.PI, sx: 0.84, sy: 0.3, sz: 0.27 }, 14, 5, 0.5);
          k.cyl(1, 1, 0.05, c.peach500, 0, 0.33, 0, 14, { sx: 0.83, sz: 0.25 });
          k.cyl(1, 1, 0.04, c.cream, 0, 0.41, 0, 14, { sx: 0.85, sz: 0.28 });
          k.box(0.3, 0.16, 0.28, c.cream, 0.28, 0.44, 0);
          k.box(0.34, 0.03, 0.32, c.peach500, 0.28, 0.6, 0);
        },
        // Drone du spectacle lumineux de Gwangalli.
        flyer: {
          body: (k) => {
            for (const x of [-0.08, 0.08]) k.box(0.02, 0.12, 0.02, iron, x, 0.03, 0);
            k.box(0.26, 0.1, 0.26, c.cream, 0, 0.14, 0);
            k.sphere(0.09, c.lake300, 0, 0.24, 0, undefined, 8, 4, 0.5);
            for (const a of [Math.PI / 4, -Math.PI / 4]) k.box(0.52, 0.025, 0.035, iron, 0, 0.22, 0, { ry: a });
            for (const x of [-0.19, 0.19]) for (const z of [-0.19, 0.19]) k.cyl(0.1, 0.1, 0.015, mix(c.lilac200, c.cream, 0.4), x, 0.25, z, 10);
            k.glow(() => k.ball(0.03, c.butter300, 0, 0.13, 0.14, undefined, 0));
          },
          pivot: [0, 0.18, 0],
          mirror: false,
          motion: "hover",
        },
      };

    /* ------------------------------------------------------------------ Genève (et repli) */
    default:
      return {
        variants: 3,
        // Pot de géraniums des quais.
        cone: (k, v) => {
          const pot = mix(c.peach500, c.clay, 0.35);
          k.cyl(0.2, 0.15, 0.34, pot, 0, 0, 0, 9);
          k.cyl(0.235, 0.235, 0.07, mix(pot, c.clayEdge, 0.3), 0, 0.3, 0, 9);
          k.ball(0.17, c.sage500, -0.07, 0.48, 0.02);
          k.ball(0.15, c.sage500, 0.09, 0.47, -0.04);
          k.ball(0.13, c.sage300, 0.01, 0.55, 0.07);
          const flower = pick(v, [c.clay, c.peach300, c.lilac500]);
          for (const [x, y, z] of [[-0.12, 0.62, 0.05], [0.08, 0.66, -0.02], [0, 0.65, 0.12], [0.13, 0.58, 0.1], [-0.05, 0.66, -0.1]]) {
            k.ball(0.055, flower, x, y, z, undefined, 0);
          }
        },
        // Meules de fromage, étiquette à croix suisse.
        stack: stacked((k, _v, i) => {
          const r = i % 2 ? 0.36 : 0.38;
          k.cyl(r, r, 0.56, c.butter300, 0, 0, 0, 12);
          for (const y of [0, 0.51]) k.cyl(r + 0.01, r + 0.01, 0.05, c.butter500, 0, y, 0, 12);
          for (const [x, y] of [[-0.16, 0.24], [0.1, 0.36], [0.2, 0.16]]) {
            k.cyl(0.045, 0.045, 0.03, mix(c.butter500, c.butter300, 0.3), x, y, r - 0.02, 8, { rx: Math.PI / 2 });
          }
          k.at(-0.02, 0.2, r, () => {
            k.box(0.15, 0.15, 0.02, c.clay, 0, 0, 0);
            swissCross(k, 0.075 + 0.045, 0.12, c.cream);
          });
        }),
        // Banc vert du bord du lac.
        bench: (k) => {
          const green = c.sage500;
          for (const x of [-0.7, 0.7]) {
            k.box(0.08, 0.38, 0.42, iron, x, 0, 0);
            k.box(0.06, 0.26, 0.05, iron, x, 0.36, -0.2);
          }
          for (const z of [-0.13, 0, 0.13]) k.box(1.7, 0.05, 0.11, green, 0, 0.38, z);
          for (const y of [0.47, 0.56]) k.box(1.7, 0.06, 0.04, green, 0, y, -0.2);
        },
        flyer: pigeon,
      };
  }
}

/* ---------------------------------------------------------------------- Tampon à collectionner */

const STAMP_W = 0.46;
const STAMP_H = 0.56;

/** Timbre-poste dentelé (contour de la feuille), centré. */
function perforated(w: number, h: number, holes: [number, number], r: number): Shape {
  const shape = new Shape();
  const [nx, ny] = holes;
  const x0 = -w / 2;
  const y0 = -h / 2;
  shape.moveTo(x0, y0);
  // Bas (gauche -> droite), droite (bas -> haut), haut, gauche : demi-cercles creusés.
  const edge = (ax: number, ay: number, bx: number, by: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const cx = ax + (bx - ax) * t;
      const cy = ay + (by - ay) * t;
      const angle = Math.atan2(by - ay, bx - ax);
      shape.lineTo(cx - Math.cos(angle) * r, cy - Math.sin(angle) * r);
      shape.absarc(cx, cy, r, angle + Math.PI, angle, true);
    }
    shape.lineTo(bx, by);
  };
  edge(x0, y0, -x0, y0, nx);
  edge(-x0, y0, -x0, -y0, ny);
  edge(-x0, -y0, x0, -y0, nx);
  edge(x0, -y0, x0, y0, ny);
  return shape;
}

function heart(s: number): Shape {
  const shape = new Shape();
  shape.moveTo(0, -0.5 * s);
  shape.bezierCurveTo(-0.15 * s, -0.33 * s, -0.55 * s, -0.1 * s, -0.5 * s, 0.18 * s);
  shape.bezierCurveTo(-0.45 * s, 0.45 * s, -0.1 * s, 0.5 * s, 0, 0.25 * s);
  shape.bezierCurveTo(0.1 * s, 0.5 * s, 0.45 * s, 0.45 * s, 0.5 * s, 0.18 * s);
  shape.bezierCurveTo(0.55 * s, -0.1 * s, 0.15 * s, -0.33 * s, 0, -0.5 * s);
  return shape;
}

/** Tampon du passeport de Rominou : timbre crème dentelé, vignette au ton de l'étape, cœur. */
export function stampPiece(k: Kit, c: Palette) {
  k.shape("stamp-paper", () => perforated(STAMP_W, STAMP_H, [4, 5], 0.03), 0.04, c.cream, 0, 0, 0, undefined, 0.012);
  k.shape(
    "stamp-panel",
    () => {
      const s = new Shape();
      const w = STAMP_W - 0.12;
      const h = STAMP_H - 0.12;
      s.moveTo(-w / 2, -h / 2);
      s.lineTo(w / 2, -h / 2);
      s.lineTo(w / 2, h / 2);
      s.lineTo(-w / 2, h / 2);
      s.closePath();
      return s;
    },
    0.03,
    mix(c.tone300, c.tone200, 0.3),
    0,
    0,
    0.025,
  );
  k.shape("stamp-heart", () => heart(0.2), 0.04, c.clay, 0, 0.01, 0.045, undefined, 0.008);
  // Petit cachet (arc) en haut à droite.
  k.torus(0.07, 0.01, c.tone800, 0.1, 0.15, 0.06, undefined, Math.PI * 1.3, 3, 10);
}
