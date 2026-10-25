"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AnimationMixer,
  CircleGeometry,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  MeshBasicMaterial,
  type AnimationAction,
  type Group,
  type Object3D,
  type SkinnedMesh,
} from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { modelUrl, type ModelQuality } from "@/lib/avatar/assets";
import { FEET_Y } from "@/lib/avatar/framing";
import { applyStageLook, STAGE_GL, STAGE_LIGHTS } from "@/lib/avatar/look";
import type { Level } from "@/lib/game/types";
import { StageErrorBoundary } from "@/components/three/StageErrorBoundary";
import { FOV, frameFor, TILT } from "./camera";
import { blinkHidden, interpolated, shakeAmount, type FrameSource } from "./frame";
import { mix, type Palette } from "./palette";
import type { Theme } from "./themes";
import { buildWorld, type World, type WorldView } from "./world3d";
import styles from "./game.module.css";

// Rendu 3D du jeu (chunk séparé, chargé seulement avec WebGL 2) : son PROPRE Canvas R3F,
// en frameloop "never" : c'est la boucle du jeu (GameLoop) qui demande chaque image
// (state.advance) -> une seule boucle, rien ne tourne en pause. Rominou = le GLB du site
// (tenue par défaut : clips run et bow), matériau « pâte à modeler » de la scène du site,
// avec une couche procédurale : étirement / écrasement, salto au double saut, sursaut au choc,
// révérence face à la caméra à l'arrivée. Caméra : suit Rominou, monte un peu avec lui quand il
// saute, petite secousse au choc (sauf mode tranquille / mouvement réduit), recadre la porte
// à l'arrivée.

const { key: keyLight, rim: rimLight } = STAGE_LIGHTS;

/** Mesures exposées aux tests (?e2e=1) : appels de dessin, triangles, taille du monde, temps de rendu. */
export type RenderStats = { calls: number; triangles: number; meshes: number; vertices: number; cpuMs: number };
/** Rapport de mesures : par image (calls, triangles, ms) ou à la construction du monde (meshes, vertices). */
export type StatsReport = (stats: Partial<RenderStats>) => void;

type Props = {
  level: Level;
  source: RefObject<FrameSource | null>;
  palette: Palette;
  theme: Theme;
  quality: ModelQuality;
  fontFamily: string;
  onReady: (draw: () => void) => void;
  onError: () => void;
  onStats?: StatsReport;
};

export default function GameCanvas3D({ level, source, palette, theme, quality, fontFamily, onReady, onError, onStats }: Props) {
  const dpr = quality === "mobile" ? 1.25 : 1.5;
  return (
    <StageErrorBoundary onError={onError}>
      <Canvas
        className={styles.canvas}
        frameloop="never"
        dpr={[1, dpr]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance", ...STAGE_GL }}
        camera={{ fov: FOV, near: 0.5, far: 700, position: [0, 3, 16] }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", onError, { once: true });
        }}
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      >
        <fog attach="fog" args={[theme.sky.horizon, 60, 330]} />
        <hemisphereLight args={[theme.hemisphere.sky, theme.hemisphere.ground, theme.night ? 1 : 1.15]} />
        <directionalLight
          color={theme.night ? mix(keyLight.color, palette.peach200, 0.4) : keyLight.color}
          intensity={keyLight.intensity * (theme.night ? 0.62 : 1)}
          position={keyLight.position}
        />
        <directionalLight color={rimLight.color} intensity={rimLight.intensity} position={rimLight.position} />
        <Scenery level={level} source={source} palette={palette} theme={theme} fontFamily={fontFamily} onStats={onStats} />
        <Suspense fallback={null}>
          <Runner url={modelUrl("default", quality)} source={source} palette={palette} />
          <Driver onReady={onReady} onStats={onStats} />
        </Suspense>
      </Canvas>
    </StageErrorBoundary>
  );
}

/** Donne à la boucle du jeu la fonction qui dessine une image (une fois Rominou chargé). */
function Driver({ onReady, onStats }: { onReady: (draw: () => void) => void; onStats?: StatsReport }) {
  const advance = useThree((state) => state.advance);
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    let cancelled = false;
    // Shaders compilés avant la première image (pas d'à-coup au départ).
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        onReady(() => {
          const start = performance.now();
          advance(performance.now() / 1000, true);
          onStats?.({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, cpuMs: performance.now() - start });
        });
      });
    return () => {
      cancelled = true;
    };
  }, [advance, camera, gl, onReady, onStats, scene]);
  return null;
}

const smooth = (edge0: number, edge1: number, x: number) => {
  const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Décor de l'étape + caméra. Caméra de côté qui suit Rominou (verrouillée en x pendant la
 * course : lisibilité), monte un peu avec lui pendant les sauts (amorti), secoue au choc, puis
 * recadre la porte à l'arrivée. Le décor lointain se cale sur la caméra (world3d.ts).
 */
