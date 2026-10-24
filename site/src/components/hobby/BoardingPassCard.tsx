import { useLocale, useTranslations } from "next-intl";
import { pick, profile, type Travel } from "@/content/profile";
import { getPhotos, photoAlt } from "@/content/photos";
import { ClayCard } from "@/components/ui/ClayCard";
import { Icon } from "@/components/ui/Icon";
import { Hangul } from "@/components/ui/Hangul";
import type { Tone } from "@/components/ui/tones";
import { PassBarcode, PassStamp } from "./PassDecor";
import {
  GalleryCover,
  GalleryLightbox,
  GalleryToggle,
  GalleryTray,
  PassGalleryProvider,
  type GalleryLabels,
  type GalleryPhoto,
} from "./PassGallery";
import styles from "./BoardingPass.module.css";

/** Encre du tampon et inclinaison, en alternance d'une carte à l'autre. */
const STAMP_TONES: readonly Tone[] = ["lake", "lilac", "sage", "peach"];
const STAMP_TILTS = [-12, 9, -7, 11] as const;

/** Taille de la photo de couverture selon la mise en page de la carte (cf. CSS). */
const COVER_SIZES = "(min-width: 64rem) 256px, (min-width: 40rem) 40vw, 100vw";
const MINI_COVER_SIZES = "128px";

type BoardingPassCardProps = {
  travel: Travel;
  index: number;
  /**
   * Carte compacte (voyages plus anciens) : photo carrée, destination, année, photos et album,
   * tampon en coin ; sans talon ni code-barres. Même id, même album, même visionneuse.
   */
  compact?: boolean;
};

