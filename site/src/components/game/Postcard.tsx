"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { LevelCard } from "@/lib/game/catalog";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/components/ui/cx";
import { GenevaDecor } from "@/components/three/scenes/Geneva";
import styles from "./game.module.css";

// Carte postale d'une étape : recto (photo du voyage, ou Genève illustrée avec le décor SVG
// du cadre de Rominou de la page Pro) + verso (timbre avec l'année, cachet, légende, signature).

export function Postcard({ level, className, tilt = 0 }: { level: LevelCard; className?: string; tilt?: number }) {
  const t = useTranslations("game.postcard");
  return (
    <figure
      className={cx(styles.postcard, className)}
      data-tone={level.tone}
      style={{ "--card-tilt": `${tilt}deg` } as CSSProperties}
    >
      <div className={styles.cardFront}>
        <PostcardPicture level={level} sizes="(min-width: 48rem) 18rem, 45vw" />
        <p className={styles.greetings}>
          <span className={styles.greetingsSmall}>{t("greetings")}</span>
          <span className={styles.greetingsCity}>{level.name}</span>
        </p>
      </div>
      <div className={styles.cardBack}>
        <PostStamp level={level} />
        <figcaption className={styles.caption}>{level.caption}</figcaption>
        <div className={styles.cardFoot}>
          <span aria-hidden="true" className={styles.postmark}>
            <span>{level.name}</span>
            <span>{level.year ?? t("start")}</span>
          </span>
          <div className={styles.sign}>
            <p className={styles.signature}>— {t("signature")}</p>
            <span aria-hidden="true" className={styles.addressLines} />
          </div>
        </div>
      </div>
    </figure>
  );
}

/** Recto : la photo du voyage (ou Genève illustrée). */
export function PostcardPicture({ level, sizes, className }: { level: LevelCard; sizes: string; className?: string }) {
  const t = useTranslations("game.postcard");
  if (!level.photo) {
    return (
      <div role="img" aria-label={t("illustration")} className={cx(styles.genevaArt, className)}>
        <GenevaDecor />
      </div>
    );
  }
  return (
    <Image
      src={level.photo.src}
      alt={level.photo.alt}
      fill
      sizes={sizes}
      placeholder="blur"
      blurDataURL={level.photo.blurDataURL}
      className={cx(styles.cardPhoto, className)}
    />
  );
}

/** Timbre dentelé : année du voyage (ou « Départ » pour Genève). */
export function PostStamp({ level, small = false }: { level: LevelCard; small?: boolean }) {
  const t = useTranslations("game.postcard");
  const year = level.year ? String(level.year) : t("start");
  return (
    <span
      role="img"
      aria-label={`${t("stamp", { name: level.name })}, ${year}`}
      className={styles.stamp}
      data-tone={level.tone}
      data-size={small ? "sm" : undefined}
    >
      <span aria-hidden="true" className={styles.stampInner}>
        <Icon name="plane" size={small ? 12 : 18} />
        <span className={styles.stampYear}>{year}</span>
      </span>
    </span>
  );
}