function Scenery({
  level,
  source,
  palette,
  theme,
  fontFamily,
  onStats,
}: {
  level: Level;
  source: RefObject<FrameSource | null>;
  palette: Palette;
  theme: Theme;
  fontFamily: string;
  onStats?: StatsReport;
}) {
  const world: World = useMemo(() => buildWorld(level, palette, theme, fontFamily), [level, palette, theme, fontFamily]);
  useEffect(() => () => world.dispose(), [world]);
  useEffect(() => onStats?.({ meshes: world.stats.meshes, vertices: world.stats.vertices }), [world, onStats]);
  const lift = useRef(0);
  const view = useRef<WorldView>({ camX: 0, distance: 12, aspect: 16 / 9 });

  useFrame(({ camera, size }, delta) => {
    const frame = source.current;
    if (!frame) return;
    const { x, y, t } = interpolated(frame);
    const aspect = size.width / Math.max(1, size.height);
    const f = frameFor(x, level.speed, aspect);
    const dt = MathUtils.clamp(delta, 0, 0.1);
    const calm = frame.reducedMotion;

    let camX = f.x;
    let zoom = 1;
    let cy = f.y;
    if (frame.fx.finishAt >= 0) {
      // Arrivée : la porte à gauche, Rominou qui salue à droite, un peu plus près ; le fronton
      // de la porte reste sous le HUD (cadrage relevé si besoin).
      const k = calm ? 1 : smooth(0, 1.2, t - frame.fx.finishAt);
      camX = MathUtils.lerp(f.x, level.gateX + 2.1, k);
      zoom = MathUtils.lerp(1, 0.94, k);
      cy = MathUtils.lerp(f.y, Math.max(f.y, 4.5 - 0.29 * f.visibleH * zoom), k);
    }
    lift.current = calm ? 0 : MathUtils.damp(lift.current, Math.max(0, y) * 0.3, 5, dt);
    const shake = shakeAmount(frame, t);
    const ox = shake * Math.sin(t * 71) * 0.1;
    const oy = shake * Math.cos(t * 53) * 0.08;
    const distance = f.distance * zoom;
    cy += lift.current + oy;
    camera.position.set(camX + ox, cy + Math.sin(TILT) * distance, Math.cos(TILT) * distance);
    camera.lookAt(camX + ox, cy, 0);
    const v = view.current;
    v.camX = camX;
    v.distance = distance;
    v.aspect = aspect;
    world.update(frame, v);
  });
  return <primitive object={world.root} />;
}

type Clip = "idle" | "run" | "bow";

/** Lacet du modèle : profil vers la droite en course, trois-quarts face caméra à l'arrêt. */
const YAW_RUN = Math.PI / 2 - 0.42;
const YAW_FACE = 0.55;
const YAW_BOW = 0.3;

