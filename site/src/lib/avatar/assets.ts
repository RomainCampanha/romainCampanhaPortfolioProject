import type { PageId } from "@/lib/pages";
import type { AvatarClip, AvatarOutfit } from "./store";

// Fichiers produits par scripts/build-avatar.mjs (npm run assets:avatar), servis depuis public/
// (modèles : public/models ; posters : public/scenes).

export type ModelQuality = "desktop" | "mobile";

const MODELS: Record<AvatarOutfit, Record<ModelQuality, string>> = {
  default: { desktop: "/models/romain.glb", mobile: "/models/romain-mobile.glb" },
  // Tenue vacances : même maillage, texture 2048 (desktop) ou 1024 (mobile : 4x moins de mémoire GPU).
  vacances: { desktop: "/models/romain-vacances.glb", mobile: "/models/romain-vacances-mobile.glb" },
};

/**
 * Posters transparents (pose idle, cadrage plein pied) rendus avec le look « pâte à modeler »
 * du Canvas (stage-config.json) : affichés pendant le chargement, sans WebGL ou avec
 * prefers-reduced-motion, dans le même cadre et devant le même décor que la 3D.
 */
export const POSTERS: Record<AvatarOutfit, string> = {
  default: "/scenes/rominou-poster.webp",
  vacances: "/scenes/rominou-vacances-poster.webp",
};

/** Clips présents dans chaque modèle (en plus de "idle", la pose neutre). */
export const OUTFIT_CLIPS: Record<AvatarOutfit, readonly AvatarClip[]> = {
  default: ["bow", "wave", "walk", "run"],
  vacances: ["bow"],
};

export function modelUrl(outfit: AvatarOutfit, quality: ModelQuality): string {
  return MODELS[outfit][quality];
}

/** Tenue par défaut d'une page (Hobby = vacances). */
export function defaultOutfitFor(page: PageId): AvatarOutfit {
  return page === "hobby" ? "vacances" : "default";
}
