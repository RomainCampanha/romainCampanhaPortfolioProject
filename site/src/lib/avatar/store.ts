import { useSyncExternalStore } from "react";
import type { PageId } from "@/lib/pages";
import { defaultOutfitFor } from "./assets";

// Module client uniquement (à importer depuis des composants "use client").
// Petit store externe (sans dépendance) qui pilote Rominou, l'avatar 3D.
// Lisible depuis n'importe quel composant client via useAvatar(selector),
// modifiable via avatarStore.play(), .setSpeaking(), etc. (ex. tool calls du chat).

export type AvatarClip = "bow" | "wave" | "walk" | "run";

/**
 * Durée max (ms) des clips en boucle (walk, run) avant le retour automatique à l'idle.
 * < 5 s : un mouvement lancé automatiquement n'a pas besoin de bouton pause (WCAG 2.2.2).
 */
export const LOOP_CLIP_MS = 4000;
const LOOPED_CLIPS: ReadonlySet<AvatarClip> = new Set<AvatarClip>(["walk", "run"]);
export type AvatarOutfit = "default" | "vacances";
export type AvatarPage = PageId; // "pro" | "hobby" | "chat"
export type AvatarAnchorVariant = "hero" | "column" | "chat";
/**
 * État du rendu 3D (écrit par AvatarStage) :
 * - idle : pas (encore) de 3D affichée -> poster ;
 * - ready : le modèle `readyOutfit` est chargé, compilé et rendu ;
 * - unavailable : pas de WebGL 2, mouvement réduit ou erreur -> poster permanent.
 */
export type AvatarStageStatus = "idle" | "ready" | "unavailable";

export type AvatarAnchorInfo = {
  variant: AvatarAnchorVariant;
  element: HTMLElement;
};

export type AvatarState = {
  /**
   * Clip d'animation ponctuel en cours (null = idle).
   * bow/wave sont joués une fois puis le clip repasse à null ; walk/run bouclent
   * pendant LOOP_CLIP_MS (ou jusqu'au prochain play()), puis retour à l'idle.
   */
  clip: AvatarClip | null;
  /** Incrémenté à chaque play() : permet de rejouer le même clip. */
  clipNonce: number;
  /** Rominou parle (tête qui hoche, buste qui oscille). */
  speaking: boolean;
  /** Tenue : suit la page (Hobby = vacances) ; setOutfit() force une tenue jusqu'au changement de page. */
  outfit: AvatarOutfit;
  /** Page courante (synchronisée depuis l'URL par PageThemeRoot). */
  page: AvatarPage;
  /** Ancre visible où dessiner l'avatar (dernière <AvatarAnchor> montée). */
  anchor: AvatarAnchorInfo | null;
  /** État du rendu 3D (cf. AvatarStageStatus). */
  status: AvatarStageStatus;
  /** Tenue effectivement affichée en 3D quand status = "ready". */
  readyOutfit: AvatarOutfit | null;
};

const initialState: AvatarState = {
  clip: null,
  clipNonce: 0,
  speaking: false,
  outfit: "default",
  page: "pro",
  anchor: null,
  status: "idle",
  readyOutfit: null,
};

let state: AvatarState = initialState;
const listeners = new Set<() => void>();
// Pile des ancres montées : la plus récente gagne, retour à la précédente au démontage.
let anchors: AvatarAnchorInfo[] = [];
// Minuteur de fin des clips en boucle (walk, run).
let loopTimer: ReturnType<typeof setTimeout> | undefined;

function setState(patch: Partial<AvatarState>) {
  const next = { ...state, ...patch };
  const changed = (Object.keys(patch) as (keyof AvatarState)[]).some(
    (key) => !Object.is(state[key], next[key]),
  );
  if (!changed) return;
  state = next;
  listeners.forEach((listener) => listener());
}

export const avatarStore = {
  getState: (): AvatarState => state,
  getInitialState: (): AvatarState => initialState,

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Joue un clip (null = retour à l'idle). Rejouable même si identique.
   * walk/run s'arrêtent seuls après `loopMs` (défaut LOOP_CLIP_MS).
   */
  play(clip: AvatarClip | null, { loopMs = LOOP_CLIP_MS }: { loopMs?: number } = {}) {
    clearTimeout(loopTimer);
    const nonce = state.clipNonce + 1;
    setState({ clip, clipNonce: nonce });
    if (clip && LOOPED_CLIPS.has(clip)) {
      // Nouveau nonce => le contrôleur reçoit play(null) et revient en fondu à l'idle.
      loopTimer = setTimeout(() => {
        if (state.clipNonce === nonce) setState({ clip: null, clipNonce: nonce + 1 });
      }, loopMs);
    }
  },

  /**
   * Appelé par le contrôleur d'animation quand un clip ponctuel (bow, wave) se termine.
   * Ignoré si un autre play() a eu lieu entre-temps (nonce différent).
   */
  finishClip(nonce: number) {
    if (nonce === state.clipNonce && state.clip !== null) setState({ clip: null });
  },

  setSpeaking(speaking: boolean) {
    setState({ speaking });
  },

  /** Force une tenue (jusqu'au prochain changement de page). */
  setOutfit(outfit: AvatarOutfit) {
    setState({ outfit });
  },

  /** Change de page ; la tenue reprend la valeur par défaut de la page. */
  setPage(page: AvatarPage) {
    if (page === state.page) return;
    setState({ page, outfit: defaultOutfitFor(page) });
  },

  /** Réservé à AvatarStage. */
  setStatus(status: AvatarStageStatus, readyOutfit: AvatarOutfit | null = null) {
    setState({ status, readyOutfit: status === "ready" ? readyOutfit : null });
  },

  /** Enregistre une ancre DOM ; retourne la fonction de désinscription. */
  registerAnchor(element: HTMLElement, variant: AvatarAnchorVariant): () => void {
    const entry: AvatarAnchorInfo = { element, variant };
    anchors = [...anchors, entry];
    setState({ anchor: entry });
    return () => {
      anchors = anchors.filter((a) => a !== entry);
      setState({ anchor: anchors.at(-1) ?? null });
    };
  },
};

/**
 * Lit une partie de l'état de l'avatar.
 * Le selector doit retourner une valeur stable (primitive ou référence existante),
 * jamais un nouvel objet à chaque appel.
 */
export function useAvatar<T>(selector: (state: AvatarState) => T): T {
  return useSyncExternalStore(
    avatarStore.subscribe,
    () => selector(avatarStore.getState()),
    () => selector(initialState),
  );
}
