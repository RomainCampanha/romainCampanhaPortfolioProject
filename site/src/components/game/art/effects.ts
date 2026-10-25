import {
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  OctahedronGeometry,
} from "three";
import { createRng } from "@/lib/game/rng";
import type { Level } from "@/lib/game/types";
import type { FrameSource } from "../frame";
import { mix, type Palette } from "../palette";
import { CLAY_RESPONSE } from "../world3d";

// Effets du jeu en trois InstancedMesh (3 appels de dessin en tout) : petits nuages de
// poussière (saut, atterrissage, double saut, course, choc, plouf), étincelles des tampons
// ramassés, confettis à la porte. Chaque particule est une FONCTION du temps écoulé depuis
// son événement (instants notés par la partie dans frame.fx) : pas de pool à gérer, rien à
// simuler, rendu identique en pause. Coupés en mouvement réduit (sauf l'essentiel : aucun).

const PUFFS = 30;
const SPARKS = 24;
const CONFETTI = 72;

const tmp = new Object3D();
const hidden = new Matrix4().makeScale(0, 0, 0);

export type Effects3D = {
  group: Group;
  update: (frame: FrameSource, t: number) => void;
  dispose: () => void;
};

export function createEffects3D(level: Level, c: Palette): Effects3D {
  const group = new Group();
  const rng = createRng(level.seed ^ 0xc0f3);

  const puffGeo = new IcosahedronGeometry(1, 0);
  const puffMat = new MeshLambertMaterial({ color: CLAY_RESPONSE, toneMapped: false });
  const puffs = new InstancedMesh(puffGeo, puffMat, PUFFS);
  const dust = new Color(mix(c.cream, c.sand, 0.35));
  const dustLight = new Color(c.cream);
  const water = [new Color(c.lake300), new Color(c.lake100), new Color(c.cream)];
  for (let i = 0; i < PUFFS; i++) puffs.setColorAt(i, i >= 22 ? water[i % 3] : i % 2 ? dust : dustLight);

  const sparkGeo = new OctahedronGeometry(1, 0);
  const sparkMat = new MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
  const sparks = new InstancedMesh(sparkGeo, sparkMat, SPARKS);
  const sparkColors = [c.butter300, c.cream, c.tone300, c.butter200].map((hex) => new Color(hex));
  for (let i = 0; i < SPARKS; i++) sparks.setColorAt(i, sparkColors[i % sparkColors.length]);

  const confettiGeo = new BoxGeometry(0.2, 0.1, 0.012);
  const confettiMat = new MeshLambertMaterial({ color: CLAY_RESPONSE, toneMapped: false });
  const confetti = new InstancedMesh(confettiGeo, confettiMat, CONFETTI);
  const confettiColors = [c.peach300, c.lake300, c.butter300, c.lilac300, c.sage300, c.clay, c.cream].map((hex) => new Color(hex));
  const pieces = Array.from({ length: CONFETTI }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    confetti.setColorAt(i, confettiColors[i % confettiColors.length]);
    // Deux canons à confettis au milieu des piliers de la porte, vers Rominou (à droite).
    return {
      x: level.gateX + side * 1.55,
      vx: rng.range(-1.2, 3.6) + (side > 0 ? 0.8 : 0),
      vy: rng.range(2, 4.2),
      vz: rng.range(-0.4, 2.4),
      spin: [rng.range(4, 11), rng.range(-9, 9)],
      delay: rng.range(0, 0.3),
      scale: rng.range(0.8, 1.25),
    };
  });

  for (const mesh of [puffs, sparks, confetti]) {
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    for (let i = 0; i < mesh.count; i++) mesh.setMatrixAt(i, hidden);
    group.add(mesh);
  }

  /** Pose une particule (rayon r ; r <= 0 : cachée). */
  const put = (mesh: InstancedMesh, i: number, x: number, y: number, z: number, r: number, rx = 0, rz = 0) => {
    if (r <= 0.002) {
      mesh.setMatrixAt(i, hidden);
      return;
    }
    tmp.position.set(x, y, z);
    tmp.rotation.set(rx, 0, rz);
    tmp.scale.setScalar(r);
    tmp.updateMatrix();
    mesh.setMatrixAt(i, tmp.matrix);
  };
  const xAt = (t: number) => level.startX + level.speed * t;
  /** Rayon d'une bouffée : gonfle vite puis s'efface (0 hors de [0, life]). */
  const swell = (age: number, life: number, r: number) =>
    age < 0 || age > life ? 0 : r * Math.min(1, age / 0.06) * (1 - age / life) ** 0.7;

  const update = (frame: FrameSource, t: number) => {
    const { fx, run, reducedMotion } = frame;
    if (reducedMotion) {
      for (const mesh of [puffs, sparks, confetti]) {
        for (let i = 0; i < mesh.count; i++) mesh.setMatrixAt(i, hidden);
        mesh.instanceMatrix.needsUpdate = true;
      }
      return;
    }
    let slot = 0;
    // Décollage : trois bouffées derrière les pieds.
    {
      const age = t - fx.jumpAt;
      const x0 = xAt(fx.jumpAt);
      for (let i = 0; i < 3; i++) {
        put(puffs, slot++, x0 - 0.2 - age * (0.6 + i * 0.35), 0.07 + age * 0.35, (i - 1) * 0.2, fx.jumpAt < 0 ? 0 : swell(age, 0.4, 0.17 + i * 0.04));
      }
    }
    // Atterrissage : bouffées des deux côtés.
    {
      const age = t - fx.landAt;
      const x0 = fx.landX;
      for (let i = 0; i < 6; i++) {
        const dir = i < 3 ? -1 : 1;
        const j = i % 3;
        const r = fx.landAt < 0 ? 0 : swell(age, 0.45, 0.18 + j * 0.04) * fx.landPower;
        put(puffs, slot++, x0 + dir * (0.22 + age * (1.1 + j * 0.45)), 0.06 + age * 0.3, (j - 1) * 0.24, r);
      }
    }
    // Double saut : anneau de petites bouffées sous les pieds.
    {
      const age = t - fx.doubleAt;
      const x0 = xAt(fx.doubleAt);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const spread = 0.12 + age * 1.6;
        put(puffs, slot++, x0 + Math.cos(a) * spread, fx.doubleY - 0.05 - age * 0.5, Math.sin(a) * spread * 0.8, fx.doubleAt < 0 ? 0 : swell(age, 0.34, 0.1));
      }
    }
    // Course : une petite bouffée à chaque foulée.
    const running = frame.phase === "playing" && run.status === "running" && run.grounded;
    for (let n = 0; n < 2; n++) {
      const step = 0.3;
      const tk = Math.floor(t / step) * step - n * step;
      const age = t - tk;
      put(puffs, slot++, xAt(tk) - 0.25, 0.05 + age * 0.2, n ? 0.12 : -0.1, running && tk > 0.2 ? swell(age, 0.5, 0.075) : 0);
    }
    // Choc contre un obstacle : petit nuage à l'impact.
    {
      const age = t - fx.hitAt;
      const show = fx.hitAt >= 0 && fx.hitKind === "hit";
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        put(puffs, slot++, fx.hitX + 0.25 + Math.cos(a) * age * 1.4, 0.5 + Math.sin(a) * age * 1.2, 0.3, show ? swell(age, 0.4, 0.14) : 0);
      }
    }
    // Plouf : gouttes d'eau.
    {
      const age = t - fx.hitAt;
      const show = fx.hitAt >= 0 && fx.hitKind === "splash";
      for (let i = slot; i < PUFFS; i++) {
        const k = i - slot;
        const a = 0.35 + (k / (PUFFS - slot - 1)) * (Math.PI - 0.7);
        const v = 3.2 + (k % 3) * 0.8;
        const y = -0.3 + Math.sin(a) * v * age - 9 * age * age;
        put(puffs, i, fx.hitX + Math.cos(a) * v * 0.45 * age, y, (k % 2 ? 0.25 : -0.2), show && y > -0.6 ? swell(age, 0.7, 0.085) : 0);
      }
    }
    puffs.instanceMatrix.needsUpdate = true;

    // Étincelles des tampons ramassés (les plus récents).
    let spark = 0;
    for (let i = 0; i < fx.collectedAt.length && spark < SPARKS; i++) {
      const at = fx.collectedAt[i];
      if (at < 0) continue;
      const age = t - at;
      if (age < 0 || age > 0.45) continue;
      const s = level.stamps[i];
      for (let j = 0; j < 6 && spark < SPARKS; j++) {
        const a = (j / 6) * Math.PI * 2 + i;
        const d = 0.15 + age * 2.1;
        put(sparks, spark++, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d + age * 0.6, 0.15, 0.07 * (1 - age / 0.45), 0, a);
      }
    }
    for (let i = spark; i < SPARKS; i++) sparks.setMatrixAt(i, hidden);
    sparks.instanceMatrix.needsUpdate = true;

    // Confettis à la porte d'embarquement.
    const sinceFinish = fx.finishAt < 0 ? -1 : t - fx.finishAt - 0.12;
    pieces.forEach((p, i) => {
      const age = sinceFinish - p.delay;
      if (sinceFinish < 0 || age < 0 || age > 4) {
        confetti.setMatrixAt(i, hidden);
        return;
      }
      const drag = (1 - Math.exp(-1.6 * age)) / 1.6;
      // Confettis légers : ils montent, puis redescendent en virevoltant (~3 s).
      const y = 2.4 + p.vy * drag - 0.72 * age * age;
      if (y < 0.02) {
        confetti.setMatrixAt(i, hidden);
        return;
      }
      put(confetti, i, p.x + p.vx * drag + Math.sin(age * 4 + i) * 0.14, y, -1.1 + p.vz * drag, p.scale, age * p.spin[0], age * p.spin[1]);
    });
    confetti.instanceMatrix.needsUpdate = true;
  };

  return {
    group,
    update,
    dispose: () => {
      for (const item of [puffGeo, puffMat, sparkGeo, sparkMat, confettiGeo, confettiMat, puffs, sparks, confetti]) item.dispose();
    },
  };
}