// Un voyage = une carte d'embarquement « cosy » (id = slug du voyage : /hobby#seoul).
// Photo | billet (destination, passager, année, photos, bouton album) | talon (tampon,
// code-barres). Rien d'inventé : pas d'aéroports ni de dates de vol, seulement les faits du profil.
export function BoardingPassCard({ travel, index, compact = false }: BoardingPassCardProps) {
  const t = useTranslations("hobby.travels");
  const locale = useLocale();
  const photos = travel.photos === "available" ? getPhotos(travel.id) : [];
  const cities = travel.places.map((p) => pick(p.city, locale));
  const place = cities.join(" & ");
  const countries = [...new Set(travel.places.flatMap((p) => (p.country ? [pick(p.country, locale)] : [])))];
  // Une seule ville : son nom dans l'écriture d'origine (ex. 서울), s'il est connu
  const native = travel.places.length === 1 ? travel.places[0].nativeName : undefined;
  const titleId = `${travel.id}-title`;
  const year = travel.year !== null ? String(travel.year) : null;
  // Noms longs ou multiples (Brighton & Dubrovnik) : titre un cran plus petit, une ville par ligne
  const long = cities.length > 1 || cities.some((city) => city.length > 9);

  const galleryPhotos: GalleryPhoto[] = photos.map((photo) => ({
    src: photo.src,
    width: photo.width,
    height: photo.height,
    blurDataURL: photo.blurDataURL,
    alt: photoAlt(photo, locale),
  }));
  const labels: GalleryLabels = {
    list: t("galleryLabel", { place }),
    show: t("showPhotos", { count: photos.length }),
    hide: t("hidePhotos"),
    open: galleryPhotos.map((photo) => t("openPhoto", { alt: photo.alt })),
    counter: galleryPhotos.map((_, i) => t("lightbox.counter", { index: i + 1, count: photos.length })),
    close: t("lightbox.close"),
    previous: t("lightbox.previous"),
    next: t("lightbox.next"),
  };

  const stamp = (
    <PassStamp
      id={travel.id}
      top={cities.join(" · ")}
      year={year}
      bottom={countries.length > 0 ? countries.join(" · ") : null}
      tone={STAMP_TONES[index % STAMP_TONES.length]}
      tilt={STAMP_TILTS[index % STAMP_TILTS.length]}
      className={compact ? styles.miniStamp : undefined}
    />
  );
  const title = (
    <h3 id={titleId} className={compact ? styles.miniCity : styles.city} data-long={long || undefined}>
      {cities.map((city, i) => (
        <span key={city} className={styles.cityName}>
          {i > 0 ? "& " : null}
          {city}
        </span>
      ))}
      {native ? <Hangul className={styles.native}>{native.text}</Hangul> : null}
    </h3>
  );

  const fields = [
    ...(compact ? [] : [{ term: t("passenger"), value: profile.name }]),
    ...(year ? [{ term: t("year"), value: year }] : []),
    {
      term: t("photos"),
      value: photos.length > 0 ? t("photoCount", { count: photos.length }) : t("photosSoon"),
    },
  ];

  const extras = (
    <>
      {photos.length > 1 ? <GalleryTray /> : null}

      {travel.anecdotes.map((anecdote) => (
        <div key={anecdote.en} className={styles.anecdote}>
          <p className={styles.anecdoteLabel}>
            <Icon name="sparkle" size={14} />
            {t("anecdote")}
          </p>
          <p className="mt-1.5 font-bold">{pick(anecdote, locale)}</p>
        </div>
      ))}

      {photos.length > 0 ? <GalleryLightbox /> : null}
    </>
  );

  if (compact) {
    return (
      <PassGalleryProvider id={travel.id} photos={galleryPhotos} labels={labels}>
        <article id={travel.id} aria-labelledby={titleId} className={styles.article}>
          <ClayCard className={styles.mini}>
            <div className={styles.miniPhoto}>
              {photos.length > 0 ? (
                <GalleryCover counter={t("photoCounter", { index: 1, count: photos.length })} sizes={MINI_COVER_SIZES} />
              ) : (
                <div className={styles.photoSoon}>
                  <Icon name="camera" size={24} />
                </div>
              )}
            </div>
            <div className={styles.miniMain}>
              <p className={styles.label}>{t("destination")}</p>
              {title}
              {countries.length > 0 ? <p className={styles.miniCountry}>{countries.join(" · ")}</p> : null}
            </div>
            {stamp}
            <dl className={styles.miniFields}>
              {fields.map(({ term, value }) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {photos.length > 1 ? <GalleryToggle variant="secondary" className={styles.miniToggle} /> : null}
          </ClayCard>
          {extras}
        </article>
      </PassGalleryProvider>
    );
  }

  return (
    <PassGalleryProvider id={travel.id} photos={galleryPhotos} labels={labels}>
      <article id={travel.id} aria-labelledby={titleId} className={styles.article}>
        <ClayCard className={styles.card}>
          <div className={styles.photo}>
            {photos.length > 0 ? (
              <GalleryCover counter={t("photoCounter", { index: 1, count: photos.length })} sizes={COVER_SIZES} />
            ) : (
              <div className={styles.photoSoon}>
                <Icon name="camera" size={32} />
                <p>
                  <span className="block font-extrabold">{t("photosComing")}</span>
                  <span className="text-sm text-muted">{t("photosComingHint", { place })}</span>
                </p>
              </div>
            )}
          </div>

          <div className={styles.main}>
            <p className={styles.band}>
              <span>{t("pass")}</span>
              <Icon name="plane" size={22} />
            </p>
            <p className={styles.label}>{t("destination")}</p>
            {title}
            {countries.length > 0 ? <p className={styles.country}>{countries.join(" · ")}</p> : null}

            <dl className={styles.fields}>
              {fields.map(({ term, value }) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            {photos.length > 1 ? <GalleryToggle /> : null}
          </div>

          <div className={styles.stub}>
            {stamp}
            <PassBarcode seed={travel.id} />
          </div>
        </ClayCard>
        {extras}
      </article>
    </PassGalleryProvider>
  );
}
