import { PAGE_IDS, type PageId } from "./pages";

// Visite du site : deux mécanismes complémentaires, sans dépendance (module léger, importable
// par les composants serveur pour TOUR_STEPS et par le client pour les stores).
// 1. Pages vues pendant la session : carte HUD « Visite du site » (TourCard), affichée dans les
//    cadres de Rominou.
// 2. Visite guidée « La visite de Rominou » : 10 étapes sur les trois pages (TOUR_STEPS), état
//    gardé en sessionStorage (la visite continue d'une page à l'autre et après un rechargement).
// sessionStorage lu sans effet (useSyncExternalStore) ; stockage indisponible (navigation privée
// stricte, données de site bloquées) : la visite vit en mémoire, le temps de l'onglet.

/* ------------------------------------------------------------------ */
/* Pages vues (TourCard)                                              */
/* ------------------------------------------------------------------ */

const KEY = "rominou:tour";
const listeners = new Set<() => void>();

/** Valeur brute stockée ("pro,hobby") : chaîne stable pour useSyncExternalStore. */
export function getVisitedSnapshot(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

/** Serveur et hydratation : aucune page vue (la page courante est ajoutée au rendu). */
export function getServerVisitedSnapshot(): string {
  return "";
}

export function subscribeVisited(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function parseVisited(raw: string): PageId[] {
  return raw.split(",").filter((id): id is PageId => (PAGE_IDS as readonly string[]).includes(id));
}

/** Coche une page (dans l'ordre du site) et prévient les cartes affichées. */
export function markVisited(page: PageId): void {
  const visited = parseVisited(getVisitedSnapshot());
  if (visited.includes(page)) return;
  const next = PAGE_IDS.filter((id) => id === page || visited.includes(id)).join(",");
  try {
    window.sessionStorage.setItem(KEY, next);
  } catch {
    return;
  }
  for (const listener of listeners) listener();
}

/* ------------------------------------------------------------------ */
/* Visite guidée : étapes                                             */
/* ------------------------------------------------------------------ */

/**
 * Où Rominou parle : "hero" = dans la bulle du hero Pro (il reste sur son île) ;
 * "companion" = cadre compagnon fixé en bas de l'écran (feuille au-dessus du dock sur mobile).
 */
export type TourDock = "hero" | "companion";

export type TourStepConfig = {
  /** Clé des textes (messages tour.steps.<id>). */
  id: string;
  page: PageId;
  /** Section mise en avant par l'anneau (sélecteur CSS) ; null = aucun anneau. */
  target: string | null;
  /**
   * Contenu clé de l'étape (sélecteurs CSS), que la bulle ne recouvre jamais : d'abord l'élément
   * que montre le texte, puis le contexte (en-tête de la section…), par importance. La page
   * défile et le compagnon change de côté pour tout garder à l'écran, hors de la bulle ; si tout
   * ne tient pas (petit écran), le contexte est lâché en partant de la fin (placement.ts).
   */
  keep: readonly [string, ...string[]];
  dock: TourDock;
  /** Côté préféré du compagnon dès 48rem (défaut : à droite) ; l'autre côté si le contenu clé l'exige. */
  side?: "start" | "end";
  /**
   * Bouton d'action dans la bulle (libellé : tour.steps.<id>.action) : clique cet élément de la
   * page. Ex. « Jouer une partie » = le bouton « Jouer » du jeu, que la bulle peut recouvrir.
   */
  action?: string;
  /** Étiquette de l'anneau : en haut (défaut) ou en bas, si le haut touche un autre contrôle. */
  tag?: "top" | "bottom";
};

/** En-tête d'une section (sur-titre, titre, intro), par l'id de son titre. */
const heading = (titleId: string) => `header:has(> #${titleId})`;

/** Les étapes, dans l'ordre (ids des sections : stables, cf. les pages). */
export const TOUR_STEPS = [
  // La bulle est dans le hero (elle ne recouvre rien) : elle et le titre de la page à l'écran
  { id: "hello", page: "pro", target: null, keep: ["[data-tour-slot='hero']", "#pro-title"], dock: "hero" },
  // « Le dernier cadre est encore en cours » : le cadre du diplôme en cours (le dernier du mur)
  {
    id: "parcours",
    page: "pro",
    target: "#parcours",
    keep: ["#parcours ol > li:last-child", heading("parcours-title")],
    dock: "companion",
  },
  // « Le post-it scotché au mur »
  { id: "experience", page: "pro", target: "#experience", keep: ["#experience"], dock: "companion" },
  // Résumé « D'où viennent mes compétences » (l'étiquette gagnante)
  {
    id: "competences",
    page: "pro",
    target: "#competences",
    keep: ["#competences figure", heading("competences-title")],
    dock: "companion",
  },
  // « Clique Visiter » : le bouton (lien externe) de la carte du projet, son nom, l'en-tête
  {
    id: "projets",
    page: "pro",
    target: "#projets",
    keep: ["#projets article a[href^='http']", "#projets article h3", heading("projets-title")],
    dock: "companion",
  },
  // « Un clic sur M'écrire » : les boutons de contact
  {
    id: "contact",
    page: "pro",
    target: "#contact",
    keep: ["#contact ul", heading("contact-title")],
    dock: "companion",
  },
  // « Ouvre l'album de <dernier voyage> » : le bouton photos de la 1re carte et sa ville
  {
    id: "voyages",
    page: "hobby",
    target: "#voyages",
    keep: [
      "#voyages ul > li:first-child button[aria-expanded]",
      "#voyages ul > li:first-child h3",
      heading("voyages-title"),
    ],
    dock: "companion",
  },
  // Anneau : titre + cartes musique / LoL (sans le jeu, qui a sa propre étape). Contenu clé : la
  // carte musique, dont le texte parle d'abord (LoL est à côté dès 48rem, juste dessous sur mobile)
  {
    id: "musique",
    page: "hobby",
    target: "[data-tour-anchor='musique-jeux']",
    keep: ["#musique", heading("musique-jeux-title")],
    dock: "companion",
  },
  // Le bouton « Jouer » du jeu (que « Jouer une partie » clique) et le titre du jeu
  {
    id: "course",
    page: "hobby",
    target: "#jeu",
    keep: ["#jeu [data-play-button]", "#jeu-title"],
    dock: "companion",
    action: "#jeu [data-play-button]",
  },
  // Anneau autour de toute la fenêtre du chat : autour du seul formulaire, son trait barrait la
  // dernière suggestion juste au-dessus (contenu clé aussi). Étiquette en bas : sur mobile, le
  // haut de la fenêtre est hors de l'écran.
  {
    id: "questions",
    page: "chat",
    target: "div:has(> form #chat-input)",
    keep: ["form:has(#chat-input)", "div:has(> #chat-suggestions-label)"],
    dock: "companion",
    side: "start",
    tag: "bottom",
  },
] as const satisfies readonly TourStepConfig[];

export type TourStepId = (typeof TOUR_STEPS)[number]["id"];
export const TOUR_LENGTH = TOUR_STEPS.length;

/* ------------------------------------------------------------------ */
/* Visite guidée : état                                               */
/* ------------------------------------------------------------------ */

/**
 * - idle : jamais lancée (invitation du hero, « Lancer la visite ») ;
 * - active : Rominou guide (étape `step`) ;
 * - paused : le visiteur est parti ailleurs de lui-même -> pastille « Reprendre la visite » ;
 * - stopped : « Quitter » -> la carte propose de reprendre, sans pastille flottante ;
 * - done : visite terminée.
 */
export type TourStatus = "idle" | "active" | "paused" | "stopped" | "done";

export type TourState = {
  status: TourStatus;
  /** Index dans TOUR_STEPS. */
  step: number;
  /** Invitation du hero refusée (« Je préfère lire »). */
  declined: boolean;
  /** Page vers laquelle la visite navigue (non persisté) : pas de pause pendant le trajet. */
  pending: PageId | null;
  /** Sens du dernier changement d'étape (1 = suivante, -1 = précédente, 0 = reprise / début). */
  direction: 1 | -1 | 0;
  /** Surcouche de la visite chargée (non persisté) : la bulle du hero peut lui céder la place. */
  overlay: boolean;
  /** Emplacement de la bulle dans le hero Pro (non persisté, cf. TourSlot). */
  slot: HTMLElement | null;
  /** Compagnon replié en pastille (« Réduire », non persisté) : rouvert à chaque changement. */
  minimized: boolean;
};

const STATE_KEY = "rominou:visite";
const STATUSES: readonly TourStatus[] = ["idle", "active", "paused", "stopped", "done"];

const INITIAL: TourState = {
  status: "idle",
  step: 0,
  declined: false,
  pending: null,
  direction: 0,
  overlay: false,
  slot: null,
  minimized: false,
};

let state: TourState | null = null;
const tourListeners = new Set<() => void>();

function clampStep(step: number): number {
  return Math.min(Math.max(Math.trunc(step) || 0, 0), TOUR_LENGTH - 1);
}

function restore(): TourState {
  try {
    const raw = window.sessionStorage.getItem(STATE_KEY);
    if (!raw) return INITIAL;
    const saved = JSON.parse(raw) as Partial<Record<"status" | "step" | "declined", unknown>>;
    const status = STATUSES.includes(saved.status as TourStatus) ? (saved.status as TourStatus) : "idle";
    return { ...INITIAL, status, step: clampStep(Number(saved.step)), declined: saved.declined === true };
  } catch {
    return INITIAL;
  }
}

function current(): TourState {
  if (state === null) state = typeof window === "undefined" ? INITIAL : restore();
  return state;
}

function setState(patch: Partial<TourState>) {
  const prev = current();
  const next = { ...prev, ...patch };
  const changed = (Object.keys(patch) as (keyof TourState)[]).some((key) => !Object.is(prev[key], next[key]));
  if (!changed) return;
  state = next;
  if (prev.status !== next.status || prev.step !== next.step || prev.declined !== next.declined) {
    try {
      window.sessionStorage.setItem(
        STATE_KEY,
        JSON.stringify({ status: next.status, step: next.step, declined: next.declined }),
      );
    } catch {
      // Stockage indisponible : la visite reste en mémoire
    }
  }
  tourListeners.forEach((listener) => listener());
}

function pageOf(step: number): PageId {
  return TOUR_STEPS[clampStep(step)].page;
}

export const tourStore = {
  getState: current,
  getServerState: (): TourState => INITIAL,

  subscribe(listener: () => void): () => void {
    tourListeners.add(listener);
    return () => tourListeners.delete(listener);
  },

  /** Lance (ou relance) la visite depuis la première étape ; navigue vers sa page si besoin. */
  start() {
    setState({ status: "active", step: 0, direction: 0, pending: pageOf(0), declined: false, minimized: false });
  },

  /** Va à une étape (navigue vers sa page si elle est ailleurs). */
  goTo(step: number) {
    const next = clampStep(step);
    const { step: from } = current();
    setState({
      status: "active",
      step: next,
      direction: next > from ? 1 : next < from ? -1 : 0,
      pending: pageOf(next),
      minimized: false,
    });
  },

  next() {
    const { step } = current();
    if (step >= TOUR_LENGTH - 1) tourStore.finish();
    else tourStore.goTo(step + 1);
  },

  previous() {
    const { step } = current();
    if (step > 0) tourStore.goTo(step - 1);
  },

  /** Le visiteur est allé ailleurs de lui-même : la visite attend (pastille « Reprendre »). */
  pause() {
    if (current().status === "active") setState({ status: "paused", pending: null, minimized: false });
  },

  /** Reprend à l'étape en cours (navigue vers sa page si besoin). */
  resume() {
    const { step } = current();
    setState({ status: "active", direction: 0, pending: pageOf(step), minimized: false });
  },

  /** « Quitter » : la carte « Visite du site » proposera de reprendre. */
  stop() {
    setState({ status: "stopped", pending: null, minimized: false });
  },

  finish() {
    setState({ status: "done", pending: null, direction: 1, minimized: false });
  },

  /** « Je préfère lire » (invitation du hero). */
  decline() {
    setState({ declined: true });
  },

  /** Arrivée sur la page visée par la visite. */
  arrived() {
    if (current().pending !== null) setState({ pending: null });
  },

  /** « Réduire » / rouvrir la bulle du compagnon. */
  setMinimized(minimized: boolean) {
    setState({ minimized: minimized && current().status === "active" });
  },

  /** Réservé à TourOverlay / TourSlot. */
  setOverlay(overlay: boolean) {
    setState({ overlay });
  },
  setSlot(slot: HTMLElement | null) {
    setState({ slot });
  },
};
