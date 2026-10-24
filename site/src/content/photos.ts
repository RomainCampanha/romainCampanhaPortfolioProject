import type { AppLocale } from "@/i18n/routing";
import type { Localized, TravelId } from "./profile";
import generated from "./photos.generated.json";

// Photos de voyage optimisées. photos.generated.json est (ré)écrit par
// `npm run assets:photos` (scripts/optimize-photos.mjs) : ne pas l'éditer à la main.
// Pas de zod ici pour ne pas l'embarquer dans le bundle client.

export type PhotoEntry = {
  /** Destination (= id de voyage dans profile.travels) */
  destination: TravelId;
  /** Chemin public de la grande image (ex. "/photos/seoul/01.webp") */
  src: string;
  /** Chemin public de la miniature */
  srcSmall: string;
  /** Dimensions intrinsèques de `src` (px) */
  width: number;
  height: number;
  /** Placeholder flou base64 (data:image/...) pour next/image */
  blurDataURL: string;
  alt: Localized;
};

export const photos: readonly PhotoEntry[] = generated as PhotoEntry[];

/** Photos d'une destination, dans l'ordre du fichier généré. */
export function getPhotos(destination: TravelId): PhotoEntry[] {
  return photos.filter((p) => p.destination === destination);
}

/** Texte alternatif localisé. */
export function photoAlt(photo: PhotoEntry, locale: AppLocale): string {
  return photo.alt[locale];
}
