"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { LevelCard } from "@/lib/game/catalog";
import type { LevelId } from "@/lib/game/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Postcard, PostcardPicture, PostStamp } from "./Postcard";
import styles from "./game.module.css";

/**
 * « Mes cartes postales » : visible même avant de jouer. Cartes gagnées = boutons qui ouvrent
 * la carte en grand (<dialog> modal natif : focus piégé, Échap, retour du focus) ; les autres
 * restent en silhouette, sans dévoiler la photo.
 */
export function PostcardCollection({ levels, earned }: { levels: LevelCard[]; earned: LevelId[] }) {
  const t = useTranslations("game.collection");
  const titleId = useId();
  const [open, setOpen] = useState<LevelCard | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const count = levels.filter((level) => earned.includes(level.id)).length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(null);
    openerRef.current?.focus({ preventScroll: true });
  };

  return (
    <section aria-labelledby={titleId} className={styles.collection}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 id={titleId} className="type-title">
          {t("title")}
        </h4>
        <p className="type-kicker text-accent" data-testid="postcard-count">
          {t("count", { count, total: levels.length })}
        </p>
      </div>
      <p className="mt-1 text-sm font-bold text-muted">{t("intro")}</p>

      <ul className={styles.collectionList}>
        {levels.map((level, index) => {
          const unlocked = earned.includes(level.id);
          const tilt = index % 2 === 0 ? -1.2 : 1;
          return (
            <li key={level.id} data-tone={level.tone} style={{ rotate: `${tilt}deg` }}>
              {unlocked ? (
                <button
                  type="button"
                  className={styles.miniCard}
                  aria-label={t("open", { name: level.name })}
                  onClick={(event) => {
                    openerRef.current = event.currentTarget;
                    setOpen(level);
                  }}
                >
                  <span className={styles.miniFront}>
                    <PostcardPicture level={level} sizes="(min-width: 48rem) 12rem, 45vw" />
                  </span>
                  <span className={styles.miniStamp}>
                    <PostStamp level={level} small />
                  </span>
                  <span aria-hidden="true" className={styles.miniName}>
                    {level.name}
                  </span>
                </button>
              ) : (
                <div className={styles.miniCard} data-locked="" role="img" aria-label={t("locked", { name: level.name })}>
                  <span aria-hidden="true" className={styles.miniFront}>
                    <span className={styles.silhouette}>
                      <Icon name="lock" size={22} />
                    </span>
                  </span>
                  <span aria-hidden="true" className={styles.miniName}>
                    {level.name}
                    <span className={styles.miniLocked}>{t("lockedShort")}</span>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        className={styles.postcardDialog}
        aria-label={open ? t("open", { name: open.name }) : undefined}
        onClose={() => open && close()}
        onClick={(event) => {
          // Clic sur le fond (hors de la carte) : fermer.
          if (event.target === event.currentTarget) close();
        }}
      >
        {open ? (
          <div className={styles.dialogBody}>
            <Postcard level={open} />
            <Button size="sm" variant="secondary" icon="close" className="mx-auto mt-5 flex" onClick={close} autoFocus>
              {t("close")}
            </Button>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
