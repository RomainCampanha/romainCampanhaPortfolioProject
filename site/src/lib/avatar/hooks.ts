import { useSyncExternalStore } from "react";
import { usePathname } from "@/i18n/navigation";
import { pageFromPathname } from "@/lib/pages";
import { defaultOutfitFor } from "./assets";
import { useAvatar, type AvatarOutfit } from "./store";

// Hooks client de l'avatar.

/**
 * Tenue à afficher pour la page courante. Déduite de l'URL (donc correcte dès le rendu
 * serveur, sans flash de poster), puis de l'éventuel setOutfit() une fois le store synchronisé.
 */
export function useEffectiveOutfit(): AvatarOutfit {
  const page = pageFromPathname(usePathname()) ?? "pro";
  return useAvatar((s) => (s.page === page ? s.outfit : defaultOutfitFor(page)));
}

/** Media query réactive (false côté serveur). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
