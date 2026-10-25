import {
  type BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  type Texture,
} from "three";
import { createRng } from "@/lib/game/rng";
import { obstacleX } from "@/lib/game/sim";
import type { Level, Obstacle } from "@/lib/game/types";
import { sceneFor } from "./art/cities";
import { createEffects3D } from "./art/effects";
import { Batch, Kit } from "./art/kit";
import { skinsFor, stampPiece, type Skins } from "./art/skins";
import { FOV_TAN, TILT } from "./camera";
import { interpolated, type FrameSource } from "./frame";
import { mix, type Palette } from "./palette";
import type { Theme } from "./themes";

// Monde 3D d'une étape : décor low-poly de la ville (art/cities.ts), chemin et trous d'eau,
// obstacles habillés (art/skins.ts), tampons, porte d'embarquement et effets. Presque tout est
// fusionné en quelques géométries à couleurs par sommet (art/kit.ts) partageant DEUX matériaux
// (argile mate éclairée + « lumineux » non éclairé) : peu d'appels de dessin (~15-25 par image).
// Construit une fois par étape ; tout est libéré au démontage (changement d'étape).

export type WorldView = {
  /** Centre visé par la caméra (x) et sa distance au chemin. */
  camX: number;
  distance: number;
  aspect: number;
};

export type World = {
  root: Group;
  update: (frame: FrameSource, view: WorldView) => void;
  dispose: () => void;
  /** Taille du monde (mesures de perf, tests). */
  stats: { meshes: number; vertices: number };
};

const tmp = new Object3D();
const hidden = new Matrix4().makeScale(0, 0, 0);

/**
 * Réponse des matériaux du décor à la lumière de la scène (celle de Rominou, réglée pour son
 * GLB) : une face bien éclairée rend à peu près la couleur du token, les autres s'assombrissent
 * (facettes). Pas de tone mapping sur le décor : les pastels du design system restent fidèles.
 */
export const CLAY_RESPONSE = new Color(1.5, 1.5, 1.5);
/** Échelle de la couche lointaine : les monuments s'arrêtent sous le HUD. */
const FAR_SCALE = 0.68;

