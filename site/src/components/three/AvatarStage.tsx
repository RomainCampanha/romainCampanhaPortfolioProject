"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useThree } from "@react-three/fiber";
import { usePathname } from "@/i18n/navigation";
import { pageFromPathname } from "@/lib/pages";
import type { AvatarInput } from "@/lib/avatar/controller";
import { modelUrl } from "@/lib/avatar/assets";
import { preferredModelQuality } from "@/lib/avatar/device";
import { cameraForFraming, FRAMINGS, STAGE_FOV, STAGE_LIGHTS, type Framing } from "@/lib/avatar/framing";
import { useEffectiveOutfit } from "@/lib/avatar/hooks";
import { avatarStore, useAvatar, type AvatarAnchorVariant, type AvatarOutfit } from "@/lib/avatar/store";
import { AvatarModel } from "./AvatarModel";
import { disposeModels } from "./modelCache";
import { StageErrorBoundary } from "./StageErrorBoundary";
import { useStageActive } from "./useStageActive";

// Canvas R3F UNIQUE et persistant (monté une fois dans [locale]/layout via AvatarStageLoader).
// Son élément DOM est déplacé dans le "slot" de l'<AvatarAnchor> visible : il défile avec la
// page sans décalage, le contexte WebGL et les modèles chargés survivent aux navigations.
// AvatarStageLoader ne le monte qu'avec WebGL 2 et sans prefers-reduced-motion ; après une
// erreur 3D, poster permanent.
// Rendu à la demande (~30 i/s) et en pause quand Rominou ne fait rien (cf. FrameDriver).

const MAX_DPR = 1.75;
/** Cadence de rendu visée (i/s) : largement assez pour un avatar, deux fois moins de GPU. */
const TARGET_FPS = 30;
/** Sans activité (pointeur, clip, parole, navigation) pendant ce délai : rendu en pause (ms). */
const IDLE_AFTER_MS = 8000;
/** Hauteur approximative des yeux (m), pour orienter le regard vers le pointeur. */
const EYE_HEIGHT = 1.5;
/** Après ce délai sans mouvement du pointeur, Rominou regarde de nouveau devant lui (ms). */
const LOOK_TIMEOUT = 4000;

export default function AvatarStage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) avatarStore.setStatus("unavailable");
  }, [failed]);

  if (failed) return null;
  return <StageCanvas onError={() => setFailed(true)} />;
}

function StageCanvas({ onError }: { onError: () => void }) {
  const anchor = useAvatar((s) => s.anchor);
  const outfit = useEffectiveOutfit();
  const page = pageFromPathname(usePathname());
  const [quality] = useState(preferredModelQuality);
  const [host] = useState(createHost);
  const idle = useIdle();
  // Le Canvas n'est créé qu'une fois une ancre présente (pas de téléchargement sur la 404),
  // puis reste monté même si une page sans ancre s'affiche.
  const [started, setStarted] = useState(false);
  if (!started && idle && anchor) setStarted(true);

  const variant: AvatarAnchorVariant = anchor?.variant ?? "hero";
  const framing = FRAMINGS[variant];
  // Options de création de la caméra (lues une seule fois par R3F) ; StageCamera suit ensuite le cadrage.
  const [cameraOptions] = useState(() => ({
    fov: STAGE_FOV,
    near: 0.1,
    far: 30,
    position: cameraForFraming(framing).position,
  }));
  const active = useStageActive(anchor?.element ?? null);
  const getLook = usePointerLook(host, framing);

  // Déplace le Canvas dans le slot de l'ancre courante (avant le paint).
  useLayoutEffect(() => {
    const slot = anchor?.element.querySelector<HTMLElement>("[data-avatar-slot]") ?? anchor?.element;
    if (slot) slot.appendChild(host);
    else host.remove();
  }, [anchor, host]);

  // Démontage : libère le DOM, la mémoire GPU et le cache des modèles.
  useEffect(
    () => () => {
      host.remove();
      disposeModels();
    },
    [host],
  );

  useWaveOnFirstProVisit(page === "pro" && anchor !== null, outfit);

  if (!started) return null;

  const url = modelUrl(outfit, quality);

  return createPortal(
    <StageErrorBoundary onError={onError}>
      <Canvas
        frameloop={active ? "demand" : "never"}
        dpr={[1, MAX_DPR]}
        gl={{ alpha: true, antialias: true, powerPreference: "default" }}
        camera={cameraOptions}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          // Contexte perdu (GPU réinitialisé…) : on repasse au poster.
          gl.domElement.addEventListener("webglcontextlost", onError, { once: true });
        }}
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      >
        <FrameDriver active={active} />
        <StageCamera framing={framing} />
        <ambientLight intensity={STAGE_LIGHTS.ambient} />
        <directionalLight
          intensity={STAGE_LIGHTS.directional.intensity}
          position={STAGE_LIGHTS.directional.position as [number, number, number]}
        />
        <Suspense fallback={null}>
          <AvatarModel key={url} url={url} outfit={outfit} getLook={getLook} />
        </Suspense>
      </Canvas>
    </StageErrorBoundary>,
    host,
  );
}

