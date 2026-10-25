"use client";

import { useSyncExternalStore } from "react";
import { tourStore, type TourState } from "@/lib/tour";

/**
 * Lit une partie de l'état de la visite guidée (lib/tour.ts). Le selector doit retourner une
 * valeur stable (primitive ou référence existante), jamais un nouvel objet à chaque appel.
 * Serveur et hydratation : état initial (visite jamais lancée), puis l'état de la session.
 */
export function useTour<T>(selector: (state: TourState) => T): T {
  return useSyncExternalStore(
    tourStore.subscribe,
    () => selector(tourStore.getState()),
    () => selector(tourStore.getServerState()),
  );
}
