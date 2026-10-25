"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { LevelCard } from "@/lib/game/catalog";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/components/ui/cx";
import { GenevaDecor } from "@/components/three/scenes/Geneva";
import styles from "./game.module.css";

// Carte postale d'une étape : recto (la photo du voyage tirée en polaroïd, scotchée et un peu
// penchée, « Bons baisers de… » sur sa marge ; Genève illustrée avec le décor SVG du cadre de
// Rominou de la page Pro) + verso (timbre avec l'année, cachet, légende, signature).
// Le tirage a le format de la photo (portrait pour les photos d'iPhone ; cf. catalog.ts) : la
// photo reste presque entière, Romain et le monument de la ville ne sont pas coupés.

export function Postcard({ level, className, tilt = 0 }: { level: LevelCard; className?: string; tilt?: number }) {
  const t = useTranslations("game.postcard");
  return (
    <figure
      className={cx(styles.postcard, className)}
      data-tone={level.tone}
      data-print={level.photo?.shape ?? "landscape"}
      style={
        {
          "--card-tilt": `${tilt}deg`,
          // Tirages penchés d'un côté puis de l'autre, d'une étape à l'autre.
          "--print-tilt": level.index % 2 === 0 ? "-2.5deg" : "2deg",
        } as CSSProperties
      }
    >
      <div className={styles.cardFront}>
        <div className={styles.print}>
          <span aria-hidden="true" className={styles.tape} />
          <div className={styles.printPhoto}>
            <PostcardPicture level={level} sizes="(min-width: 48rem) 16rem, 40vw" />
          </div>
          <p className={styles.greetings}>
            <span className={styles.greetingsSmall}>{t("greetings")}</span>
            <span className={styles.greetingsCity}>{level.name}</span>
          </p>
        </div>
      </div>
      <div className={styles.cardBack}>
        <div className={styles.message}>
          <PostStamp level={level} />
          <figcaption className={styles.caption}>{level.caption}</figcaption>
          <p className={styles.signature}>— {t("signature")}</p>
        </div>
        {/* Bas de la carte : cachet de la poste et lignes d'adresse (décor) */}
        <div aria-hidden="true" className={styles.cardFoot}>
          <span className={styles.postmark}>
            <span>{level.name}</span>
            <span>{level.year ?? t("start")}</span>
          </span>
          <span className={styles.addressLines} />
        </div>
      </div>
    </figure>
  );
}

/** Photo du voyage (ou Genève illustrée), recadrée sur son point d'intérêt. */
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
      style={{ objectPosition: level.photo.focus }}
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
