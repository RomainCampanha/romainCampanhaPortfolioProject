"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { PAGE_IDS, PAGE_PATHS, pageFromPathname, type PageId } from "@/lib/pages";
import {
  getServerVisitedSnapshot,
  getVisitedSnapshot,
  markVisited,
  parseVisited,
  subscribeVisited,
  tourStore,
} from "@/lib/tour";
import { preloadTourOverlay } from "@/components/tour/preload";
import { useTour } from "@/components/tour/useTour";
import { Icon } from "@/components/ui/Icon";
import styles from "./AvatarAnchor.module.css";

/** Textes de la visite guidée (namespace « tour »), par étape quand ils portent un compteur. */
export type TourCardGuideLabels = {
  /** « Lancer la visite ». */
  start: string;
  /** « Reprendre (4/10) », par étape. */
  resume: readonly string[];
  /** « Reprendre la visite guidée, étape 4 sur 10 », par étape. */
  resumeLabel: readonly string[];
  /** « Refaire la visite ». */
  restart: string;
  /** « Visite en cours · 4/10 », par étape. */
  active: readonly string[];
};

type TourCardProps = {
  /** « Visite du site ». */
  title: string;
  /** « Visite terminée ! » (les trois pages vues, ou visite guidée terminée). */
  doneTitle: string;
  /** Libellés des pages (navigation). */
  steps: Record<PageId, string>;
  /** Progression affichée selon le nombre de pages vues (index 0 : « 1/3 »…). */
  progress: readonly string[];
  /** Même progression, en toutes lettres pour les lecteurs d'écran (« 1 page vue sur 3 »…). */
  progressLabel: readonly string[];
  /** Visite guidée (lancer / reprendre / refaire) ; sans : carte de navigation seule. */
  guide?: TourCardGuideLabels;
};

// Carte HUD « Visite du site 2/3 » (jeu cosy) accrochée au cadre de Rominou, sur les trois
// pages : une pastille par page, cliquable ; la page courante est en relief (aria-current="step"),
// les pages déjà vues pendant la session sont cochées (sessionStorage, cf. lib/tour.ts). Les
// trois vues (ou la visite guidée finie) : « Visite terminée ! ». Elle lance aussi la visite
// guidée de Rominou, ou la reprend là où elle s'est arrêtée. Hors des 3 pages (ex. 404) : rien.
export function TourCard({ title, doneTitle, steps, progress, progressLabel, guide }: TourCardProps) {
  const page = pageFromPathname(usePathname());
  const stored = useSyncExternalStore(subscribeVisited, getVisitedSnapshot, getServerVisitedSnapshot);
  const status = useTour((s) => s.status);
  const step = useTour((s) => s.step);

  useEffect(() => {
    if (page) markVisited(page);
  }, [page]);

  if (!page) return null;
  const visited = new Set<PageId>([...parseVisited(stored), page]);
  const index = visited.size - 1;
  // Pas de « Visite terminée » pendant la visite guidée (même si les 3 pages sont déjà vues)
  const done = status === "done" || (visited.size === PAGE_IDS.length && status !== "active");
  const heading = done ? doneTitle : title;

  return (
    <div
      role="group"
      aria-label={`${heading} ${progressLabel[index] ?? ""}`}
      data-done={done || undefined}
      className={styles.tour}
    >
      <p aria-hidden="true" className={styles.tourTitle}>
        <Icon name={done ? "check" : "sparkle"} />
        {heading}
      </p>
      {/* Pendant la visite guidée, son compteur (« 4/10 ») suffit : pas de « 1/3 » en plus */}
      {status === "active" ? null : (
        <p aria-hidden="true" className={styles.tourCount}>
          {progress[index]}
        </p>
      )}
      <ol className={styles.tourSteps}>
        {PAGE_IDS.map((id) => {
          const state = id === page ? "current" : visited.has(id) ? "done" : "todo";
          return (
            <li key={id}>
              <Link
                href={PAGE_PATHS[id]}
                data-state={state}
                aria-current={state === "current" ? "step" : undefined}
                className={styles.tourStep}
              >
                {state === "done" ? <Icon name="check" /> : null}
                {steps[id]}
              </Link>
            </li>
          );
        })}
      </ol>
      {guide ? <GuideAction labels={guide} status={status} step={step} /> : null}
    </div>
  );
}

type GuideActionProps = {
  labels: TourCardGuideLabels;
  status: ReturnType<typeof tourStore.getState>["status"];
  step: number;
};

/** Bouton de la visite guidée selon son état (jamais lancée, en pause, terminée, en cours). */
function GuideAction({ labels, status, step }: GuideActionProps) {
  if (status === "active") {
    return (
      <p className={styles.tourNote}>
        <Icon name="sparkle" />
        {labels.active[step]}
      </p>
    );
  }
  const resume = status === "paused" || status === "stopped";
  const restart = status === "done";
  return (
    <button
      type="button"
      className={styles.tourAction}
      data-variant={restart ? "secondary" : undefined}
      aria-label={resume ? labels.resumeLabel[step] : undefined}
      onPointerEnter={preloadTourOverlay}
      onFocus={preloadTourOverlay}
      onClick={() => (resume ? tourStore.resume() : tourStore.start())}
    >
      <Icon name={restart ? "refresh" : resume ? "arrow-right" : "sparkle"} />
      {resume ? labels.resume[step] : restart ? labels.restart : labels.start}
    </button>
  );
}
