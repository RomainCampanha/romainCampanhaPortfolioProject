import type { PageId } from "@/lib/pages";
import type { AvatarClip, AvatarOutfit } from "./store";

// Fichiers produits par scripts/build-avatar.mjs (npm run assets:avatar), servis depuis public/.

export type ModelQuality = "desktop" | "mobile";

const MODELS: Record<AvatarOutfit, Record<ModelQuality, string>> = {
  default: { desktop: "/models/romain.glb", mobile: "/models/romain-mobile.glb" },
  // Tenue vacances : même maillage, texture 2048 (desktop) ou 1024 (mobile : 4x moins de mémoire GPU).
  vacances: { desktop: "/models/romain-vacances.glb", mobile: "/models/romain-vacances-mobile.glb" },
};

export const POSTERS: Record<AvatarOutfit, string> = {
  default: "/models/romain-poster.webp",
  vacances: "/models/romain-vacances-poster.webp",
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
