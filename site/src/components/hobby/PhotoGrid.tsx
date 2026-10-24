import Image from "next/image";
import type { AppLocale } from "@/i18n/routing";
import { photoAlt, type PhotoEntry } from "@/content/photos";

/** Au-delà de PREVIEW + 1 photos, seules les PREVIEW premières sont affichées d'office. */
const PREVIEW = 6;

type PhotoGridProps = {
  photos: PhotoEntry[];
  locale: AppLocale;
  /** Nom accessible de la liste (ex. "Photos de Séoul"). */
  label: string;
  /** Nom accessible de la liste repliée (ex. "Autres photos de Séoul"). */
  moreListLabel: string;
  /** Libellé du bouton qui déplie le reste (ex. "Voir les 8 autres photos"). */
  showMore: (count: number) => string;
  /** Libellé du bouton une fois déplié. */
  showLess: string;
};

/** Colonnes selon le nombre de photos (évite les rangées presque vides). */
function gridColumns(count: number): string {
  if (count <= 2) return "grid-cols-2 sm:max-w-md";
  if (count === 4) return "grid-cols-2 sm:grid-cols-4";
  if (count === 7 || count === 8) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  return "grid-cols-2 sm:grid-cols-3";
}

// Grille responsive de photos de voyage (recadrées en 3:4, flou de chargement si dispo).
// Les gros albums sont repliés : les PREVIEW premières photos, puis un <details> natif
// (sans JS ; les images repliées ne sont pas chargées tant qu'on ne déplie pas).
// TODO (phase suivante) : agrandissement des photos (lightbox).
export function PhotoGrid({ photos, locale, label, moreListLabel, showMore, showLess }: PhotoGridProps) {
  const collapsible = photos.length > PREVIEW + 1;
  const visible = collapsible ? photos.slice(0, PREVIEW) : photos;
  const hidden = collapsible ? photos.slice(PREVIEW) : [];
  const columns = collapsible ? gridColumns(PREVIEW) : gridColumns(photos.length);

  return (
    <div>
      <PhotoList photos={visible} locale={locale} label={label} columns={columns} />
      {hidden.length > 0 ? (
        <details className="group mt-3">
          <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-cocoa/25 bg-white/60 px-4 py-2 text-sm font-semibold transition-colors hover:border-cocoa/50 hover:bg-white [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{showMore(hidden.length)}</span>
            <span className="hidden group-open:inline">{showLess}</span>
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <PhotoList photos={hidden} locale={locale} label={moreListLabel} columns={columns} className="mt-3" />
        </details>
      ) : null}
    </div>
  );
}

function PhotoList({
  photos,
  locale,
  label,
  columns,
  className = "",
}: {
  photos: PhotoEntry[];
  locale: AppLocale;
  label: string;
  columns: string;
  className?: string;
}) {
  return (
    <ul aria-label={label} className={`grid gap-2 sm:gap-3 ${columns} ${className}`}>
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
