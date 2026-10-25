import { pick, profile, type TravelId } from "@/content/profile";
import { photos } from "@/content/photos";
import type { AppLocale } from "@/i18n/routing";
import type { Tone } from "@/components/ui/tones";
import type { LevelDef, LevelId } from "./types";

// Niveaux de « La course de Rominou », dérivés de profile.ts (source de vérité) :
// niveau 0 = Genève (profile.location, tutoriel), puis un niveau par voyage, du plus ancien
// au plus récent (profile.travels est trié du plus récent au plus ancien).
// Module SERVEUR (et tests) : il embarque le profil (zod). Les composants client reçoivent
// des LevelCard déjà localisées (comme les libellés de voyage du chat).

export const GENEVA_LEVEL_ID = "geneve" satisfies LevelId;

/** Photo de chaque carte postale (choisie parmi photos.generated.json) ; sinon la 1re du voyage. */
const POSTCARD_PHOTOS: Partial<Record<TravelId, string>> = {
  seoul: "/photos/seoul/03.webp", // ruelle de maisons traditionnelles, la tour au loin
  toronto: "/photos/toronto/03.webp", // les lettres TORONTO
  "brighton-dubrovnik": "/photos/brighton-dubrovnik/04.webp", // selfie au-dessus de Dubrovnik
  paris: "/photos/paris/01.webp", // devant la tour Eiffel
  shanghai: "/photos/shanghai/02.webp", // les quais face à Pudong, la nuit
  tokyo: "/photos/tokyo/10.webp", // la tour de Tokyo illuminée
  berlin: "/photos/berlin/01.webp", // avec sa valise devant la porte de Brandebourg
  busan: "/photos/busan/04.webp", // le quartier de maisons colorées
};

/** Tons des cartes postales (Genève = sauge, convention du design system), puis en alternance. */
const TRIP_TONES: readonly Tone[] = ["lake", "peach", "lilac", "butter"];

/** Voyages dans l'ordre du jeu : du plus ancien au plus récent. */
function tripsInOrder() {
  return [...profile.travels].reverse();
}

export function levelDefs(): LevelDef[] {
  return [
    { id: GENEVA_LEVEL_ID, index: 0 },
    ...tripsInOrder().map((trip, i) => ({ id: trip.id, index: i + 1 })),
  ];
}

export type PostcardPhoto = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  alt: string;
};

/** Ce que l'interface (client) sait d'un niveau : sérialisable et déjà traduit. */
export type LevelCard = LevelDef & {
  /** « Genève », « Séoul », « Brighton & Dubrovnik ». */
  name: string;
  /** « Corée du Sud », « Royaume-Uni & Croatie » (null : inconnu). */
  country: string | null;
  year: number | null;
  tone: Tone;
  /** Photo de la carte postale ; null = carte illustrée (Genève). */
  photo: PostcardPhoto | null;
  /** Légende de la carte postale (game.json). */
  caption: string;
};

export function levelCards(locale: AppLocale, caption: (id: LevelId) => string): LevelCard[] {
  const geneva: LevelCard = {
    id: GENEVA_LEVEL_ID,
    index: 0,
    name: pick(profile.location, locale),
    country: null,
    year: null,
    tone: "sage",
    photo: null,
    caption: caption(GENEVA_LEVEL_ID),
  };
  const trips = tripsInOrder().map((trip, i): LevelCard => {
    const countries = trip.places.flatMap((p) => (p.country ? [pick(p.country, locale)] : []));
    const wanted = POSTCARD_PHOTOS[trip.id];
    const entry = photos.find((p) => p.src === wanted) ?? photos.find((p) => p.destination === trip.id);
    return {
      id: trip.id,
      index: i + 1,
      name: trip.places.map((p) => pick(p.city, locale)).join(" & "),
      country: countries.length ? [...new Set(countries)].join(" & ") : null,
      year: trip.year,
      tone: TRIP_TONES[i % TRIP_TONES.length],
      photo: entry
        ? {
            src: entry.src,
            width: entry.width,
            height: entry.height,
            blurDataURL: entry.blurDataURL,
            alt: pick(entry.alt, locale),
          }
        : null,
      caption: caption(trip.id),
    };
  });
  return [geneva, ...trips];
}
