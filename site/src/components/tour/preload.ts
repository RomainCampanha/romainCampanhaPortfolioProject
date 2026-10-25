// Chunk de l'interface de la visite guidée (TourOverlay), chargé à la demande. Les boutons qui
// lancent la visite l'appellent aussi au survol / focus : l'interface est prête au clic.
export const loadTourOverlay = () => import("./TourOverlay");

export function preloadTourOverlay(): void {
  void loadTourOverlay();
}
