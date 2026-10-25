"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { avatarStore } from "@/lib/avatar/store";
import { preferredModelQuality, supportsWebGL2 } from "@/lib/avatar/device";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/avatar/hooks";
import type { LevelCard } from "@/lib/game/catalog";
import { closeAudio, playBlip, type Blip } from "@/lib/game/audio";
import { exposeForE2E, forcedRenderer, shortLevels } from "@/lib/game/e2e";
import { generateLevel, INTRO_SECONDS } from "@/lib/game/generate";
import { GameLoop } from "@/lib/game/loop";
import { createRun, runProgress, stepRun } from "@/lib/game/sim";
import type { GameMode, HintKey, Level, LevelId } from "@/lib/game/types";
import { Button } from "@/components/ui/Button";
import { RominouHead } from "@/components/ui/RominouHead";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { Canvas2D } from "./Canvas2D";
import { createEffects, type FrameSource, type Phase } from "./frame";
import type { RenderStats } from "./GameCanvas3D";
import { GameHud, type HudState } from "./GameHud";
import { GameIcon } from "./GameIcon";
import { ModeSwitch } from "./ModeSwitch";
import { readPalette, type Palette } from "./palette";
import { skyStyle, themeFor } from "./themes";
import { Postcard } from "./Postcard";
import styles from "./game.module.css";

// Le jeu lui-même (chunk chargé au clic sur « Jouer ») : simulation à pas fixe (lib/game),
// une seule boucle d'animation, rendu 3D (son propre Canvas, chunk à part) ou 2D de secours,
// HUD accessible, pause, écran de fin avec la carte postale. Pendant que le jeu est ouvert,
// le Canvas de Rominou du site est suspendu (une seule boucle WebGL à la fois).

const GameCanvas3D = dynamic(() => import("./GameCanvas3D"), { ssr: false });

/** Délais (ms) : « Prêt ? », célébration (révérence, confettis) avant l'écran de fin, fin de partie. */
const READY_MS = 800;
const GO_MS = 650;
const CELEBRATE_MS = 2500;
const FAIL_MS = 900;
/** Sans 3D prête après ce délai (réseau lent), on passe au rendu 2D. */
const LOAD_TIMEOUT_MS = 15_000;
const HINT_SECONDS = 3;
/**
 * Écran de jeu qui sort de la vue (défilement) : pause automatique sous cette part visible
 * (de l'écran, ou de la fenêtre s'il est plus haut qu'elle).
 */
const MIN_VISIBLE = 0.6;
const VISIBILITY_STEPS = Array.from({ length: 21 }, (_, i) => i / 20);

type Result = { stamps: number; total: number; best: number; record: boolean };

type GamePanelProps = {
  levels: LevelCard[];
  startIndex: number;
  mode: GameMode;
  sound: boolean;
  best: Partial<Record<LevelId, number>>;
  onSoundChange: (sound: boolean) => void;
  onModeChange: (mode: GameMode) => void;
  onComplete: (index: number, stamps: number) => void;
  onClose: (selected?: number) => void;
};

const isJumpKey = (event: KeyboardEvent) =>
  event.key === " " || event.key === "ArrowUp" || event.key === "w" || event.key === "W" || event.code === "KeyW";