export function buildWorld(level: Level, c: Palette, theme: Theme, fontFamily: string): World {
  const root = new Group();
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };
  const stats = { meshes: 0, vertices: 0 };
  // Argile mate (normales par face = facettes) et matériau lumineux (néons, fenêtres le soir).
  const clay = keep(new MeshLambertMaterial({ vertexColors: true, color: CLAY_RESPONSE, toneMapped: false }));
  const glow = keep(new MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  const add = (geometry: BufferGeometry | null, material: Material, parent: Object3D = root) => {
    if (!geometry) return null;
    keep(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    parent.add(mesh);
    stats.meshes++;
    stats.vertices += geometry.getAttribute("position").count;
    return mesh;
  };
  const addBatch = (batch: Batch, parent: Object3D = root) => {
    const built = batch.build();
    built.lit.forEach((g) => add(g, clay, parent));
    built.glow.forEach((g) => add(g, glow, parent));
  };

  const rng = createRng(level.seed ^ 0x5eed);
  const scene = sceneFor(level.id);
  const from = level.startX - 34;
  const to = level.gateX + 64;
  const water = mix(c.lake300, theme.night ? c.lilac200 : c.lake200, 0.3);

  // ---------------------------------------------------------------- Sol, chemin, trous d'eau
  const ground = new Batch(40);
  buildGround(level, theme, c, scene.waterFrom, water, ground, from, to);
  addBatch(ground);
  const horizon = new Kit();
  horizon.box(to - from + 900, 0.3, 420, scene.waterFrom === null ? theme.ground.back : water, (from + to) / 2, -0.66, -272);
  add(horizon.build().lit, clay);

  // ---------------------------------------------------------------- Décor de la ville
  const front = new Batch(40);
  const near = new Batch(40);
  const back = new Batch(60);
  const far = new Kit();
  const clouds = new Kit();
  scene.build({ c, theme, level, rng, from, to, front, near, back, far, clouds });
  if (scene.waterFrom !== null) waterGlints(back, from, to, scene.waterFrom, mix(water, c.cream, 0.55), rng);
  addBatch(front);
  addBatch(near);
  addBatch(back);
  const farGroup = new Group();
  farGroup.position.z = scene.farZ;
  farGroup.scale.setScalar(FAR_SCALE);
  // Lointain : un voile de la couleur de l'horizon adoucit les ombres (perspective aérienne).
  const haze = keep(
    new MeshLambertMaterial({ vertexColors: true, color: CLAY_RESPONSE, emissive: theme.sky.horizon, emissiveIntensity: 0.12, toneMapped: false }),
  );
  const farBuilt = far.build();
  add(farBuilt.lit, haze, farGroup);
  add(farBuilt.glow, glow, farGroup);
  const cloudGroup = new Group();
  const cloudMat = keep(new MeshLambertMaterial({ vertexColors: true, color: CLAY_RESPONSE, emissive: c.cream, emissiveIntensity: 0.4, toneMapped: false }));
  add(clouds.build().lit, cloudMat, cloudGroup);
  farGroup.add(cloudGroup);
  root.add(farGroup);
  // Les meshes du décor sont statiques ; seuls les groupes mobiles recalculent leur matrice.
  farGroup.traverse((o) => {
    if (o !== farGroup && o !== cloudGroup) o.matrixAutoUpdate = false;
  });

  // ---------------------------------------------------------------- Porte d'embarquement
  buildGate(level.gateX, c, fontFamily, root, add, keep, clay);

  // ---------------------------------------------------------------- Obstacles
  const skins = skinsFor(level.id, c);
  const cache = new Map<string, { lit: BufferGeometry | null; glow: BufferGeometry | null }>();
  const shape = (key: string, draw: (k: Kit) => void) => {
    let built = cache.get(key);
    if (!built) {
      const k = new Kit();
      draw(k);
      built = k.build();
      if (built.lit) keep(built.lit);
      if (built.glow) keep(built.glow);
      cache.set(key, built);
    }
    return built;
  };
  type Visual = { group: Group; wings: Object3D[]; body: Object3D; shadow: Mesh | null };
  // Ombre de contact sous chaque obstacle posé : il se détache du décor (lisibilité).
  const shadowGeo = keep(new CircleGeometry(0.5, 20).rotateX(-Math.PI / 2));
  const shadowMat = keep(new MeshBasicMaterial({ color: c.ink, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false }));
  const visuals: Visual[] = level.obstacles.map((o, i) => {
    const v = buildObstacle(o, i, skins, shape, clay, glow);
    let shadow: Mesh | null = null;
    if (o.y === 0) {
      shadow = new Mesh(shadowGeo, shadowMat);
      shadow.scale.set(o.w * 1.25 + 0.2, 1, 0.9);
      shadow.position.set(o.x + o.w / 2, 0.012, 0.05);
      shadow.renderOrder = 1;
      root.add(shadow);
    }
    root.add(v.group);
    return { ...v, shadow };
  });

  // ---------------------------------------------------------------- Tampons (instanciés)
  const stampKit = new Kit();
  stampPiece(stampKit, c);
  const stampGeo = keep(stampKit.build().lit!);
  const stampMat = keep(
    new MeshLambertMaterial({ vertexColors: true, color: CLAY_RESPONSE, emissive: c.cream, emissiveIntensity: 0.1, toneMapped: false }),
  );
  const stamps = new InstancedMesh(stampGeo, stampMat, Math.max(1, level.stamps.length));
  stamps.instanceMatrix.setUsage(DynamicDrawUsage);
  stamps.frustumCulled = false;
  for (let i = 0; i < stamps.count; i++) stamps.setMatrixAt(i, hidden);
  root.add(stamps);
  keep(stamps);

  // ---------------------------------------------------------------- Effets
  const effects = createEffects3D(level, c);
  root.add(effects.group);
  keep(effects);

  const farSpan = level.gateX - level.startX;

  const update = (frame: FrameSource, view: WorldView) => {
    const { t, x: px } = interpolated(frame);
    const { fx, reducedMotion } = frame;
    const calm = reducedMotion;

    // Couche lointaine : suit la caméra et glisse lentement (le monument reste en vue).
    const progress = Math.min(1.05, Math.max(0, (px - level.startX) / farSpan));
    const halfW = ((view.distance * Math.cos(TILT) - scene.farZ) * FOV_TAN * view.aspect) / FAR_SCALE;
    const track = scene.farTrack;
    const unit = track.unit === "half" ? halfW : 1;
    farGroup.position.x = view.camX - (track.start + (track.end - track.start) * progress) * unit * FAR_SCALE;
    cloudGroup.position.x = calm ? 0 : -t * 0.35;

    // Obstacles : vol, battements d'ailes, chute quand Rominou les percute.
    level.obstacles.forEach((o, i) => {
      const v = visuals[i];
      const knocked = fx.knockedAt[i];
      const ox = obstacleX(o, t);
      const near = Math.abs(ox - px) <= 40;
      v.group.visible = near;
      if (v.shadow) v.shadow.visible = near && knocked < 0;
      if (!near) return;
      v.group.position.set(ox + o.w / 2, o.y, 0);
      // Nouvelle tentative : les obstacles renversés se relèvent.
      v.group.rotation.z = 0;
      v.group.scale.setScalar(1);
      if (o.kind === "pigeon") {
        animateFlyer(v, skins.flyer.motion, t + i * 0.37, calm);
        if (knocked >= 0) {
          const k = t - knocked;
          v.group.position.x += 2.5 * k;
          v.group.position.y = o.y + 4 * k;
          v.group.rotation.z = -k * 3;
          v.group.scale.setScalar(Math.max(0.001, 1 - k * 0.8));
        }
      } else if (knocked >= 0) {
        // Basculé vers l'arrière, avec un petit rebond.
        const k = Math.min(1, (t - knocked) * 2.6);
        const bounce = Math.sin(Math.min(1, (t - knocked) * 3.2) * Math.PI) * 0.18;
        v.group.rotation.z = -1.35 * k;
        v.group.position.x += 0.75 * k;
        v.group.position.y += bounce;
      }
    });

    // Tampons : léger balancement ; ramassés : « pop » (gonflent d'un coup, s'envolent, fondent).
    level.stamps.forEach((s, i) => {
      const at = fx.collectedAt[i];
      const age = at >= 0 ? t - at : -1;
      if (Math.abs(s.x - px) > 36 || age > 0.32) {
        stamps.setMatrixAt(i, hidden);
        return;
      }
      if (age >= 0) {
        const k = age / 0.32;
        tmp.position.set(s.x, s.y + Math.sqrt(k) * 0.9, 0.2);
        tmp.rotation.set(0, 0, (calm ? 0 : 0.5) * k);
        tmp.scale.setScalar(Math.max(0.001, k < 0.2 ? 1 + k * 3 : 1.6 * (1 - (k - 0.2) / 0.8) ** 1.5));
      } else {
        tmp.position.set(s.x, s.y + (calm ? 0 : Math.sin(t * 3 + i) * 0.06), 0);
        tmp.rotation.set(0, calm ? 0 : Math.sin(t * 2.2 + i * 0.7) * 0.5, calm ? 0 : Math.sin(t * 1.7 + i) * 0.08);
        tmp.scale.setScalar(1);
      }
      tmp.updateMatrix();
      stamps.setMatrixAt(i, tmp.matrix);
    });
    stamps.instanceMatrix.needsUpdate = true;

    effects.update(frame, t);
  };

  return {
    root,
    update,
    stats,
    dispose: () => {
      for (const item of disposables) item.dispose();
      cache.clear();
    },
  };
}

type AddMesh = (geometry: BufferGeometry | null, material: Material, parent?: Object3D) => Mesh | null;
type Keep = <T extends { dispose: () => void }>(item: T) => T;
type ShapeCache = (key: string, draw: (k: Kit) => void) => { lit: BufferGeometry | null; glow: BufferGeometry | null };

function buildGround(level: Level, theme: Theme, c: Palette, waterFrom: number | null, water: string, ground: Batch, from: number, to: number) {
  const g = theme.ground;
  const solids: [number, number][] = [];
  let cursor = from;
  for (const gap of [...level.gaps].sort((a, b) => a.x - b.x)) {
    solids.push([cursor, gap.x]);
    cursor = gap.x + gap.w;
  }
  solids.push([cursor, to]);
  const seam = mix(g.path, g.socle, 0.55);
  for (const [a, b] of solids) {
    const k = ground.at(a);
    const len = b - a;
    const mid = (a + b) / 2;
    k.box(len, 0.74, 3.4, g.socle, mid, -0.8, 0);
    k.box(len, 0.06, 2.4, g.path, mid, -0.06, -0.1);
    k.box(len, 0.32, 0.34, c.tone300, mid, -0.26, 1.86);
    k.box(len, 0.6, 7, g.front, mid, -0.75, 5.5);
    // Joints du dallage (ou des planches) : de fines lignes en travers du chemin.
    for (let x = Math.ceil(a / 1.6) * 1.6 + 0.4; x < b - 0.2; x += 1.6) k.flat(0.05, 2.36, seam, x, 0.004, -0.1);
  }
  for (const gap of level.gaps) {
    const k = ground.at(gap.x);
    k.box(gap.w + 0.02, 0.2, 10.8, water, gap.x + gap.w / 2, -0.6, 3.6);
    k.box(gap.w + 0.02, 0.5, 10.8, mix(water, c.lake500, 0.6), gap.x + gap.w / 2, -1.1, 3.6);
  }
  // Derrière le chemin : terre jusqu'à l'horizon, ou rive puis eau (lac, fleuve, mer).
  for (let x = from; x < to; x += 40) {
    const k = ground.at(x);
    const len = Math.min(40, to - x);
    if (waterFrom === null) {
      k.box(len, 0.4, 60.3, g.back, x + len / 2, -0.48, -31.85);
    } else {
      const shore = -1.7 - waterFrom;
      if (shore > 0.05) k.box(len, 0.4, shore, g.back, x + len / 2, -0.48, (-1.7 + waterFrom) / 2);
      k.box(len, 0.3, 62 + waterFrom, water, x + len / 2, -0.66, (waterFrom - 62) / 2);
    }
  }
}

/** Reflets clairs sur l'eau (fins traits), près de la rive. */
function waterGlints(back: Batch, from: number, to: number, waterFrom: number, color: string, rng: ReturnType<typeof createRng>) {
  for (let x = from; x < to; x += rng.range(1.5, 4)) {
    back.at(x).flat(rng.range(0.6, 1.8), 0.07, color, x, -0.35, rng.range(waterFrom - 14, waterFrom - 1));
  }
}

function buildObstacle(o: Obstacle, index: number, skins: Skins, shape: ShapeCache, clay: Material, glow: Material) {
  const group = new Group();
  const variant = index % skins.variants;
  const meshes = (built: { lit: BufferGeometry | null; glow: BufferGeometry | null }, parent: Object3D) => {
    if (built.lit) parent.add(new Mesh(built.lit, clay));
    if (built.glow) parent.add(new Mesh(built.glow, glow));
  };
  const body = new Group();
  group.add(body);
  const wings: Object3D[] = [];
  switch (o.kind) {
    case "cone":
      meshes(shape(`cone:${variant}`, (k) => skins.cone(k, variant)), body);
      break;
    case "suitcase":
      meshes(shape(`stack:${o.stack}:${variant}`, (k) => skins.stack(k, variant, o.stack)), body);
      break;
    case "bench":
      meshes(shape(`bench:${variant}`, (k) => skins.bench(k, variant)), body);
      break;
    case "pigeon": {
      const flyer = skins.flyer;
      meshes(shape(`fly:${variant}`, (k) => flyer.body(k, variant)), body);
      if (flyer.wing) {
        const [px, py, pz] = flyer.pivot;
        const right = new Group();
        right.position.set(px, py, pz);
        meshes(shape("wing:r", (k) => flyer.wing!(k)), right);
        body.add(right);
        wings.push(right);
        if (flyer.mirror) {
          const left = new Group();
          left.position.set(px, py, -pz);
          meshes(shape("wing:l", (k) => k.at(0, 0, 0, () => flyer.wing!(k), { sz: -1 })), left);
          body.add(left);
          wings.push(left);
        }
      }
      break;
    }
  }
  return { group, body, wings };
}

/** Battements d'ailes, balancement (cerf-volant), culbute (parapluie), vol stationnaire (drone). */
function animateFlyer(v: { body: Object3D; wings: Object3D[] }, motion: Skins["flyer"]["motion"], t: number, calm: boolean) {
  const s = calm ? 0.25 : 1;
  switch (motion) {
    case "flap": {
      const flap = Math.sin(t * 18) * 0.75 * s + 0.15;
      v.wings.forEach((w, i) => (w.rotation.x = i === 0 ? -flap : flap));
      v.body.position.y = Math.sin(t * 18 + 1) * 0.03 * s;
      break;
    }
    case "sway":
      v.body.rotation.z = Math.sin(t * 3.2) * 0.22 * s;
      v.wings.forEach((w) => (w.rotation.z = Math.sin(t * 7) * 0.5 * s));
      break;
    case "tumble":
      v.body.rotation.z = Math.sin(t * 2.4) * 0.6 * s;
      v.body.position.y = Math.sin(t * 4.8) * 0.05 * s;
      break;
    case "hover":
      v.body.position.y = Math.sin(t * 5) * 0.05 * s;
      v.body.rotation.z = Math.sin(t * 2.5) * 0.08 * s;
      break;
  }
}

/** Porte d'embarquement : piliers, fronton argile « GATE », fanions, ligne d'arrivée à damier. */
function buildGate(x: number, c: Palette, fontFamily: string, root: Group, add: AddMesh, keep: Keep, clay: Material) {
  const k = new Kit();
  k.at(x, 0, -1.1, () => {
    for (const s of [-1, 1]) {
      k.box(0.62, 0.22, 0.62, mix(c.tone300, c.tone500, 0.5), s * 1.55, 0, 0);
      k.box(0.5, 3.4, 0.5, c.tone300, s * 1.55, 0.22, 0);
    }
    k.box(4, 0.95, 0.62, c.clay, 0, 3.4, 0);
    k.box(4.15, 0.12, 0.7, c.clayEdge, 0, 4.35, 0);
    const flags = [c.peach300, c.butter300, c.lake300, c.lilac300, c.sage300];
    for (let i = 0; i < 9; i++) {
      const fx = -1.25 + i * (2.5 / 8);
      const sag = Math.sin((i / 8) * Math.PI) * 0.22;
      k.cone(0.13, 0.26, flags[i % 5], fx, 3.35 - sag, 0.32, 3, { rx: Math.PI, sz: 0.25 });
    }
  });
  // Ligne d'arrivée à damier en travers du chemin.
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      k.box(0.28, 0.006, 0.28, (row + col) % 2 ? c.cream : c.inkSoft, x - 0.14 + row * 0.28, 0, -1.08 + col * 0.28 + 0.14);
    }
  }
  add(k.build().lit, clay);
  const texture = keep(gateTexture(c, fontFamily));
  const sign = keep(new MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }));
  const plane = new Mesh(keep(new PlaneGeometry(2.6, 0.65)), sign);
  plane.position.set(x, 3.88, -0.77);
  root.add(plane);
}

function gateTexture(c: Palette, fontFamily: string): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = c.cream;
    ctx.font = `900 84px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GATE", 290, 70);
    // Petit avion stylisé à gauche du texte.
    ctx.translate(92, 64);
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 9, 0, 0, Math.PI * 2);
    ctx.moveTo(-6, -2);
    ctx.lineTo(-18, -34);
    ctx.lineTo(4, -34);
    ctx.lineTo(16, -2);
    ctx.moveTo(-6, 2);
    ctx.lineTo(-18, 34);
    ctx.lineTo(4, 34);
    ctx.lineTo(16, 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
