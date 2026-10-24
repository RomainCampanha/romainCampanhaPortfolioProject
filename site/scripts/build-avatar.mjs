#!/usr/bin/env node
// Construit les modèles 3D de Rominou (npm run assets:avatar).
//
// Entrées (lecture seule) : ../romain-portfolio/public/models (exports Blender, ~25 Mo chacun).
//   - Rig "A" (tenue par défaut) : RomainSalut.glb (Formal_Bow), RomainSalutMarrant.glb (Wave_One_Hand),
//     Animation_Walking_withSkin.glb, Animation_Running_withSkin.glb — même maillage, même bind pose.
//   - Rig "C" (tenue vacances) : RomainVacanceSalut.glb (Gentlemans_Bow).
// Sorties (public/models) :
//   - romain.glb          desktop : clips idle, bow, wave, walk, run ; texture WebP 2048 ;
//   - romain-mobile.glb   petits écrans / appareils modestes : idem, maillage plus léger, texture 1024 ;
//   - romain-vacances.glb tenue vacances : clips idle, bow ; texture 2048 ;
//   - romain-vacances-mobile.glb  idem, texture 1024 (même maillage : déjà léger) ;
//   - public/scenes/rominou-poster.webp, rominou-vacances-poster.webp : posters transparents (pose
//     idle, de face), rendus avec three.js dans Chromium headless (Playwright), même cadrage, même
//     look « pâte à modeler » (matériau mat, tone mapping) et mêmes lumières que le Canvas du site
//     (src/lib/avatar/stage-config.json). Affichés pendant le chargement, sans WebGL ou avec
//     prefers-reduced-motion.
//
// Pipeline : fusion des clips -> clip "idle" (pose neutre figée, 1re frame de "bow") ->
// matériau allégé (MeshStandardMaterial côté three) -> weld -> simplification meshoptimizer
// tenant compte des UV et normales (l'atlas de texture contient beaucoup de petits patchs :
// on pénalise la déformation des UV pour éviter les coutures visibles) -> nettoyage des pistes
// d'animation constantes -> resample -> prune/dedup -> WebP (sharp) -> quantization + meshopt.
//
// Idempotent : mêmes entrées => mêmes fichiers. Les tailles sont affichées à la fin.
// Les posters demandent Chromium (PLAYWRIGHT_CHROMIUM_PATH, /opt/pw-browsers/chromium ou
// le navigateur de Playwright : npx playwright install chromium).
//
// Usage :
//   node scripts/build-avatar.mjs [--out <dossier>] [--only desktop,mobile,vacances,posters]
//     Réglages (QA) : [--desktop-ratio 0.2] [--mobile-ratio 0.12] [--vacances-ratio 1]
//                     [--uv-weight 2] [--normal-weight 0.5]

