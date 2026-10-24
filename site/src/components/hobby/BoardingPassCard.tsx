import { useLocale, useTranslations } from "next-intl";
import { pick, profile, type Travel } from "@/content/profile";
import { getPhotos } from "@/content/photos";
import { CameraIcon, PlaneIcon } from "./icons";
import { PhotoGrid } from "./PhotoGrid";
import styles from "./BoardingPass.module.css";

// Un voyage = une carte d'embarquement (id = slug du voyage : /hobby#seoul).
// Rien d'inventé : pas d'aéroports ni de dates de vol, seulement les faits du profil.
export function BoardingPassCard({ travel }: { travel: Travel }) {
  const t = useTranslations("hobby.travels");
  const locale = useLocale();
  const photos = getPhotos(travel.id);
  const place = travel.places.map((p) => pick(p.city, locale)).join(" & ");
  const countries = [
    ...new Set(travel.places.flatMap((p) => (p.country ? [pick(p.country, locale)] : []))),
  ].join(" · ");
  const titleId = `${travel.id}-title`;

  const fields = [
    { term: t("passenger"), value: profile.name },
    ...(travel.year !== null ? [{ term: t("year"), value: String(travel.year) }] : []),
    {
      term: t("photos"),
      value: photos.length > 0 ? t("photoCount", { count: photos.length }) : t("photosSoon"),
    },
  ];

  return (
    <article id={travel.id} aria-labelledby={titleId} className={`scroll-mt-20 ${styles.pass}`}>
      <div className={styles.ticket}>
        <div className={`flex items-center justify-between gap-3 px-5 py-2.5 ${styles.band}`}>
          <p className="font-display text-[0.7rem] font-bold uppercase tracking-[0.25em]">{t("pass")}</p>
          <PlaneIcon size={20} />
        </div>

        <div className="grid gap-5 px-5 pb-7 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">{t("destination")}</p>
            <h3 id={titleId} className="mt-1 break-words font-display text-3xl font-black leading-tight sm:text-4xl">
              {place}
            </h3>
            {countries ? <p className="mt-1 font-semibold text-muted">{countries}</p> : null}
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-3 sm:justify-end">
            {fields.map(({ term, value }) => (
              <div key={term}>
                <dt className="text-[0.7rem] font-semibold uppercase tracking-widest text-accent">{term}</dt>
                <dd className="font-display text-sm font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className={`space-y-5 px-4 pb-5 pt-6 sm:px-6 ${styles.stub}`}>
        {photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            locale={locale}
            label={t("galleryLabel", { place })}
            moreListLabel={t("galleryMoreLabel", { place })}
            showMore={(count) => t("morePhotos", { count })}
            showLess={t("lessPhotos")}
          />
        ) : (
          <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-cocoa/25 p-5">
            <CameraIcon />
            <p>
              <span className="block font-semibold">{t("photosComing")}</span>
              <span className="text-sm text-muted">{t("photosComingHint", { place })}</span>
            </p>
          </div>
        )}

        {travel.anecdotes.map((anecdote) => (
          <div key={anecdote.en} className="rounded-xl border-l-4 border-honey bg-sun/35 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">{t("anecdote")}</p>
            <p className="mt-1 font-medium">{pick(anecdote, locale)}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
