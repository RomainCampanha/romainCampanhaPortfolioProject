import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  NeutralToneMapping,
  NoToneMapping,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
  type ToneMapping,
} from "three";
import config from "./stage-config.json";

// Rendu « pâte à modeler » de Rominou (DA Cosy) : matériau mat, lumières chaudes et douces.
// Le GLB est « auto-éclairé » (texture émissive = texture de base, metalness 1) : brillant et
// contrasté sous une lumière directe. On le rend mat (metalness 0, rugosité élevée), on baisse
// l'émissif et on laisse un ciel crème, un sol sable et une lumière clé chaude modeler les volumes.
// Réglages dans stage-config.json, partagés avec le rendu des posters (scripts/build-avatar.mjs).
// Module three.js : importé uniquement par le chunk 3D (components/three/AvatarStage, AvatarModel).

type Vec3 = [number, number, number];

const TONE_MAPPINGS: Record<string, ToneMapping> = {
  aces: ACESFilmicToneMapping,
  agx: AgXToneMapping,
  neutral: NeutralToneMapping,
  none: NoToneMapping,
};

/** Réglages du renderer (props `gl` du Canvas, appliquées par R3F). */
export const STAGE_GL = {
  toneMapping: TONE_MAPPINGS[config.look.toneMapping] ?? ACESFilmicToneMapping,
  toneMappingExposure: config.look.exposure,
} as const;

const { hemisphere, key, rim } = config.lights;

/** Lumières de la scène : ciel / sol (hémisphère), clé chaude en haut à gauche, contre-jour froid. */
export const STAGE_LIGHTS = {
  hemisphere: { sky: hemisphere.sky, ground: hemisphere.ground, intensity: hemisphere.intensity },
  key: { color: key.color, intensity: key.intensity, position: key.position as Vec3 },
  rim: { color: rim.color, intensity: rim.intensity, position: rim.position as Vec3 },
} as const;

const looked = new WeakSet<Material>();

/**
 * Applique le matériau mat aux meshes du modèle (en place : matériaux partagés avec le cache
 * de useGLTF et les clones, réglage idempotent). Uniforms seulement : pas de recompilation.
 */
export function applyStageLook(root: Object3D) {
  const { metalness, roughness, emissiveIntensity } = config.look.material;
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const standard = material as MeshStandardMaterial;
      if (!standard.isMeshStandardMaterial || looked.has(material)) continue;
      standard.metalness = metalness;
      standard.roughness = roughness;
      standard.emissiveIntensity = emissiveIntensity;
      looked.add(material);
    }
  });
}