import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Logger, NodeIO } from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  EXTTextureWebP,
  KHRMaterialsIOR,
  KHRMaterialsSpecular,
} from "@gltf-transform/extensions";
import {
  cloneDocument,
  compactPrimitive,
  dedup,
  getPrimitiveVertexCount,
  meshopt,
  prune,
  resample,
  weld,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import stageConfig from "../src/lib/avatar/stage-config.json" with { type: "json" };

const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.resolve(SITE_DIR, "../romain-portfolio/public/models");

// Réglages validés visuellement (captures original vs candidats : plein pied, gros plan visage,
// poses animées). Desktop : 0.2 = plus léger niveau sans différence visible en gros plan
// (0.15 facette déjà la silhouette des cheveux). Mobile : 0.12, visage toujours net à petite taille.
// Vacances : maillage déjà léger (53k sommets), pas de simplification.
const PRESETS = {
  desktop: { file: "romain.glb", ratio: 0.2, texture: 2048, quality: 90, budget: 3.0 },
  mobile: { file: "romain-mobile.glb", ratio: 0.12, texture: 1024, quality: 90, budget: 1.7 },
  vacances: { file: "romain-vacances.glb", ratio: 1, texture: 2048, quality: 88, budget: 1.2 },
  // Mobile : texture 1024 (4x moins de mémoire GPU), maillage inchangé (pas de QA visuelle requise).
  vacancesMobile: { file: "romain-vacances-mobile.glb", ratio: 1, texture: 1024, quality: 88, budget: 0.9 },
};

// Rig A : fichier source -> nom du clip dans le GLB final.
const RIG_A_BASE = { file: "RomainSalut.glb", clip: "bow" };
const RIG_A_EXTRA_CLIPS = [
  { file: "RomainSalutMarrant.glb", clip: "wave" },
  { file: "Animation_Walking_withSkin.glb", clip: "walk" },
  { file: "Animation_Running_withSkin.glb", clip: "run" },
];
const RIG_C = { file: "RomainVacanceSalut.glb", clip: "bow" };
// Clip dont la 1re frame sert de pose neutre ("idle") : debout, bras le long du corps.
const IDLE_SOURCE = { A: "bow", C: "bow" };

// Poids des attributs pour simplifyWithAttributes : [u, v, nx, ny, nz].
let UV_WEIGHT = 2;
let NORMAL_WEIGHT = 0.5;
const SIMPLIFY_MAX_ERROR = 0.02; // 2 % de l'étendue du maillage (garde-fou)
// Ligne des cheveux, en fraction de la hauteur des sommets de la tête (menton = 0, sommet = 1).
const FACE_HAIRLINE = 0.62;

// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    out: { type: "string", default: path.join(SITE_DIR, "public/models") },
    "desktop-ratio": { type: "string" },
    "mobile-ratio": { type: "string" },
    "vacances-ratio": { type: "string" },
    only: { type: "string" },
    "uv-weight": { type: "string" },
    "normal-weight": { type: "string" },
  },
});
if (args["uv-weight"] !== undefined) UV_WEIGHT = Number(args["uv-weight"]);
if (args["normal-weight"] !== undefined) NORMAL_WEIGHT = Number(args["normal-weight"]);

for (const key of /** @type {const} */ (["desktop", "mobile", "vacances"])) {
  const override = args[`${key}-ratio`];
  if (override !== undefined) PRESETS[key].ratio = Number(override);
}
const only = new Set((args.only ?? "desktop,mobile,vacances,posters").split(","));
const OUT_DIR = path.resolve(args.out);
// Posters : public/scenes (décors des cadres), sauf sortie personnalisée (--out, QA).
const POSTER_DIR = args.out === undefined || path.resolve(args.out) === path.join(SITE_DIR, "public/models")
  ? path.join(SITE_DIR, "public/scenes")
  : OUT_DIR;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder })
  .setLogger(new Logger(Logger.Verbosity.WARN));
const log = (...parts) => console.log("[assets:avatar]", ...parts);

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;
await mkdir(OUT_DIR, { recursive: true });

const results = [];

if (only.has("desktop") || only.has("mobile")) {
  const rigA = await buildRigA();
  for (const key of /** @type {const} */ (["desktop", "mobile"])) {
    if (!only.has(key)) continue;
    results.push(await finalize(cloneDocument(rigA), PRESETS[key]));
  }
}
if (only.has("vacances")) {
  const rigC = await readSource(RIG_C.file);
  renameSingleClip(rigC, RIG_C.clip);
  addIdleClip(rigC, IDLE_SOURCE.C);
  results.push(await finalize(cloneDocument(rigC), PRESETS.vacances));
  results.push(await finalize(rigC, PRESETS.vacancesMobile));
}

let overBudget = false;
for (const r of results) {
  const flag = r.mb > r.budget ? "  <-- AU-DESSUS DU BUDGET" : "";
  if (flag) overBudget = true;
  log(
    `${r.file.padEnd(20)} ${r.mb.toFixed(2)} Mo (budget ${r.budget} Mo) · ` +
      `${r.vertices} sommets, ${r.triangles} triangles · clips: ${r.clips.join(", ")}${flag}`,
  );
}
if (overBudget) process.exitCode = 1;

