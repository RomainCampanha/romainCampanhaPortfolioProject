"use client";

import { useId, useLayoutEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { POSTERS } from "@/lib/avatar/assets";
import { FRAMINGS, POSTER_SIZE, posterPlacement, STAGE_ASPECT, STAGE_ASPECT_CSS } from "@/lib/avatar/framing";
import { useEffectiveOutfit } from "@/lib/avatar/hooks";
import { avatarStore, useAvatar, type AvatarAnchorVariant } from "@/lib/avatar/store";
import styles from "./AvatarAnchor.module.css";

type AvatarAnchorProps = {
  /** hero = grand, plein pied (Pro) ; column = colonne latérale (Hobby) ; chat = buste, à côté du chat. */
  variant: AvatarAnchorVariant;
  /**
   * Hauteur : définie par .avatar-anchor[data-avatar-anchor=…] (globals.css) ou par className.
   * Elle doit être explicite (container-type: size).
   */
  className?: string;
  /** Texte alternatif traduit (ex. "Rominou, l'avatar 3D de Romain"). Sans label : décoratif. */
  label?: string;
};

// Emplacement réservé où Rominou apparaît sur une page. Affiche le poster (image fixe) tant
// que la 3D n'est pas prête — et en permanence sans WebGL ou avec prefers-reduced-motion.
// Le Canvas persistant (AvatarStage) se loge dans le slot de l'ancre enregistrée en dernier.
export function AvatarAnchor({ variant, className, label }: AvatarAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const outfit = useEffectiveOutfit();
  // La 3D de CETTE ancre est affichée, dans la bonne tenue -> le poster s'efface.
  const show3d = useAvatar(
    (s) =>
      s.status === "ready" &&
      s.readyOutfit === outfit &&
      s.anchor?.element.dataset.avatarAnchorId === id,
  );

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    return avatarStore.registerAnchor(element, variant);
  }, [variant]);

  const { scale, offsetTop } = posterPlacement(FRAMINGS[variant]);
  const boxStyle = {
    aspectRatio: STAGE_ASPECT_CSS,
    height: `min(100cqh, ${(100 / STAGE_ASPECT).toFixed(2)}cqw)`,
    "--poster-scale": scale,
    "--poster-top": offsetTop,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      data-avatar-anchor={variant}
      data-avatar-anchor-id={id}
      className={["avatar-anchor", styles.anchor, className].filter(Boolean).join(" ")}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <div className={styles.box} style={boxStyle}>
        <Image
          src={POSTERS[outfit]}
          alt=""
          width={POSTER_SIZE.width}
          height={POSTER_SIZE.height}
          unoptimized
          loading="eager"
          fetchPriority={variant === "hero" ? "high" : "auto"}
          draggable={false}
          className={styles.poster}
          data-hidden={show3d}
        />
        {/* Le Canvas 3D est inséré ici par AvatarStage (hors React). */}
        <div data-avatar-slot="" className={styles.slot} />
      </div>
    </div>
  );
}
