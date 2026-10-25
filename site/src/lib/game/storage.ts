import { useMemo, useSyncExternalStore } from "react";
import { isE2E } from "./e2e";
import type { GameMode, LevelId } from "./types";

// Progression du jeu, dans le navigateur du visiteur (localStorage, toujours dans un
// try/catch). Sans stockage (navigation privée stricte, données bloquées) : la progression
// vit en mémoire le temps de la visite. Lue sans effet (useSyncExternalStore) : serveur et
// hydratation = rien de débloqué, puis la vraie progression juste après.

const KEY = "rominou:game:v1";
/** Clé séparée en mode test (?e2e=1) : la vraie progression n'est jamais touchée. */
const E2E_KEY = "rominou:game:e2e";

export type SaveData = {
  /** Plus haut niveau débloqué (0 = Genève seulement). */
  unlocked: number;
  /** Meilleur nombre de tampons par niveau. */
  best: Partial<Record<LevelId, number>>;
  /** Cartes postales gagnées (ids de niveau). */
  postcards: LevelId[];
  /** Mode choisi par le visiteur (null = pas encore choisi : suggestion automatique). */
  mode: GameMode | null;
  /** Petits sons (désactivés par défaut). */
  sound: boolean;
};

export const EMPTY_SAVE: SaveData = { unlocked: 0, best: {}, postcards: [], mode: null, sound: false };

let memory: string | null = null;
const listeners = new Set<() => void>();

const storageKey = () => (isE2E() ? E2E_KEY : KEY);

function getSnapshot(): string {
  if (memory !== null) return memory;
  try {
    return window.localStorage.getItem(storageKey()) ?? "";
  } catch {
    return "";
  }
}

const getServerSnapshot = () => "";

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Autre onglet : on relit le stockage.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey()) return;
    memory = null;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Records valides seulement (entiers ≥ 0) : une sauvegarde abîmée n'affiche jamais « NaN ». */
function parseBest(value: unknown): SaveData["best"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, count]) => Number.isSafeInteger(count) && (count as number) >= 0),
  ) as SaveData["best"];
}

export function parseSave(raw: string): SaveData {
  if (!raw) return EMPTY_SAVE;
  try {
    const data = JSON.parse(raw) as Partial<SaveData>;
    return {
      unlocked: Number.isInteger(data.unlocked) && (data.unlocked ?? 0) >= 0 ? (data.unlocked as number) : 0,
      best: parseBest(data.best),
      postcards: Array.isArray(data.postcards) ? data.postcards.filter((id) => typeof id === "string") : [],
      mode: data.mode === "normal" || data.mode === "tranquille" ? data.mode : null,
      sound: data.sound === true,
    };
  } catch {
    return EMPTY_SAVE;
  }
}

/** Met à jour la progression (stockage si possible, mémoire sinon) et prévient les abonnés. */
export function updateSave(update: (save: SaveData) => SaveData): void {
  const next = JSON.stringify(update(parseSave(getSnapshot())));
  memory = next;
  try {
    window.localStorage.setItem(storageKey(), next);
    memory = null;
  } catch {
    // Stockage indisponible : on garde la valeur en mémoire.
  }
  listeners.forEach((listener) => listener());
}

/** Niveau terminé : carte postale gagnée, meilleur score, niveau suivant débloqué. */
export function recordCompletion(levelId: LevelId, index: number, stamps: number, levelCount: number): void {
  updateSave((save) => ({
    ...save,
    unlocked: Math.min(Math.max(save.unlocked, index + 1), levelCount - 1),
    best: { ...save.best, [levelId]: Math.max(save.best[levelId] ?? 0, stamps) },
    postcards: save.postcards.includes(levelId) ? save.postcards : [...save.postcards, levelId],
  }));
}

export function useSave(): SaveData {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => parseSave(raw), [raw]);
}