if (only.has("posters")) {
  try {
    await renderPosters([
      { model: PRESETS.desktop.file, out: "rominou-poster.webp" },
      { model: PRESETS.vacances.file, out: "rominou-vacances-poster.webp" },
    ]);
  } catch (error) {
    console.error("[assets:avatar] Posters non générés :", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// Étapes

async function readSource(file) {
  return io.read(path.join(SOURCE_DIR, file));
}

/** Fusionne les 4 clips du rig A dans un seul document. */
async function buildRigA() {
  const doc = await readSource(RIG_A_BASE.file);
  renameSingleClip(doc, RIG_A_BASE.clip);
  for (const { file, clip } of RIG_A_EXTRA_CLIPS) {
    const src = await readSource(file);
    assertSameRig(doc, src, file);
    copyAnimations(src, doc, clip);
  }
  addIdleClip(doc, IDLE_SOURCE.A);
  return doc;
}

function renameSingleClip(doc, name) {
  const animations = doc.getRoot().listAnimations();
  if (animations.length !== 1) throw new Error(`1 animation attendue, ${animations.length} trouvées`);
  animations[0].setName(name);
}

/** Vérifie que deux exports partagent squelette et maillage (sinon les clips ne sont pas compatibles). */
function assertSameRig(a, b, label) {
  const skinA = a.getRoot().listSkins()[0];
  const skinB = b.getRoot().listSkins()[0];
  const namesA = skinA.listJoints().map((j) => j.getName()).join();
  const namesB = skinB.listJoints().map((j) => j.getName()).join();
  if (namesA !== namesB) throw new Error(`${label} : squelette différent`);
  const ibmA = skinA.getInverseBindMatrices().getArray();
  const ibmB = skinB.getInverseBindMatrices().getArray();
  for (let i = 0; i < ibmA.length; i++) {
    if (Math.abs(ibmA[i] - ibmB[i]) > 1e-3) throw new Error(`${label} : bind pose différente`);
  }
  const vA = a.getRoot().listAccessors().find((x) => x.getType() === "VEC3")?.getCount();
  const vB = b.getRoot().listAccessors().find((x) => x.getType() === "VEC3")?.getCount();
  if (vA !== vB) throw new Error(`${label} : maillage différent`);
}

/** Copie les animations de src vers dst (cibles résolues par nom de nœud). */
function copyAnimations(src, dst, name) {
  const buffer = dst.getRoot().listBuffers()[0];
  const nodesByName = new Map(dst.getRoot().listNodes().map((n) => [n.getName(), n]));
  for (const anim of src.getRoot().listAnimations()) {
    const copy = dst.createAnimation(name);
    for (const channel of anim.listChannels()) {
      const target = nodesByName.get(channel.getTargetNode().getName());
      if (!target) throw new Error(`Nœud cible introuvable : ${channel.getTargetNode().getName()}`);
      const sampler = channel.getSampler();
      const cloneAccessor = (acc) =>
        dst.createAccessor().setType(acc.getType()).setArray(acc.getArray().slice()).setBuffer(buffer);
      const s = dst
        .createAnimationSampler()
        .setInput(cloneAccessor(sampler.getInput()))
        .setOutput(cloneAccessor(sampler.getOutput()))
        .setInterpolation(sampler.getInterpolation());
      copy.addSampler(s);
      copy.addChannel(
        dst.createAnimationChannel().setSampler(s).setTargetNode(target).setTargetPath(channel.getTargetPath()),
      );
    }
  }
}

/** Crée le clip "idle" : la 1re frame d'un clip existant, figée (2 clés identiques, 1 s). */
function addIdleClip(doc, sourceName) {
  const root = doc.getRoot();
  const source = root.listAnimations().find((a) => a.getName() === sourceName);
  if (!source) throw new Error(`Clip source de l'idle introuvable : ${sourceName}`);
  const buffer = root.listBuffers()[0];
  const idle = doc.createAnimation("idle");
  for (const channel of source.listChannels()) {
    const output = channel.getSampler().getOutput();
    const first = output.getElement(0, []);
    const input = doc.createAccessor().setType("SCALAR").setArray(new Float32Array([0, 1])).setBuffer(buffer);
    const values = doc
      .createAccessor()
      .setType(output.getType())
      .setArray(new Float32Array([...first, ...first]))
      .setBuffer(buffer);
    const sampler = doc.createAnimationSampler().setInput(input).setOutput(values).setInterpolation("LINEAR");
    idle.addSampler(sampler);
    idle.addChannel(
      doc
        .createAnimationChannel()
        .setSampler(sampler)
        .setTargetNode(channel.getTargetNode())
        .setTargetPath(channel.getTargetPath()),
    );
  }
}

/**
 * Supprime les pistes constantes égales à la pose de repos du nœud (ex. scale = 1, translation
 * des os enfants) : three restaure de toute façon la valeur de repos quand rien ne l'anime.
 */
function removeConstantTracks(doc) {
  let removed = 0;
  for (const anim of doc.getRoot().listAnimations()) {
    for (const channel of anim.listChannels()) {
      const node = channel.getTargetNode();
      const pathName = channel.getTargetPath();
      const rest =
        pathName === "translation"
          ? node.getTranslation()
          : pathName === "rotation"
            ? node.getRotation()
            : pathName === "scale"
              ? node.getScale()
              : null;
      if (!rest) continue;
      const output = channel.getSampler().getOutput();
      const values = output.getArray();
      const size = output.getElementSize();
      const tolerance = pathName === "translation" ? 1e-3 : 1e-5;
      let constant = true;
      for (let i = 0; i < values.length && constant; i++) {
        let v = values[i];
        let r = rest[i % size];
        // q et -q représentent la même rotation
        if (pathName === "rotation" && Math.sign(values[i - (i % size) + 3]) !== Math.sign(rest[3])) r = -r;
        if (Math.abs(v - r) > tolerance) constant = false;
      }
      if (constant) {
        const sampler = channel.getSampler();
        channel.dispose();
        if (sampler.listParents().length <= 1) sampler.dispose();
        removed++;
      }
    }
  }
  return removed;
}

/** Matériau : retire KHR_materials_specular/ior (sans effet ici car metallic = 1) => MeshStandardMaterial. */
function simplifyMaterial(doc) {
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === KHRMaterialsSpecular.EXTENSION_NAME) ext.dispose();
    if (ext.extensionName === KHRMaterialsIOR.EXTENSION_NAME) ext.dispose();
  }
}

/**
 * Sommets "visage" à verrouiller : os dominant = Head, orientés vers l'avant (normale z > 0.3)
 * et sous la ligne des cheveux. Bouche, yeux et sourcils sont peints dans la texture : une
 * simplification à cet endroit déforme le dessin (bouche qui ondule). Le visage garde donc sa
 * densité d'origine (~8k sommets) et le reste du corps est simplifié.
 */
function faceLock(doc, prim) {
  const joints = doc.getRoot().listSkins()[0].listJoints().map((j) => j.getName());
  const head = joints.indexOf("Head");
  const P = prim.getAttribute("POSITION").getArray();
  const N = prim.getAttribute("NORMAL").getArray();
  const J = prim.getAttribute("JOINTS_0")?.getArray();
  const W = prim.getAttribute("WEIGHTS_0")?.getArray();
  const count = P.length / 3;
  const lock = new Uint8Array(count);
  if (head < 0 || !J || !W) return lock;

  const dominant = (i) => {
    let best = 0;
    for (let k = 1; k < 4; k++) if (W[i * 4 + k] > W[i * 4 + best]) best = k;
    return J[i * 4 + best];
  };
  let yMin = Infinity;
  let yMax = -Infinity;
  for (let i = 0; i < count; i++) {
    if (dominant(i) !== head) continue;
    yMin = Math.min(yMin, P[i * 3 + 1]);
    yMax = Math.max(yMax, P[i * 3 + 1]);
  }
  const hairline = yMin + FACE_HAIRLINE * (yMax - yMin);
  for (let i = 0; i < count; i++) {
    if (dominant(i) === head && N[i * 3 + 2] > 0.3 && P[i * 3 + 1] < hairline) lock[i] = 1;
  }
  return lock;
}

/**
 * Simplification meshoptimizer sensible aux attributs (UV + normales), coutures préservées,
 * visage verrouillé. ratio = part des triangles conservés (1 = pas de simplification).
 */
function simplifyMesh(doc, ratio) {
  if (ratio >= 1) return;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const position = prim.getAttribute("POSITION");
      const normal = prim.getAttribute("NORMAL");
      const uv = prim.getAttribute("TEXCOORD_0");
      const indices = prim.getIndices();
      if (!position || !normal || !uv || !indices) throw new Error("Primitive incomplète");

      const count = position.getCount();
      const positions = Float32Array.from(position.getArray());
      const attributes = new Float32Array(count * 5);
      const n = normal.getArray();
      const t = uv.getArray();
      for (let i = 0; i < count; i++) {
        attributes[i * 5] = t[i * 2];
        attributes[i * 5 + 1] = t[i * 2 + 1];
        attributes[i * 5 + 2] = n[i * 3];
        attributes[i * 5 + 3] = n[i * 3 + 1];
        attributes[i * 5 + 4] = n[i * 3 + 2];
      }
      const lock = faceLock(doc, prim);
      const locked = lock.reduce((sum, v) => sum + v, 0);
      const srcIndices = Uint32Array.from(indices.getArray());
      const target = Math.floor((srcIndices.length / 3) * ratio) * 3;
      const [dstIndices, error] = MeshoptSimplifier.simplifyWithAttributes(
        srcIndices,
        positions,
        3,
        attributes,
        5,
        [UV_WEIGHT, UV_WEIGHT, NORMAL_WEIGHT, NORMAL_WEIGHT, NORMAL_WEIGHT],
        lock,
        target,
        SIMPLIFY_MAX_ERROR,
        [],
      );
      prim.setIndices(doc.createAccessor().setType("SCALAR").setArray(dstIndices).setBuffer(indices.getBuffer()));
      if (indices.listParents().length === 1) indices.dispose();
      compactPrimitive(prim);
      log(
        `  simplify ${ratio}: ${srcIndices.length / 3} -> ${dstIndices.length / 3} triangles ` +
          `(erreur ${(error * 100).toFixed(3)} %, ${locked} sommets du visage verrouillés)`,
      );
    }
  }
}

