// Les 3 pages du site : identifiant, chemin (sans préfixe de langue) et thème.
export const PAGE_IDS = ["pro", "hobby", "chat"] as const;
export type PageId = (typeof PAGE_IDS)[number];

export const PAGE_PATHS = {
  pro: "/",
  hobby: "/hobby",
  chat: "/chat",
} as const satisfies Record<PageId, `/${string}`>;

export type PagePath = (typeof PAGE_PATHS)[PageId];

/**
 * Déduit la page courante d'un pathname sans locale (ex. usePathname() de next-intl).
 * Correspondance EXACTE : une URL inconnue (ex. la 404 /hobby/xyz) renvoie null
 * (thème Pro par défaut, aucun lien de navigation marqué aria-current).
 */
export function pageFromPathname(pathname: string): PageId | null {
  // Tolère un slash final éventuel ("/hobby/" -> "/hobby")
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (normalized === "") return "pro";
  return PAGE_IDS.find((id) => PAGE_PATHS[id] === normalized) ?? null;
}
