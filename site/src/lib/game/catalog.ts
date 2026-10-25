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

export type PrintShape = "portrait" | "landscape";

/**
 * Photo de chaque carte postale (choisie parmi photos.generated.json : Romain ET un repère de la
 * ville quand une photo les réunit) et son point d'intérêt (`focus`, valeur CSS object-position).
 * La photo est tirée sur la carte comme un polaroïd (4:5 en portrait, 4:3 en paysage) : du
 * format de la photo par défaut, donc presque entière (`shape` force l'autre format quand un
 * recadrage sert mieux le sujet). Le point d'intérêt règle ce recadrage et celui des vignettes
 * 4:3 de la collection, qui ne gardent qu'un peu plus de la moitié d'un portrait. Les légendes
 * de game.json décrivent CES photos : les changer ensemble. Sans entrée : 1re photo du voyage.
 */
const POSTCARD_PHOTOS: Partial<Record<TravelId, { src: string; focus: string; shape?: PrintShape }>> = {
  // Romain dans une ruelle de hanoks, la tour de Séoul au bout de la rue
  seoul: { src: "/photos/seoul/03.webp", focus: "50% 32%" },
  // Les lettres TORONTO (paysage : rien de coupé ; aucune photo n'a Romain avec un repère lisible)
  toronto: { src: "/photos/toronto/03.webp", focus: "50% 50%" },
  // Selfie au-dessus de la vieille ville de Dubrovnik
  "brighton-dubrovnik": { src: "/photos/brighton-dubrovnik/04.webp", focus: "50% 50%" },
  // Bras croisés, la tour Eiffel derrière lui
  paris: { src: "/photos/paris/01.webp", focus: "50% 58%" },
  // Les quais face à Pudong, la nuit
  shanghai: { src: "/photos/shanghai/02.webp", focus: "50% 30%" },
  // Devant la tour de Tokyo illuminée
  tokyo: { src: "/photos/tokyo/10.webp", focus: "50% 12%" },
  // Avec sa valise devant la porte de Brandebourg
  berlin: { src: "/photos/berlin/01.webp", focus: "50% 45%" },
  // Assis dans un grand cadre au milieu des fleurs, la mer et un pont au loin : photo paysage
  // recadrée en portrait sur Romain et le pont (les deux plus grands sur la carte)
  busan: { src: "/photos/busan/01.webp", focus: "40% 50%", shape: "portrait" },
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
  /** Point d'intérêt (CSS object-position, ex. "50% 40%") pour les recadrages. */
  focus: string;
  /** Format du tirage polaroïd sur la carte. */
  shape: PrintShape;
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
    const entry = photos.find((p) => p.src === wanted?.src) ?? photos.find((p) => p.destination === trip.id);
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
            focus: entry.src === wanted?.src ? wanted.focus : "50% 40%",
            shape:
              (entry.src === wanted?.src ? wanted.shape : undefined) ??
              (entry.height > entry.width * 1.05 ? "portrait" : "landscape"),
          }
        : null,
      caption: caption(trip.id),
    };
  });
  return [geneva, ...trips];
}
