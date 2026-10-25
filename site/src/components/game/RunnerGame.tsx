"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { LevelCard } from "@/lib/game/catalog";
import { recordCompletion, updateSave, useSave } from "@/lib/game/storage";
import type { GameMode } from "@/lib/game/types";
import { usePrefersReducedMotion } from "@/lib/avatar/hooks";
import { Button } from "@/components/ui/Button";
import { RominouHead } from "@/components/ui/RominouHead";
import { LevelMap } from "./LevelMap";
import { PostcardCollection } from "./PostcardCollection";
import { StartScreen } from "./StartScreen";
import styles from "./game.module.css";

// Îlot client de #jeu, léger : écran titre, carte du voyage, cartes postales et progression
// (localStorage). Le moteur (simulation, rendu 3D/2D, HUD) est un chunk séparé, téléchargé
// seulement quand le visiteur appuie sur « Jouer » (préchargé au survol / focus du bouton).

const loadPanel = () => import("./GamePanel");
const GamePanel = dynamic(loadPanel, { ssr: false, loading: () => <PanelLoading /> });

export function RunnerGame({ levels }: { levels: LevelCard[] }) {
  const save = useSave();
  const reducedMotion = usePrefersReducedMotion();
  // Mode choisi par le visiteur, sinon suggéré : tranquille si mouvement réduit.
  const mode: GameMode = save.mode ?? (reducedMotion ? "tranquille" : "normal");
  const suggested = save.mode === null && reducedMotion;
  const lastIndex = levels.length - 1;
  const unlocked = Math.min(save.unlocked, lastIndex);
  const [picked, setPicked] = useState<number | null>(null);
  const selected = Math.min(picked ?? unlocked, unlocked);
  const [playing, setPlaying] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(false);

  const setMode = useCallback((next: GameMode) => updateSave((s) => ({ ...s, mode: next })), []);
  const setSound = useCallback((sound: boolean) => updateSave((s) => ({ ...s, sound })), []);

  const play = (index: number) => {
    setPlaying(index);
    // L'écran de jeu entier dans la vue (sous le header, au-dessus du dock mobile).
    const behavior = reducedMotion ? "instant" : "smooth";
    requestAnimationFrame(() => screenRef.current?.scrollIntoView({ block: "nearest", behavior }));
  };

  const close = useCallback((nextSelected?: number) => {
    if (nextSelected !== undefined) setPicked(nextSelected);
    returnFocus.current = true;
    setPlaying(null);
  }, []);

  // Retour à la carte : focus sur le bouton « Jouer » de l'écran titre.
  useEffect(() => {
    if (playing !== null || !returnFocus.current) return;
    returnFocus.current = false;
    screenRef.current?.querySelector<HTMLElement>("[data-play-button]")?.focus();
  }, [playing]);

  const complete = useCallback(
    (index: number, stamps: number) => {
      const level = levels[index];
      if (level) recordCompletion(level.id, index, stamps, levels.length);
    },
    [levels],
  );

  return (
    <div className={styles.console}>
      <div ref={screenRef} className={styles.screen} data-tone={levels[playing ?? selected]?.tone} data-open={playing !== null || undefined}>
        {playing === null ? (
          <StartScreen
            level={levels[selected]}
            first={levels[0]?.name ?? ""}
            last={levels[lastIndex]?.name ?? ""}
            count={levels.length}
            mode={mode}
            suggested={suggested}
            onModeChange={setMode}
            onPlay={() => play(selected)}
            onPrefetch={() => void loadPanel()}
          />
        ) : (
          <PanelBoundary key={attempt} onRetry={() => setAttempt((n) => n + 1)} onClose={() => close()}>
            <GamePanel
              levels={levels}
              startIndex={playing}
              mode={mode}
              sound={save.sound}
              best={save.best}
              onSoundChange={setSound}
              onModeChange={setMode}
              onComplete={complete}
              onClose={close}
            />
          </PanelBoundary>
        )}
      </div>

      {playing === null ? (
        <LevelMap levels={levels} unlocked={unlocked} selected={selected} save={save} onSelect={setPicked} />
      ) : null}

      <PostcardCollection levels={levels} earned={save.postcards} />
    </div>
  );
}

/** Pendant le téléchargement du moteur (chunk du jeu). */
function PanelLoading() {
  const t = useTranslations("game.start");
  return (
    <div className={styles.loading} role="status">
      <RominouHead size={64} className={styles.loadingHead} />
      <p className="font-extrabold">{t("loading")}</p>
    </div>
  );
}

type BoundaryProps = { children: ReactNode; onRetry: () => void; onClose: () => void };

/** Chunk du jeu introuvable (hors ligne, déploiement en cours) : message + réessayer. */
class PanelBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <PanelError onRetry={this.props.onRetry} onClose={this.props.onClose} />;
  }
}

function PanelError({ onRetry, onClose }: { onRetry: () => void; onClose: () => void }) {
  const t = useTranslations("game");
  return (
    <div className={styles.loading} role="alert">
      <p className="max-w-[34ch] text-center font-extrabold">{t("start.error")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="sm" icon="refresh" onClick={onRetry}>
          {t("start.retry")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          {t("pause.map")}
        </Button>
      </div>
    </div>
  );
}
