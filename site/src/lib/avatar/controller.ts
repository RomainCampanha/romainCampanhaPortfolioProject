import {
  AnimationMixer,
  Euler,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  Quaternion,
  type AnimationAction,
  type AnimationClip,
  type Object3D,
} from "three";
import type { AvatarClip } from "./store";

// Contrôleur d'animation de Rominou (three.js pur, sans React) :
// - clips du GLB : "idle" (pose neutre figée) + bow, wave (joués une fois) + walk, run (en boucle,
//   arrêtés par le store après LOOP_CLIP_MS via play(null)) ;
// - fondus enchaînés par poids amortis (indépendants du framerate), la somme des poids vaut
//   toujours 1 (l'idle complète) : jamais de mélange avec la T-pose de repos ;
// - couche procédurale par-dessus : respiration, regard vers le pointeur, hochements quand
//   Rominou parle. Les rotations sont exprimées dans le repère du modèle (X = gauche du
//   personnage, Y = haut, Z = devant), indépendamment des axes locaux des os.

const ONE_SHOT: ReadonlySet<string> = new Set<AvatarClip>(["bow", "wave"]);
/** Vitesse des fondus entre clips (λ de MathUtils.damp : ~90 % en 0,3 s). */
const BLEND_LAMBDA = 8;
/** Le retour à l'idle commence ce temps (s) avant la fin d'un clip ponctuel. */
const RETURN_LEAD = 0.45;
/** Regard : amplitude max (rad) et vitesse. */
const LOOK_MAX_YAW = 0.45;
const LOOK_MAX_PITCH = 0.22;
const LOOK_LAMBDA = 3.5;
const WEIGHT_LAMBDA = 5;
const TAU = Math.PI * 2;

export type AvatarInput = {
  /** Rominou parle. */
  speaking: boolean;
  /**
   * Position du pointeur relative à la tête, normalisée dans [-1, 1]
   * (x vers la droite de l'écran, y vers le bas). null = regarder droit devant.
   */
  look: { x: number; y: number } | null;
  /** Mouvement réduit : pas de couche procédurale, pas de clip. */
  reducedMotion: boolean;
};

type Offsets = { pitch: number; yaw: number; roll: number };

type ProceduralBone = {
  bone: Object3D;
  /** Ancêtres jusqu'à la racine du modèle (du plus haut au parent direct). */
  ancestors: Object3D[];
  rest: Quaternion;
  offsets: Offsets;
};

const PROCEDURAL_BONES = ["Spine02", "Spine01", "Spine", "neck", "Head"] as const;
type ProceduralBoneName = (typeof PROCEDURAL_BONES)[number];

// Objets temporaires réutilisés (pas d'allocation par frame)
const tmpParent = new Quaternion();
const tmpInverse = new Quaternion();
const tmpDelta = new Quaternion();
const tmpEuler = new Euler(0, 0, 0, "YXZ");

export class AvatarController {
  private readonly mixer: AnimationMixer;
  private readonly actions = new Map<string, AnimationAction>();
  private readonly idle: AnimationAction | undefined;
  /** Poids visés des clips (hors idle). */
  private readonly targets = new Map<AnimationAction, number>();
  private readonly weights = new Map<AnimationAction, number>();
  private readonly bones = new Map<ProceduralBoneName, ProceduralBone>();

  /** Clip ponctuel en cours et callback de fin. */
  private oneShot: { action: AnimationAction; onFinish?: () => void } | null = null;
  private time = 0;
  private reducedMotion = false;
  private lookYaw = 0;
  private lookPitch = 0;
  private procedural = { breath: 1, look: 1, talk: 0 };