/** Texture unique (baseColor = emissive) -> WebP redimensionnée, sans alpha (matériau opaque). */
async function compressTextures(doc, size, quality) {
  const textures = doc.getRoot().listTextures();
  for (const texture of textures) {
    const image = texture.getImage();
    if (!image) continue;
    const webp = await sharp(Buffer.from(image))
      .removeAlpha()
      .resize(size, size, { fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toBuffer();
    texture.setImage(new Uint8Array(webp)).setMimeType("image/webp");
    const uri = texture.getURI();
    if (uri) texture.setURI(uri.replace(/\.\w+$/, ".webp"));
  }
  if (textures.length) doc.createExtension(EXTTextureWebP).setRequired(true);
}

async function finalize(doc, preset) {
  log(`→ ${preset.file}`);
  simplifyMaterial(doc);
  await doc.transform(dedup(), weld());
  simplifyMesh(doc, preset.ratio);
  const removed = removeConstantTracks(doc);
  log(`  ${removed} pistes d'animation constantes supprimées`);
  await doc.transform(resample({ tolerance: 1e-4 }), prune(), dedup());
  await compressTextures(doc, preset.texture, preset.quality);
  await doc.transform(
    meshopt({
      encoder: MeshoptEncoder,
      level: "high",
      quantizePosition: 14,
      // Atlas 2048 rempli de petits patchs : 14 bits pour éviter tout glissement de texture
      quantizeTexcoord: 14,
    }),
  );
  doc.getRoot().getAsset().generator = "romaincampanha.ch build-avatar";

  const out = path.join(OUT_DIR, preset.file);
  await io.write(out, doc);
  const { size } = await stat(out);

  const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  return {
    file: preset.file,
    budget: preset.budget,
    mb: size / 1024 / 1024,
    vertices: getPrimitiveVertexCount(prim, "upload"),
    triangles: getPrimitiveVertexCount(prim, "render") / 3,
    clips: doc
      .getRoot()
      .listAnimations()
      .map((a) => a.getName()),
  };
}

// ---------------------------------------------------------------------------
// Posters : rendu three.js dans Chromium headless (SwiftShader), fond transparent.

/** Page de rendu (fonction : hissée, utilisable depuis le haut du module). */
function posterPage(config) {
  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8">
<style>html,body{margin:0;background:transparent}canvas{display:block}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
</head><body><script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
const config = ${JSON.stringify(config)};
const { width, height } = config.poster;
const framing = config.framings[config.poster.framing];
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
// Look « pâte à modeler » : mêmes réglages que le Canvas (src/lib/avatar/look.ts)
const toneMappings = { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping, none: THREE.NoToneMapping };
renderer.toneMapping = toneMappings[config.look.toneMapping] ?? THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = config.look.exposure;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const { hemisphere, key, rim } = config.lights;
scene.add(new THREE.HemisphereLight(hemisphere.sky, hemisphere.ground, hemisphere.intensity));
for (const l of [key, rim]) {
  const light = new THREE.DirectionalLight(l.color, l.intensity);
  light.position.fromArray(l.position);
  scene.add(light);
}
const centerY = framing.top - framing.height / 2;
const distance = framing.height / 2 / Math.tan(THREE.MathUtils.degToRad(config.fov / 2));
const camera = new THREE.PerspectiveCamera(config.fov, width / height, 0.1, 30);
camera.position.set(0, centerY, distance);
camera.lookAt(0, centerY, 0);
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URLSearchParams(location.search).get("model"));
gltf.scene.traverse((o) => {
  if (o.isMesh && o.material.isMeshStandardMaterial) Object.assign(o.material, config.look.material);
});
scene.add(gltf.scene);
const mixer = new THREE.AnimationMixer(gltf.scene);
mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, "idle")).play();
mixer.setTime(0);
renderer.render(scene, camera);
window.__ready = true;
</script></body></html>`;
}

async function renderPosters(jobs) {
  const threeDir = path.join(SITE_DIR, "node_modules/three");
  const html = posterPage(stageConfig);
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const [root, rest] = url.startsWith("/three/")
      ? [threeDir, url.slice(7)]
      : url.startsWith("/models/")
        ? [OUT_DIR, url.slice(8)]
        : [null, ""];
    if (url === "/") {
      res.writeHead(200, { "content-type": "text/html" }).end(html);
      return;
    }
    const file = root ? path.join(root, rest) : null;
    if (!file || !file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    const type = file.endsWith(".js") ? "text/javascript" : "application/octet-stream";
    res.writeHead(200, { "content-type": type }).end(await readFile(file));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());

  const { chromium } = await import("@playwright/test");
  const localChromium = "/opt/pw-browsers/chromium";
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_PATH ?? (existsSync(localChromium) ? localChromium : undefined);
  const browser = await chromium.launch({
    executablePath,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  try {
    const { width, height } = stageConfig.poster;
    // Rendu 2x puis réduction : bords plus doux.
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    for (const job of jobs) {
      await page.goto(`http://127.0.0.1:${port}/?model=/models/${job.model}`);
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 120_000 });
      const png = await page.screenshot({ omitBackground: true });
      const webp = await sharp(png)
        .resize(width, height, { kernel: "lanczos3" })
        .webp({ quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true })
        .toBuffer();
      await mkdir(POSTER_DIR, { recursive: true });
      const out = path.join(POSTER_DIR, job.out);
      await writeFile(out, webp);
      log(`${job.out.padEnd(28)} ${(webp.length / 1024).toFixed(0)} Ko (${width}×${height})`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}