export default function GamePanel({
  levels,
  startIndex,
  mode,
  sound,
  best,
  onSoundChange,
  onModeChange,
  onComplete,
  onClose,
}: GamePanelProps) {
  const t = useTranslations("game");
  const reducedMotion = usePrefersReducedMotion();
  const coarse = useMediaQuery("(pointer: coarse)");
  const [short] = useState(shortLevels);
  const [quality] = useState(preferredModelQuality);

  const [index, setIndex] = useState(startIndex);
  const [runMode, setRunMode] = useState(mode);
  const [attempt, setAttempt] = useState(0);
  const card = levels[index];
  const level = useMemo(() => generateLevel(card, { mode: runMode, short }), [card, runMode, short]);

  const [renderer, setRenderer] = useState<"3d" | "2d">(() =>
    forcedRenderer() === "2d" || !supportsWebGL2() ? "2d" : "3d",
  );
  const [ready, setReady] = useState(false);
  const [phase, setPhaseState] = useState<Phase>("loading");
  const [countdown, setCountdown] = useState<"ready" | "go" | null>(null);
  const [hud, setHud] = useState<HudState>({ hearts: level.hearts, stamps: 0, progress: 0 });
  const [hint, setHint] = useState<HintKey | "intro" | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const expanded = nativeFullscreen || pseudoFullscreen;

  const rootRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [fontFamily, setFontFamily] = useState("sans-serif");
  // Ambiance de la ville : ciel (CSS, derrière le Canvas), lumière et brouillard (3D).
  const theme = useMemo(() => (palette ? themeFor(card.id, palette) : null), [card.id, palette]);
  const statsRef = useRef<RenderStats>({ calls: 0, triangles: 0, meshes: 0, vertices: 0, cpuMs: 0 });
  // Mesures du rendu 3D (lues seulement par les tests, ?e2e=1).
  const onStats = useCallback((report: Partial<RenderStats>) => {
    const stats = statsRef.current;
    const { cpuMs, ...rest } = report;
    Object.assign(stats, rest);
    if (cpuMs !== undefined) stats.cpuMs = stats.cpuMs ? stats.cpuMs * 0.95 + cpuMs * 0.05 : cpuMs;
  }, []);
  const frameTime = useRef({ last: 0, avg: 0 });

  // État mutable lu par la boucle et les rendus (pas de re-rendu React à chaque image).
  const sourceRef = useRef<FrameSource | null>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const phaseRef = useRef<Phase>("loading");
  const jumpQueued = useRef(false);
  const timers = useRef<number[]>([]);
  const soundRef = useRef(sound);
  const hudRef = useRef<HudState>(hud);
  const hintRef = useRef<HintKey | "intro" | null>(null);
  const reportRef = useRef({ index, best, onComplete, levels });
  const reducedMotionRef = useRef(reducedMotion);
  const handleEventsRef = useRef<(frame: FrameSource) => void>(() => {});
  const syncHudRef = useRef<(frame: FrameSource) => void>(() => {});
  const startRunRef = useRef<(level: Level) => void>(() => {});

  useEffect(() => {
    soundRef.current = sound;
    reducedMotionRef.current = reducedMotion;
    reportRef.current = { index, best, onComplete, levels };
  });

  // Une seule boucle : la simulation n'avance qu'en phase « playing » (pendant le compte à
  // rebours, on dessine seulement : Rominou respire, la scène est à jour).
  const loopRef = useRef<GameLoop | null>(null);
  useEffect(() => {
    const loop = new GameLoop({
      step: () => {
        const frame = sourceRef.current;
        if (!frame || phaseRef.current !== "playing") return;
        const jump = jumpQueued.current;
        jumpQueued.current = false;
        stepRun(frame.level, frame.run, jump);
        handleEventsRef.current(frame);
      },
      render: (alpha, now) => {
        const frame = sourceRef.current;
        if (!frame) return;
        const ft = frameTime.current;
        if (ft.last > 0 && now - ft.last < 250) ft.avg = ft.avg ? ft.avg * 0.95 + (now - ft.last) * 0.05 : now - ft.last;
        ft.last = now;
        // Hors course (compte à rebours de reprise) : position exacte, sans va-et-vient.
        frame.alpha = phaseRef.current === "playing" ? alpha : 1;
        drawRef.current?.();
        syncHudRef.current(frame);
      },
    });
    loopRef.current = loop;
    return () => loopRef.current?.stop();
  }, []);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    if (sourceRef.current) sourceRef.current.phase = next;
    setPhaseState(next);
  }, []);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const blip = useCallback((kind: Blip) => {
    if (soundRef.current) playBlip(kind);
  }, []);

  // Couleurs (tokens) lues sur l'écran de jeu (ton de l'étape) ; police du site pour la 3D.
  useEffect(() => {
    if (!rootRef.current) return;
    setPalette(readPalette(rootRef.current));
    setFontFamily(getComputedStyle(rootRef.current).fontFamily || "sans-serif");
  }, [card.tone]);

  // Une seule boucle WebGL : le Canvas de Rominou (site) est suspendu tant que le jeu est ouvert.
  useEffect(() => {
    avatarStore.setSuspended(true);
    return () => {
      avatarStore.setSuspended(false);
      closeAudio();
    };
  }, []);

  /* ------------------------------------------------------------------ Boucle de jeu */

  const syncHud = useCallback((frame: FrameSource) => {
    const { run, level: current } = frame;
    const progress = Math.round(runProgress(current, run) * 100) / 100;
    const prev = hudRef.current;
    if (prev.hearts !== run.hearts || prev.stamps !== run.stamps || prev.progress !== progress) {
      hudRef.current = { hearts: run.hearts, stamps: run.stamps, progress };
      setHud(hudRef.current);
    }
    const intro = current.index > 0 && run.x < current.startX + current.speed * INTRO_SECONDS ? "intro" : null;
    const active =
      current.hints.find((h) => run.x >= h.x && run.x < h.x + current.speed * HINT_SECONDS)?.key ?? intro;
    if (active !== hintRef.current) {
      hintRef.current = active;
      setHint(active);
    }
  }, []);

  const handleEvents = useCallback(
    (frame: FrameSource) => {
      const { run, fx } = frame;
      if (run.events.length === 0) return;
      for (const event of run.events) {
        switch (event.type) {
          case "jump":
            fx.jumpAt = run.t;
            blip("jump");
            break;
          case "double":
            fx.doubleAt = run.t;
            fx.doubleY = run.y;
            blip("double");
            break;
          case "land":
            // Plus de poussière après un double saut (on retombe de plus haut).
            fx.landPower = fx.doubleAt > fx.jumpAt ? 1.35 : 1;
            fx.landAt = run.t;
            fx.landX = run.x;
            break;
          case "stamp":
            fx.collectedAt[event.index] = run.t;
            blip("stamp");
            break;
          case "hit":
            fx.knockedAt[event.index] = run.t;
            fx.hitAt = run.t;
            fx.hitKind = "hit";
            fx.hitX = run.x;
            blip("hit");
            setAnnouncement(t("announce.hit", { hearts: event.hearts }));
            break;
          case "splash":
            fx.hitAt = run.t;
            fx.hitKind = "splash";
            fx.hitX = run.x;
            blip("splash");
            setAnnouncement(t("announce.splash", { hearts: event.hearts }));
            break;
          case "finish": {
            fx.finishAt = run.t;
            blip("finish");
            const { index: done, best: bestSoFar, onComplete: report } = reportRef.current;
            const previous = bestSoFar[frame.level.id] ?? 0;
            setResult({
              stamps: run.stamps,
              total: frame.level.stamps.length,
              best: Math.max(previous, run.stamps),
              record: run.stamps > previous,
            });
            report(done, run.stamps);
            later(CELEBRATE_MS, () => {
              setPhase("complete");
              loopRef.current?.stop();
            });
            break;
          }
          case "fail":
            blip("fail");
            later(FAIL_MS, () => {
              setPhase("failed");
              loopRef.current?.stop();
            });
            break;
        }
      }
      run.events.length = 0;
    },
    [blip, later, setPhase, t],
  );

  useEffect(() => {
    handleEventsRef.current = handleEvents;
    syncHudRef.current = syncHud;
  });

  /** « Prêt ? » puis « Partez ! » : la course (re)part au « Partez », au départ comme à la reprise. */
  const countIn = useCallback(
    (onGo: () => void) => {
      setPhase("countdown");
      setCountdown("ready");
      loopRef.current?.start();
      later(READY_MS, () => {
        setCountdown("go");
        setPhase("playing");
        onGo();
        later(GO_MS, () => setCountdown(null));
      });
    },
    [later, setPhase],
  );

  /** (Re)démarre l'étape courante : nouvelle partie, compte à rebours, puis course. */
  const startRun = useCallback(
    (current: Level) => {
      clearTimers();
      const run = createRun(current);
      sourceRef.current = {
        level: current,
        run,
        fx: createEffects(current),
        alpha: 0,
        phase: "countdown",
        reducedMotion: reducedMotionRef.current,
      };
      hudRef.current = { hearts: run.hearts, stamps: 0, progress: 0 };
      hintRef.current = null;
      setHud(hudRef.current);
      setHint(null);
      setResult(null);
      playRef.current?.focus({ preventScroll: true });
      countIn(() =>
        setAnnouncement(t("announce.start", { name: reportRef.current.levels[current.index]?.name ?? "" })),
      );
    },
    [clearTimers, countIn, t],
  );

  useEffect(() => {
    startRunRef.current = startRun;
  });

  // Nouvelle étape / nouvelle tentative, une fois le rendu prêt.
  useEffect(() => {
    if (ready) {
      startRunRef.current(level);
      return;
    }
    if (!sourceRef.current || sourceRef.current.level !== level) {
      const run = createRun(level);
      sourceRef.current = {
        level,
        run,
        fx: createEffects(level),
        alpha: 0,
        phase: "loading",
        reducedMotion: reducedMotionRef.current,
      };
    }
  }, [ready, level, attempt]);

  useEffect(() => {
    if (sourceRef.current) sourceRef.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => clearTimers, [clearTimers]);

  /* ------------------------------------------------------------------ Rendu */

  const onRendererReady = useCallback((draw: () => void) => {
    drawRef.current = draw;
    setReady(true);
  }, []);

  const onRendererError = useCallback(() => {
    drawRef.current = null;
    setReady(false);
    setRenderer("2d");
  }, []);

  // Réseau trop lent pour le modèle 3D : rendu 2D.
  useEffect(() => {
    if (renderer !== "3d" || ready) return;
    const id = window.setTimeout(onRendererError, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [renderer, ready, onRendererError]);

  // Redimensionnement (plein écran, rotation) : une image même en pause.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => {
      // Hauteur de l'écran de jeu : plancher de l'écran de fin, qui peut l'agrandir (CSS).
      if (phaseRef.current !== "complete" && phaseRef.current !== "failed") {
        root.style.setProperty("--play-h", `${root.offsetHeight}px`);
      }
      if (!loopRef.current?.isRunning) requestAnimationFrame(() => loopRef.current?.renderOnce());
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  /* ------------------------------------------------------------------ Commandes */

  const queueJump = useCallback(() => {
    if (phaseRef.current === "playing") jumpQueued.current = true;
  }, []);

  const pause = useCallback(() => {
    const current = phaseRef.current;
    if (current !== "playing" && current !== "countdown") return;
    // Arrivée ou chute finale en cours : l'écran de fin arrive, pas de pause.
    if (sourceRef.current && sourceRef.current.run.status !== "running") return;
    clearTimers();
    setCountdown(null);
    loopRef.current?.stop();
    setPhase("paused");
    setAnnouncement(t("announce.paused"));
  }, [clearTimers, setPhase, t]);

  // Reprise : « Prêt ? Partez ! » d'abord, le temps de reprendre ses repères.
  const resume = useCallback(() => {
    if (phaseRef.current !== "paused") return;
    playRef.current?.focus({ preventScroll: true });
    countIn(() => setAnnouncement(t("announce.resumed")));
  }, [countIn, t]);

  const restart = useCallback(() => {
    setRunMode(mode);
    setAttempt((n) => n + 1);
  }, [mode]);

  const goNext = useCallback(() => {
    setRunMode(mode);
    setIndex((i) => Math.min(i + 1, levels.length - 1));
    setAttempt((n) => n + 1);
  }, [levels.length, mode]);

  // Sortie du plein écran par notre bouton : pas de pause (Échap du navigateur : pause).
  const leavingFullscreen = useRef(false);
  const exitFullscreen = useCallback(() => {
    setPseudoFullscreen(false);
    if (document.fullscreenElement) {
      leavingFullscreen.current = true;
      void document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  const backToMap = useCallback(() => {
    exitFullscreen();
    onClose(Math.min(phaseRef.current === "complete" ? index + 1 : index, levels.length - 1));
  }, [exitFullscreen, index, levels.length, onClose]);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    onSoundChange(next);
    // Premier son dans le geste du visiteur (politique d'autoplay des navigateurs).
    if (next) playBlip("stamp");
  }, [onSoundChange]);

  const toggleFullscreen = useCallback(async () => {
    const root = rootRef.current;
    if (!root) return;
    if (document.fullscreenElement || pseudoFullscreen) {
      exitFullscreen();
      return;
    }
    if (document.fullscreenEnabled && root.requestFullscreen) {
      try {
        await root.requestFullscreen({ navigationUI: "hide" });
        return;
      } catch {
        // Refusé (iPhone…) : plein écran « maison » ci-dessous.
      }
    }
    setPseudoFullscreen(true);
  }, [exitFullscreen, pseudoFullscreen]);

  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement === rootRef.current;
      setNativeFullscreen(active);
      if (!active && !leavingFullscreen.current) pause();
      leavingFullscreen.current = false;
    };
    document.addEventListener("fullscreenchange", onChange);
    const root = rootRef.current;
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (root && document.fullscreenElement === root) void document.exitFullscreen().catch(() => undefined);
    };
  }, [pause]);

  // Plein écran « maison » : la page ne défile plus derrière le jeu.
  useEffect(() => {
    if (!pseudoFullscreen) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [pseudoFullscreen]);

  // Clavier : saut (Espace, ↑, W), pause (Échap, P). Seulement quand le focus est dans le jeu.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const root = rootRef.current;
      const active = document.activeElement;
      if (!root || (active && active !== document.body && !root.contains(active))) return;
      const target = event.target as HTMLElement | null;
      const onControl = target !== playRef.current && !!target?.closest("button, a, input, select, textarea");
      if (isJumpKey(event)) {
        if (onControl) return;
        if (phaseRef.current === "playing" || phaseRef.current === "countdown") {
          event.preventDefault();
          if (!event.repeat) queueJump();
        }
        return;
      }
      if (event.key === "Escape" || event.key === "p" || event.key === "P") {
        if (phaseRef.current === "playing" || phaseRef.current === "countdown") {
          event.preventDefault();
          pause();
        } else if (phaseRef.current === "paused") {
          event.preventDefault();
          resume();
        } else if (event.key === "Escape" && pseudoFullscreen) {
          setPseudoFullscreen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pause, pseudoFullscreen, queueJump, resume]);

  // Onglet caché ou fenêtre qui perd le focus : pause automatique.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") pause();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", pause);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", pause);
    };
  }, [pause]);

  // Écran de jeu qui sort de la vue (défilement de la page) : pause automatique. Seulement quand
  // la part visible DIMINUE (pas pendant le défilement qui amène le jeu à l'écran au départ).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    let last = 1;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;
        const span = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? window.innerHeight);
        const visible = span > 0 ? entry.intersectionRect.height / span : 0;
        if (visible < MIN_VISIBLE && visible < last) pause();
        last = visible;
      },
      { threshold: VISIBILITY_STEPS },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [pause]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    playRef.current?.focus({ preventScroll: true });
    queueJump();
  };

  // Focus sur l'action principale des écrans pause / fin. Fin d'étape : la carte entière dans la
  // vue (sur téléphone, l'écran s'agrandit pour la montrer ; marge du dock en CSS).
  useEffect(() => {
    if (phase !== "paused" && phase !== "complete" && phase !== "failed") return;
    const overlay = overlayRef.current;
    overlay?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    if (phase !== "paused" && !rootRef.current?.hasAttribute("data-fullscreen")) {
      overlay?.scrollIntoView({ block: "nearest", behavior: reducedMotionRef.current ? "instant" : "smooth" });
    }
  }, [phase]);

  // Tests e2e (?e2e=1 uniquement) : état en lecture seule.
  useEffect(
    () =>
      exposeForE2E(() => {
        const frame = sourceRef.current;
        return {
          screen: phaseRef.current,
          levelId: frame?.level.id ?? "",
          levelIndex: frame?.level.index ?? -1,
          mode: frame?.level.mode ?? "",
          status: frame?.run.status ?? "",
          t: frame?.run.t ?? 0,
          x: frame?.run.x ?? 0,
          y: frame?.run.y ?? 0,
          grounded: frame?.run.grounded ?? true,
          hearts: frame?.run.hearts ?? 0,
          stamps: frame?.run.stamps ?? 0,
          progress: frame ? runProgress(frame.level, frame.run) : 0,
          renderer,
          frameMs: Math.round(frameTime.current.avg * 100) / 100,
          render: renderer === "3d" ? { ...statsRef.current, cpuMs: Math.round(statsRef.current.cpuMs * 100) / 100 } : null,
        };
      }),
    [renderer],
  );

  const next = levels[index + 1];
  const hintText =
    hint === null
      ? null
      : hint === "intro"
        ? // Rendu 2D : obstacles génériques (cônes, valises…), pas les accessoires de la ville.
          renderer === "2d" && card.index > 0
          ? t("intro2d", { name: card.name })
          : t(`intro.${card.id}`)
        : hint === "jump"
          ? t(coarse ? "hints.jumpTouch" : "hints.jumpKeys")
          : t(`hints.${hint}`);

  return (
    <div
      ref={rootRef}
      className={styles.game}
      data-tone={card.tone}
      data-world={card.id}
      data-stars={theme?.sky.stars || undefined}
      style={theme ? (skyStyle(theme) as CSSProperties) : undefined}
      data-expanded={pseudoFullscreen || undefined}
      data-fullscreen={expanded || undefined}
      data-phase={phase}
    >
      <div
        ref={playRef}
        className={styles.playArea}
        role="application"
        aria-label={t("hud.playArea", { name: card.name })}
        tabIndex={0}
        onPointerDown={onPointerDown}
      >
        {palette && theme ? (
          renderer === "3d" ? (
            <GameCanvas3D
              level={level}
              source={sourceRef}
              palette={palette}
              theme={theme}
              onStats={onStats}
              quality={quality}
              fontFamily={fontFamily}
              onReady={onRendererReady}
              onError={onRendererError}
            />
          ) : (
            <Canvas2D key={card.id} source={sourceRef} theme={theme} onReady={onRendererReady} />
          )
        ) : null}
      </div>

      {/* HUD puis bulle de conseil, empilés en haut (la bulle ne masque jamais le HUD) */}
      <div className={styles.topStack}>
        <GameHud
          card={card}
          total={levels.length}
          maxHearts={level.hearts}
          hud={hud}
          sound={sound}
          expanded={expanded}
          canPause={phase === "playing" || phase === "countdown"}
          onPause={pause}
          onSound={toggleSound}
          onFullscreen={() => void toggleFullscreen()}
        />

        {hintText && phase === "playing" ? (
          <div className={styles.hint} aria-hidden="true">
            <RominouHead size={40} className={styles.hintHead} />
            <SpeechBubble size="sm" name={null} tail="left" tailOffset="50%">
              {hintText}
            </SpeechBubble>
          </div>
        ) : null}
      </div>

      {countdown ? (
        <p className={styles.countdown} data-step={countdown} aria-hidden="true">
          {countdown === "ready" ? t("hud.ready") : t("hud.go")}
        </p>
      ) : null}

      {phase === "loading" ? (
        <div className={styles.loading} role="status">
          <RominouHead size={64} className={styles.loadingHead} />
          <p className="font-extrabold">{t("start.loading")}</p>
        </div>
      ) : null}

      {phase === "paused" ? (
        <div ref={overlayRef} className={styles.overlay} role="dialog" aria-labelledby="jeu-pause-title">
          <div className={styles.panelCard}>
            <h4 id="jeu-pause-title" className="type-h3">
              {t("pause.title")}
            </h4>
            <p className="mt-2 font-semibold text-muted">{t("pause.text")}</p>
            <div className={styles.actions}>
              <Button data-autofocus="" onClick={resume}>
                <GameIcon name="play" />
                {t("pause.resume")}
              </Button>
              <Button variant="secondary" onClick={restart}>
                <GameIcon name="replay" />
                {t("pause.restart")}
              </Button>
              <Button variant="secondary" onClick={backToMap}>
                <GameIcon name="map" />
                {t("pause.map")}
              </Button>
            </div>
            <ModeSwitch className="mt-5" mode={mode} onChange={onModeChange} hint={t("mode.nextRun")} />
          </div>
        </div>
      ) : null}

      {phase === "complete" && result ? (
        <div ref={overlayRef} className={styles.overlay} role="dialog" aria-labelledby="jeu-done-title">
          <div className={styles.resultCard}>
            <p className="type-kicker text-accent">{t("complete.kicker")}</p>
            <h4 id="jeu-done-title" className={styles.resultTitle}>
              {t("complete.title", { name: card.name })}
            </h4>
            <Postcard level={card} className={styles.reveal} tilt={-1.5} />
            <p className={styles.resultStats}>
              <span>
                <GameIcon name="stamp" size={18} /> {t("complete.stamps", { count: result.stamps, total: result.total })}
              </span>
              <span>{result.record ? t("complete.record") : t("complete.best", { count: result.best })}</span>
            </p>
            {!next ? (
              <p className="mt-2 font-bold">
                {t("complete.allDone", { first: levels[0]?.name ?? "", last: card.name })}
              </p>
            ) : null}
            <div className={styles.actions}>
              {next ? (
                <Button size="sm" data-autofocus="" onClick={goNext}>
                  {t("complete.next", { name: next.name })}
                  <GameIcon name="play" />
                </Button>
              ) : null}
              <Button size="sm" variant="secondary" onClick={restart} {...(!next ? { "data-autofocus": "" } : {})}>
                <GameIcon name="replay" />
                {t("complete.replay")}
              </Button>
              <Button size="sm" variant="secondary" onClick={backToMap}>
                <GameIcon name="map" />
                {t("complete.map")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "failed" ? (
        <div ref={overlayRef} className={styles.overlay} role="dialog" aria-labelledby="jeu-failed-title">
          <div className={styles.panelCard}>
            <h4 id="jeu-failed-title" className="type-h3">
              {t("failed.title")}
            </h4>
            <p className="mt-2 font-semibold text-muted">{t("failed.text")}</p>
            <div className={styles.actions}>
              <Button data-autofocus="" onClick={restart}>
                <GameIcon name="replay" />
                {t("failed.retry")}
              </Button>
              <Button variant="secondary" onClick={backToMap}>
                <GameIcon name="map" />
                {t("failed.map")}
              </Button>
            </div>
            {mode === "normal" ? (
              <ModeSwitch className="mt-5" mode={mode} onChange={onModeChange} hint={t("failed.tryTranquille")} />
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <p className="sr-only" aria-live="polite">
        {hintText && phase === "playing" ? hintText : ""}
      </p>
    </div>
  );
}
