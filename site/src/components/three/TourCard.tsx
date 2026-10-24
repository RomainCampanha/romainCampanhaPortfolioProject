"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { PAGE_IDS, PAGE_PATHS, pageFromPathname, type PageId } from "@/lib/pages";
import { getServerVisitedSnapshot, getVisitedSnapshot, markVisited, parseVisited, subscribeVisited } from "@/lib/tour";
import { Icon } from "@/components/ui/Icon";
import styles from "./AvatarAnchor.module.css";

type TourCardProps = {
  /** « Visite du site ». */
  title: string;
  /** « Visite terminée ! » (les trois pages vues). */
  doneTitle: string;
  /** Libellés des pages (navigation). */
  steps: Record<PageId, string>;
  /** Progression affichée selon le nombre de pages vues (index 0 : « 1/3 »…). */
  progress: readonly string[];
  /** Même progression, en toutes lettres pour les lecteurs d'écran (« 1 page vue sur 3 »…). */
  progressLabel: readonly string[];
};

// Carte HUD « Visite du site 2/3 » (jeu cosy) accrochée au cadre de Rominou, sur les trois
// pages : une pastille par page, cliquable ; la page courante est en relief (aria-current="step"),
// les pages déjà vues pendant la session sont cochées (sessionStorage, cf. lib/tour.ts). Les
// trois vues : « Visite terminée ! ». Hors des 3 pages (ex. 404) : rien.
export function TourCard({ title, doneTitle, steps, progress, progressLabel }: TourCardProps) {
  const page = pageFromPathname(usePathname());
  const stored = useSyncExternalStore(subscribeVisited, getVisitedSnapshot, getServerVisitedSnapshot);

  useEffect(() => {
    if (page) markVisited(page);
  }, [page]);

  if (!page) return null;
  const visited = new Set<PageId>([...parseVisited(stored), page]);
  const index = visited.size - 1;
  const done = visited.size === PAGE_IDS.length;
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
      <p aria-hidden="true" className={styles.tourCount}>
        {progress[index]}
      </p>
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
    </div>
  );
}
