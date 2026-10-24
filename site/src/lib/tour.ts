import { PAGE_IDS, type PageId } from "./pages";

// Pages déjà vues pendant la session : carte HUD « Visite du site » (TourCard), affichée dans
// les cadres de Rominou. sessionStorage, lu sans effet (useSyncExternalStore) ; stockage
// indisponible (navigation privée stricte, données de site bloquées) : la carte ne compte
// alors que la page courante.

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