  constructor(
    private readonly root: Object3D,
    clips: AnimationClip[],
  ) {
    this.mixer = new AnimationMixer(root);
    for (const clip of clips) {
      const action = this.mixer.clipAction(clip);
      if (ONE_SHOT.has(clip.name)) {
        action.setLoop(LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(LoopRepeat, Infinity);
      }
      this.actions.set(clip.name, action);
    }
    this.idle = this.actions.get("idle");
    this.idle?.play();

    for (const name of PROCEDURAL_BONES) {
      const bone = root.getObjectByName(name);
      if (!bone) continue;
      const ancestors: Object3D[] = [];
      for (let p = bone.parent; p && p !== root; p = p.parent) ancestors.unshift(p);
      this.bones.set(name, {
        bone,
        ancestors,
        rest: bone.quaternion.clone(),
        offsets: { pitch: 0, yaw: 0, roll: 0 },
      });
    }
  }

  /** Clips disponibles dans ce modèle. */
  has(clip: AvatarClip): boolean {
    return this.actions.has(clip);
  }

  /**
   * Lance un clip (null = retour à l'idle). bow/wave : joués une fois, puis `onFinish`.
   * Un clip absent du modèle (ex. walk en tenue vacances) laisse Rominou en idle et
   * renvoie false ; wave se rabat sur bow si besoin.
   */
  play(clip: AvatarClip | null, onFinish?: () => void): boolean {
    const name = clip === "wave" && !this.actions.has("wave") ? "bow" : clip;
    const action = name ? this.actions.get(name) : undefined;

    // Même clip ponctuel déjà en cours (et pas encore en sortie) : on le laisse finir.
    if (action && this.oneShot?.action === action && this.targets.get(action) === 1) {
      this.oneShot.onFinish = onFinish;
      return true;
    }

    for (const other of this.targets.keys()) this.targets.set(other, 0);
    this.oneShot = null;
    if (!action || this.reducedMotion) return clip === null;

    if (!this.weights.get(action)) action.reset();
    action.enabled = true;
    action.play();
    this.targets.set(action, 1);
    if (!this.weights.has(action)) this.weights.set(action, 0);
    if (ONE_SHOT.has(action.getClip().name)) {
      action.reset();
      this.oneShot = { action, onFinish };
    }
    return true;
  }

  update(delta: number, input: AvatarInput) {
    // Grand delta après une pause (onglet caché, frameloop "never") : on borne.
    const dt = Math.min(Math.max(delta, 0), 0.1);
    this.time += dt;
    this.reducedMotion = input.reducedMotion;

    if (input.reducedMotion) this.stopAll();
    this.updateOneShot();
    const clipWeight = this.updateWeights(dt);

    // Repart de la pose de repos : les offsets procéduraux ne s'accumulent jamais.
    for (const entry of this.bones.values()) entry.bone.quaternion.copy(entry.rest);
    this.mixer.update(dt);

    if (input.reducedMotion) return;
    this.applyProcedural(dt, input, clipWeight);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.actions.clear();
    this.targets.clear();
    this.weights.clear();
    this.oneShot = null;
  }

  // -------------------------------------------------------------------------

  /** Mouvement réduit : retour à l'idle, le clip ponctuel en cours est considéré terminé. */
  private stopAll() {
    this.reducedMotion = true;
    for (const action of this.targets.keys()) this.targets.set(action, 0);
    const shot = this.oneShot;
    this.oneShot = null;
    shot?.onFinish?.();
  }

  /** Fin d'un clip ponctuel : retour à l'idle un peu avant la dernière frame. */
  private updateOneShot() {
    const shot = this.oneShot;
    if (!shot) return;
    const duration = shot.action.getClip().duration;
    if (shot.action.time >= duration - RETURN_LEAD || !shot.action.isRunning()) {
      this.targets.set(shot.action, 0);
      this.oneShot = null;
      shot.onFinish?.();
    }
  }

  /** Amortit les poids ; l'idle prend le reste. Renvoie les poids par clip (0..1). */
  private updateWeights(dt: number): Record<string, number> {
    let sum = 0;
    for (const [action, target] of this.targets) {
      const current = this.weights.get(action) ?? 0;
      let next = MathUtils.damp(current, target, BLEND_LAMBDA, dt);
      if (Math.abs(next - target) < 1e-3) next = target;
      this.weights.set(action, next);
      sum += next;
    }
    const scale = sum > 1 ? 1 / sum : 1;
    const byClip: Record<string, number> = {};
    for (const [action, weight] of this.weights) {
      const w = weight * scale;
      byClip[action.getClip().name] = w;
      if (w === 0 && this.targets.get(action) === 0) {
        action.stop();
        this.weights.delete(action);
        this.targets.delete(action);
      } else {
        action.setEffectiveWeight(w);
      }
    }
    const idleWeight = Math.max(0, 1 - sum * scale);
    this.idle?.setEffectiveWeight(idleWeight);
    byClip.idle = idleWeight;
    return byClip;
  }

  private applyProcedural(dt: number, input: AvatarInput, clip: Record<string, number>) {
    const idle = clip.idle ?? 1;
    const bow = clip.bow ?? 0;
    const moving = (clip.walk ?? 0) + (clip.run ?? 0);

    // Poids visés de chaque couche, puis amortis.
    const p = this.procedural;
    p.breath = MathUtils.damp(p.breath, idle, WEIGHT_LAMBDA, dt);
    p.look = MathUtils.damp(p.look, idle + 0.3 * (clip.wave ?? 0) + 0.3 * moving, WEIGHT_LAMBDA, dt);
    p.talk = MathUtils.damp(p.talk, input.speaking ? 1 - bow : 0, WEIGHT_LAMBDA, dt);

    // Regard vers le pointeur (borné), amorti.
    const lookX = input.look ? MathUtils.clamp(input.look.x, -1, 1) : 0;
    const lookY = input.look ? MathUtils.clamp(input.look.y, -1, 1) : 0;
    this.lookYaw = MathUtils.damp(this.lookYaw, lookX * LOOK_MAX_YAW, LOOK_LAMBDA, dt);
    this.lookPitch = MathUtils.damp(this.lookPitch, lookY * LOOK_MAX_PITCH, LOOK_LAMBDA, dt);

    for (const entry of this.bones.values()) {
      entry.offsets.pitch = 0;
      entry.offsets.yaw = 0;
      entry.offsets.roll = 0;
    }
    const add = (name: ProceduralBoneName, pitch: number, yaw: number, roll = 0) => {
      const o = this.bones.get(name)?.offsets;
      if (!o) return;
      o.pitch += pitch;
      o.yaw += yaw;
      o.roll += roll;
    };
    const t = this.time;

    // Respiration : le buste se soulève (léger recul), la tête compense ; petit balancement.
    const breath = Math.sin((TAU * t) / 4.2) * p.breath;
    const sway = Math.sin((TAU * t) / 6.5) * p.breath;
    add("Spine02", -0.012 * breath, 0.008 * sway);
    add("Spine01", -0.01 * breath, 0.006 * sway);
    add("Spine", -0.008 * breath, 0);
    add("neck", 0.02 * breath, -0.01 * sway);

    // Parole : hochements de tête irréguliers + oscillation du buste.
    if (p.talk > 1e-3) {
      const nod = 0.6 * Math.sin(TAU * 1.9 * t) + 0.4 * Math.sin(TAU * 3.1 * t + 1.1);
      add("Head", 0.06 * nod * p.talk, 0.03 * Math.sin(TAU * 0.45 * t) * p.talk);
      add("neck", 0, 0, 0.03 * Math.sin(TAU * 0.8 * t) * p.talk);
      add("Spine01", 0.012 * Math.sin(TAU * 1.1 * t) * p.talk, 0.035 * Math.sin(TAU * 0.55 * t) * p.talk);
    }

    // Regard : 40 % cou, 60 % tête.
    add("neck", 0.4 * this.lookPitch * p.look, 0.4 * this.lookYaw * p.look);
    add("Head", 0.6 * this.lookPitch * p.look, 0.6 * this.lookYaw * p.look);

    // Application du haut vers le bas de la chaîne (Map conservant l'ordre de PROCEDURAL_BONES).
    for (const entry of this.bones.values()) {
      const { pitch, yaw, roll } = entry.offsets;
      if (pitch === 0 && yaw === 0 && roll === 0) continue;
      rotateInModelSpace(entry, pitch, yaw, roll);
    }
  }
}

/** Tourne un os autour d'axes exprimés dans le repère du modèle (pivot = l'os). */
function rotateInModelSpace(entry: ProceduralBone, pitch: number, yaw: number, roll: number) {
  tmpParent.identity();
  for (const ancestor of entry.ancestors) tmpParent.multiply(ancestor.quaternion);
  tmpDelta.setFromEuler(tmpEuler.set(pitch, yaw, roll));
  // q' = P⁻¹ · Δ · P · q
  tmpInverse.copy(tmpParent).invert();
  tmpDelta.premultiply(tmpInverse).multiply(tmpParent);
  entry.bone.quaternion.premultiply(tmpDelta);
}