/** Rominou : le GLB du site, clip « run » en course, saut procédural, révérence à l'arrivée. */
function Runner({ url, source, palette }: { url: string; source: RefObject<FrameSource | null>; palette: Palette }) {
  const gltf = useGLTF(url, false, true);
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const flip = useRef<Group>(null);
  const yawGroup = useRef<Group>(null);
  const shadow = useRef<Object3D>(null);
  const yaw = useRef(YAW_FACE);
  const [shadowGeo] = useState(() => new CircleGeometry(0.42, 24).rotateX(-Math.PI / 2));
  const [shadowMat] = useState(() => new MeshBasicMaterial({ color: palette.ink, transparent: true, opacity: 0.16, depthWrite: false }));

  const model = useMemo(() => {
    applyStageLook(gltf.scene);
    const root = cloneSkinned(gltf.scene);
    root.traverse((object: Object3D) => {
      if ((object as SkinnedMesh).isSkinnedMesh) object.frustumCulled = false;
    });
    return root;
  }, [gltf.scene]);

  const anim = useRef<{
    mixer: AnimationMixer;
    actions: Map<Clip, AnimationAction>;
    current: Clip | null;
    celebrated: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    const mixer = new AnimationMixer(model);
    const actions = new Map<Clip, AnimationAction>();
    for (const clip of gltf.animations) {
      const name = clip.name as Clip;
      if (!["idle", "run", "bow"].includes(name)) continue;
      const action = mixer.clipAction(clip);
      if (name === "bow") {
        action.setLoop(LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(LoopRepeat, Infinity);
      }
      actions.set(name, action);
    }
    actions.get("idle")?.play();
    anim.current = { mixer, actions, current: "idle", celebrated: false };
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      anim.current = null;
      model.traverse((object: Object3D) => {
        if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.dispose();
      });
    };
  }, [gltf.animations, model]);

  useEffect(
    () => () => {
      shadowGeo.dispose();
      shadowMat.dispose();
    },
    [shadowGeo, shadowMat],
  );

  useFrame((_, delta) => {
    const frame = source.current;
    const a = anim.current;
    if (!frame || !a || !outer.current || !inner.current || !flip.current || !yawGroup.current) return;
    const { run, fx, level, phase, reducedMotion } = frame;
    const { x, y, t } = interpolated(frame);
    const dt = Math.min(Math.max(delta, 0), 0.1);
    const running = phase === "playing" && run.status === "running";

    // Clip voulu : course pendant la partie ; à l'arrivée, révérence (après quelques foulées).
    let wanted: Clip = "idle";
    if (run.status === "finished") {
      if (t - fx.finishAt <= 0.55) wanted = "run";
      else wanted = a.celebrated ? (a.current ?? "idle") : "bow";
    } else if (running) {
      wanted = "run";
      a.celebrated = false;
    }
    if (wanted !== a.current) {
      const next = a.actions.get(wanted) ?? a.actions.get("idle");
      const previous = a.current ? a.actions.get(a.current) : undefined;
      if (next) {
        next.reset().setEffectiveWeight(1).fadeIn(0.2).play();
        previous?.fadeOut(0.2);
        if (wanted === "bow") {
          // Révérence accélérée : le geste entier tient dans la célébration.
          next.timeScale = 1.9;
          a.celebrated = true;
          const done = () => {
            a.mixer.removeEventListener("finished", done);
            if (a.current === wanted) {
              a.actions.get("idle")?.reset().fadeIn(0.3).play();
              next.fadeOut(0.3);
              a.current = "idle";
            }
          };
          a.mixer.addEventListener("finished", done);
        }
      }
      a.current = wanted;
    }
    const runAction = a.actions.get("run");
    // Foulée proportionnelle à la vitesse ; jambes ralenties en l'air ; ralentit à l'arrivée.
    if (runAction) {
      const slowing = run.status === "finished" ? Math.max(0.35, 1 - (t - fx.finishAt) / 0.9) : 1;
      runAction.timeScale = (level.speed / 7) * (run.grounded ? 1 : 0.45) * slowing;
    }
    a.mixer.update(dt);

    outer.current.position.set(x, y - FEET_Y.default, 0);
    outer.current.visible = !blinkHidden(run, t);

    // Lacet : trois-quarts vers nous au départ, profil en course, face à nous pour saluer.
    const yawTarget = running ? YAW_RUN : run.status === "finished" ? (t - fx.finishAt > 0.5 ? YAW_BOW : YAW_RUN) : YAW_FACE;
    yaw.current = reducedMotion ? yawTarget : MathUtils.damp(yaw.current, yawTarget, run.status === "finished" ? 4 : 9, dt);
    yawGroup.current.rotation.y = yaw.current;

    // Saut procédural : tassé au décollage, étiré en montée, écrasé à l'atterrissage.
    let sy = 1;
    let tilt = running ? -0.06 : 0;
    let spin = 0;
    if (!reducedMotion) {
      const sinceJump = t - fx.jumpAt;
      const sinceLand = t - fx.landAt;
      if (!run.grounded) {
        sy = 1 + MathUtils.clamp(run.vy * 0.014, -0.08, 0.13);
        if (fx.jumpAt >= 0 && sinceJump < 0.07) sy = MathUtils.lerp(0.86, sy, sinceJump / 0.07);
        tilt += MathUtils.clamp(-run.vy * 0.02, -0.15, 0.2);
        // Double saut : petit salto avant.
        const sinceDouble = t - fx.doubleAt;
        if (fx.doubleAt >= 0 && sinceDouble < 0.42 && run.jumps === 2) spin = -smooth(0, 0.42, sinceDouble) * Math.PI * 2;
      } else if (fx.landAt >= 0 && sinceLand < 0.18) {
        sy = 1 - 0.16 * fx.landPower * Math.sin((sinceLand / 0.18) * Math.PI);
      }
      // Sursaut au choc (vers l'arrière).
      const sinceHit = t - fx.hitAt;
      if (fx.hitAt >= 0 && fx.hitKind === "hit" && sinceHit < 0.35) tilt += Math.sin((sinceHit / 0.35) * Math.PI) * 0.35;
    }
    inner.current.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    inner.current.rotation.z = tilt;
    flip.current.rotation.z = spin;

    if (shadow.current) {
      const height = Math.max(0, y);
      shadow.current.position.set(x, run.y < -0.05 ? -5 : 0.012, 0);
      shadow.current.scale.setScalar(1 / (1 + height * 0.45));
    }
  });

  return (
    <>
      <group ref={outer}>
        {/* Étirement et bascule (pivot aux pieds), salto (pivot au bassin), puis lacet. */}
        <group ref={inner}>
          <group position={[0, 0.9, 0]}>
            <group ref={flip}>
              <group position={[0, -0.9, 0]}>
                <group ref={yawGroup} rotation={[0, YAW_FACE, 0]}>
                  <primitive object={model} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
      <mesh ref={shadow} geometry={shadowGeo} material={shadowMat} renderOrder={2} />
    </>
  );
}