/**
 * Pilote du rendu à la demande : demande une image toutes les ~33 ms tant que Rominou est
 * "éveillé" (clip ou parole en cours, ou activité récente : pointeur, store, redimensionnement),
 * puis se met en pause : le GPU ne travaille plus pendant que le visiteur lit.
 */
function FrameDriver({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!active) return;
    const frameMs = 1000 / TARGET_FPS;
    let raf = 0;
    let lastFrame = Number.NEGATIVE_INFINITY;
    let awakeUntil = performance.now() + IDLE_AFTER_MS;

    const tick = (now: number) => {
      const { clip, speaking } = avatarStore.getState();
      if (clip !== null || speaking) awakeUntil = now + IDLE_AFTER_MS;
      if (now > awakeUntil) {
        raf = 0; // pause jusqu'à la prochaine activité
        return;
      }
      // -1 ms : tolérance pour un écran 60 Hz (une image sur deux)
      if (now - lastFrame >= frameMs - 1) {
        lastFrame = now;
        invalidate();
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      awakeUntil = performance.now() + IDLE_AFTER_MS;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const unsubscribe = avatarStore.subscribe(wake);
    window.addEventListener("pointermove", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("resize", wake);
    };
  }, [active, invalidate]);

  return null;
}

/** Caméra fixe pour chaque cadrage (la boîte de scène garde toujours le même ratio). */
function StageCamera({ framing }: { framing: Framing }) {
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    const { camera } = get();
    const { position, target } = cameraForFraming(framing);
    camera.position.set(...position);
    camera.lookAt(...target);
    invalidate();
  }, [framing, get, invalidate]);
  return null;
}

function createHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.dataset.avatarStage = "";
  host.style.cssText = "position:absolute;inset:0;pointer-events:none;";
  return host;
}

/** true quand le navigateur est inactif (après le rendu initial / LCP), au plus tard ~1,5 s. */
function useIdle(): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setIdle(true), 300);
    return () => clearTimeout(id);
  }, []);
  return idle;
}

/** Suivi du pointeur (fenêtre entière) -> direction du regard relative aux yeux de Rominou. */
function usePointerLook(host: HTMLElement, framing: Framing): () => AvatarInput["look"] {
  const pointer = useRef({ x: 0, y: 0, at: Number.NEGATIVE_INFINITY });
  const framingRef = useRef(framing);
  useEffect(() => {
    framingRef.current = framing;
  }, [framing]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      pointer.current.at = performance.now();
    };
    const onLeave = () => {
      pointer.current.at = Number.NEGATIVE_INFINITY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return useCallback(() => {
    const p = pointer.current;
    if (performance.now() - p.at > LOOK_TIMEOUT) return null;
    const rect = host.getBoundingClientRect();
    if (rect.width === 0) return null;
    const { top, height } = framingRef.current;
    const eyeX = rect.left + rect.width / 2;
    const eyeY = rect.top + ((top - EYE_HEIGHT) / height) * rect.height;
    return {
      x: (p.x - eyeX) / (window.innerWidth / 2),
      y: (p.y - eyeY) / (window.innerHeight / 2),
    };
  }, [host]);
}

/** Rominou salue (wave) une seule fois, la première fois que la page Pro l'affiche en 3D. */
function useWaveOnFirstProVisit(onPro: boolean, outfit: AvatarOutfit) {
  const ready = useAvatar((s) => s.status === "ready" && s.readyOutfit === outfit);
  const waved = useRef(false);
  useEffect(() => {
    if (waved.current || !onPro || !ready || outfit !== "default") return;
    waved.current = true;
    avatarStore.play("wave");
  }, [onPro, ready, outfit]);
}
