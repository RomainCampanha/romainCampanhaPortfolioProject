import Image from "next/image";
import type { AppLocale } from "@/i18n/routing";
import { photoAlt, type PhotoEntry } from "@/content/photos";

type PhotoGridProps = {
  photos: PhotoEntry[];
  locale: AppLocale;
  /** Nom accessible de la liste (ex. "Photos de Séoul"). */
  label: string;
};

// Grille responsive de photos de voyage (recadrées en 3:4, flou de chargement si dispo).
// TODO (phase suivante) : agrandissement des photos (lightbox).
export function PhotoGrid({ photos, locale, label }: PhotoGridProps) {
  // Desktop : 3 colonnes si ça évite une rangée incomplète (6, 9 photos…), sinon 4.
  const desktopCols = photos.length % 4 !== 0 && photos.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  return (
    <ul aria-label={label} className={`grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 ${desktopCols}`}>
      {photos.map((photo) => (
        <li key={photo.src} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cocoa/10">
          <Image
            src={photo.src}
            alt={photoAlt(photo, locale)}
            fill
            sizes="(min-width: 1280px) 260px, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 50vw"
            placeholder={photo.blurDataURL ? "blur" : "empty"}
            blurDataURL={photo.blurDataURL || undefined}
            className="object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
