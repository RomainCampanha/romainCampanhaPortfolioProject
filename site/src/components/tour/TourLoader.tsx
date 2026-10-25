"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PAGE_PATHS, pageFromPathname } from "@/lib/pages";
import { TOUR_STEPS, tourStore } from "@/lib/tour";
import { loadTourOverlay } from "./preload";
import { useTour } from "./useTour";
import type { TourLabels, TourStepText } from "./types";

// Chargeur de la visite guidée, toujours monté (layout) et minuscule :
// - suit la page : la visite navigue elle-même vers la page de l'étape ; si le visiteur part
//   ailleurs de lui-même, elle se met en pause (pastille « Reprendre la visite ») ;
// - ne télécharge l'interface (TourOverlay : bulle, compagnon, anneau…) qu'une fois la visite
//   lancée, ou à reprendre (rechargement de page en cours de visite).
const TourOverlay = dynamic(loadTourOverlay, { ssr: false });

type TourLoaderProps = { steps: TourStepText[]; labels: TourLabels };

export function TourLoader({ steps, labels }: TourLoaderProps) {
  const page = pageFromPathname(usePathname());
  const router = useRouter();
  const status = useTour((s) => s.status);
  const step = useTour((s) => s.step);
  const pending = useTour((s) => s.pending);
  // Navigation déjà demandée (un seul push par trajet)
  const pushed = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "active") {
      pushed.current = null;
      return;
    }
    const target = TOUR_STEPS[step].page;
    if (page === target) {
      pushed.current = null;
      tourStore.arrived();
      return;
    }
    if (pending === target) {
      // Trajet demandé par la visite (Suivant, Reprendre, outil du chat)
      if (pushed.current !== target) {
        pushed.current = target;
        router.push(PAGE_PATHS[target]);
      }
      return;
    }
    // Le visiteur est allé ailleurs (onglet, lien, retour arrière, 404)
    tourStore.pause();
  }, [page, pending, router, status, step]);

  if (status !== "active" && status !== "paused") return null;
  return <TourOverlay steps={steps} labels={labels} />;
}
