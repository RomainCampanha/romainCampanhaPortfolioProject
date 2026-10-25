import type { PageId } from "@/lib/pages";

// Textes de la visite guidée, traduits et complétés côté serveur (TourRoot : faits tirés de
// profile.ts) : le navigateur ne reçoit que des chaînes prêtes à afficher, ni ICU ni profil.

/** Une étape (même ordre que TOUR_STEPS). */
export type TourStepText = {
  id: string;
  title: string;
  text: string;
  /** Libellé du bouton principal (« Suivant », « Mon côté perso », « Poser ma question »…). */
  next: string;
  /** Libellé du bouton d'action de l'étape (TOUR_STEPS[i].action), ex. « Jouer une partie ». */
  action?: string;
  /** « 3/10 » (visuel). */
  counter: string;
  /** « Étape 3 sur 10 » (lecteurs d'écran). */
  counterLabel: string;
  /** Annonce de la région live : « Étape 3 sur 10, Mon job : … ». */
  live: string;
  /** Pastille de reprise : « Reprendre la visite (3/10) » + version complète. */
  resume: string;
  resumeLabel: string;
  /** Bulle repliée : « Afficher la bulle (3/10) » + version complète. */
  expand: string;
  expandLabel: string;
};

export type TourLabels = {
  /** Cartouche de la bulle : « Rominou, le guide ». */
  guide: string;
  /** « Visite guidée ». */
  kicker: string;
  previous: string;
  quit: string;
  /** « Réduire la bulle » (compagnon replié en pastille). */
  minimize: string;
  /** Raccourcis clavier (« ← → pour avancer · Échap pour quitter »). */
  keys: string;
  /** « En route vers la page Hobby… », par page. */
  travelling: Record<PageId, string>;
  /** Nom du groupe de la pastille de reprise (« Visite en pause »). */
  paused: string;
};
