"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/components/ui/cx";
import styles from "./BoardingPass.module.css";

// Album photo d'une carte d'embarquement (îlot client) :
// - bouton « Voir les N photos » (disclosure : aria-expanded / aria-controls) qui déplie la
//   grille complète sous la carte ; ouvert d'office si l'URL vise la carte (/hobby#seoul,
//   cf. outil showTrip du chat) ;
// - photo de couverture et vignettes cliquables -> visionneuse (<dialog> modal natif :
//   piège du focus, Échap, retour du focus ; flèches ← → et balayage pour naviguer).
// Les textes arrivent tout traduits du serveur (pas de messages "hobby" côté client).

export type GalleryPhoto = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  alt: string;
};

export type GalleryLabels = {
  /** Nom de la liste et de la visionneuse (ex. « Photos de Séoul »). */
  list: string;
  /** Libellé du bouton fermé / ouvert. */
  show: string;
  hide: string;
  /** Nom accessible de chaque vignette (« Agrandir : … »), dans l'ordre des photos. */
  open: string[];
  /** « Photo 3 sur 8 », dans l'ordre des photos. */
  counter: string[];
  close: string;
  previous: string;
  next: string;
};

type GalleryContextValue = {
  photos: GalleryPhoto[];
  labels: GalleryLabels;
  panelId: string;
  /** Album déplié sous la carte. */
  expanded: boolean;
  toggle: () => void;
  /** Photo affichée dans la visionneuse (null = fermée). */
  current: number | null;
  show: (index: number, opener: HTMLElement) => void;
  step: (delta: number) => void;
  close: () => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

function useGallery(): GalleryContextValue {
  const value = useContext(GalleryContext);
  if (!value) throw new Error("PassGallery: composant hors de <PassGalleryProvider>");
  return value;
}

/* Ancre de l'URL (#seoul), lue sans effet : mise à jour sur hashchange (liens d'ancre,
   retour arrière). Serveur et hydratation : "" puis la vraie valeur juste après. */
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => window.location.hash;
const getServerHash = () => "";

type ProviderProps = {
  /** Id du voyage (= id de la carte) : l'album s'ouvre si l'URL se termine par #id. */
  id: string;
  photos: GalleryPhoto[];
  labels: GalleryLabels;
  children: ReactNode;
};

export function PassGalleryProvider({ id, photos, labels, children }: ProviderProps) {
  const panelId = `${useId()}-album`;
  const targeted = useSyncExternalStore(subscribeHash, getHash, getServerHash) === `#${id}`;
  // Choix explicite du visiteur (bouton) ; sinon, ouvert si la carte est visée par l'URL.
  const [choice, setChoice] = useState<boolean | null>(null);
  const expanded = choice ?? targeted;
  const [current, setCurrent] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const toggle = useCallback(() => setChoice(!expanded), [expanded]);
  const show = useCallback((index: number, opener: HTMLElement) => {
    openerRef.current = opener;
    setCurrent(index);
  }, []);
  const step = useCallback(
    (delta: number) =>
      setCurrent((index) => (index === null ? index : (index + delta + photos.length) % photos.length)),
    [photos.length],
  );
  const close = useCallback(() => {
    setCurrent(null);
    // Retour du focus sur la vignette d'origine (en plus du comportement natif du <dialog>)
    openerRef.current?.focus({ preventScroll: true });
  }, []);

  const value = useMemo(
    () => ({ photos, labels, panelId, expanded, toggle, current, show, step, close }),
    [photos, labels, panelId, expanded, toggle, current, show, step, close],
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

/** Bouton d'argile « Voir les N photos » / « Masquer les photos » (secondaire : carte compacte). */
export function GalleryToggle({ variant, className }: { variant?: "primary" | "secondary"; className?: string }) {
  const { labels, panelId, expanded, toggle } = useGallery();
  return (
    <Button
      variant={variant}
      size="sm"
      iconEnd="chevron-down"
      aria-expanded={expanded}
      aria-controls={panelId}
      onClick={toggle}
      className={cx(styles.toggle, className)}
    >
      {expanded ? labels.hide : labels.show}
    </Button>
  );
}

/** Photo de couverture de la carte : ouvre la visionneuse sur la 1re photo. */
export function GalleryCover({ counter, sizes }: { counter: string; sizes: string }) {
  const { photos, labels, show } = useGallery();
  const photo = photos[0];
  if (!photo) return null;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={labels.open[0]}
      onClick={(event) => show(0, event.currentTarget)}
      className={styles.photoFrame}
    >
      <Image
        src={photo.src}
        alt=""
        fill
        sizes={sizes}
        placeholder={photo.blurDataURL ? "blur" : "empty"}
        blurDataURL={photo.blurDataURL || undefined}
        className={styles.photoImg}
      />
      <span aria-hidden="true" className={styles.counter}>
        <Icon name="camera" size={16} />
        {counter}
      </span>
    </button>
  );
}

/** Album déplié sous la carte : toutes les photos, en vignettes « polaroïd ». */
export function GalleryTray() {
  const { photos, labels, panelId, expanded, show } = useGallery();
  return (
    <div id={panelId} hidden={!expanded} className={styles.tray}>
      <ul aria-label={labels.list} className={styles.trayList}>
        {photos.map((photo, index) => (
          <li key={photo.src}>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={labels.open[index]}
              onClick={(event) => show(index, event.currentTarget)}
              className={styles.thumb}
            >
              <span className={styles.thumbImg}>
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(min-width: 64rem) 180px, (min-width: 34rem) 25vw, 45vw"
                  placeholder={photo.blurDataURL ? "blur" : "empty"}
                  blurDataURL={photo.blurDataURL || undefined}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Visionneuse plein écran (dialog modal natif). */
export function GalleryLightbox() {
  const { photos, labels, current, step, close } = useGallery();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<number | null>(null);
  const titleId = useId();

  // Ouvre / ferme le <dialog> selon l'état (méthode DOM, pas d'état React modifié ici)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (current !== null && !dialog.open) dialog.showModal();
    if (current === null && dialog.open) dialog.close();
  }, [current]);

  const photo = current === null ? undefined : photos[current];
  const single = photos.length < 2;

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (single) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    swipeStart.current = event.pointerType === "mouse" ? null : event.clientX;
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start === null || single) return;
    const delta = event.clientX - start;
    if (Math.abs(delta) > 48) step(delta < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={styles.lightbox}
      onClose={close}
      onKeyDown={onKeyDown}
      // Clic sur le fond (le dialog lui-même, hors de son contenu) : fermeture
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className={styles.lightboxInner}>
        <div className={styles.lightboxBar}>
          <p id={titleId} className={styles.lightboxTitle}>
            {labels.list}
          </p>
          <Button
            size="icon"
            variant="secondary"
            icon="close"
            aria-label={labels.close}
            onClick={() => dialogRef.current?.close()}
            className={styles.lightboxClose}
          />
        </div>

        <figure className={styles.lightboxFigure} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
          {photo ? (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 64rem) 60rem, 100vw"
              placeholder={photo.blurDataURL ? "blur" : "empty"}
              blurDataURL={photo.blurDataURL || undefined}
              className={styles.lightboxImg}
            />
          ) : null}
        </figure>

        <div className={styles.lightboxNav}>
          {single ? null : (
            <Button
              size="icon"
              variant="secondary"
              icon="arrow-right"
              aria-label={labels.previous}
              onClick={() => step(-1)}
              className={styles.prev}
            />
          )}
          <p aria-live="polite" className={styles.lightboxCounter}>
            {current === null ? "" : labels.counter[current]}
          </p>
          {single ? null : (
            <Button size="icon" variant="secondary" icon="arrow-right" aria-label={labels.next} onClick={() => step(1)} />
          )}
        </div>
      </div>
    </dialog>
  );
}
