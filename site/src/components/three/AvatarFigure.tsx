"use client";

import { useId, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { POSTERS } from "@/lib/avatar/assets";
import { feetFraction, FRAMINGS, headFraction, POSTER_SIZE, posterPlacement, STAGE_ASPECT } from "@/lib/avatar/framing";
import { useEffectiveOutfit } from "@/lib/avatar/hooks";
import { avatarStore, useAvatar, type AvatarAnchorVariant } from "@/lib/avatar/store";
import styles from "./AvatarAnchor.module.css";

type AvatarFigureProps = {
  variant: AvatarAnchorVariant;
  /** Texte alternatif traduit. Sans label : décoratif. */
  label?: string;
  /** Décor posé sous les pieds (île, serviette), immobile. */
  underlay?: ReactNode;
  /** Élément qui accompagne Rominou dans son flottement (ex. bulle « … » du chat). */
  extra?: ReactNode;
};

// Rominou dans son cadre : la « boîte de scène » au ratio fixe (2:3) où le poster puis le
// Canvas 3D persistant (AvatarStage) s'affichent, l'ombre de contact et le flottement doux.
// C'est cette boîte qui est enregistrée comme ancre dans le store (slot du Canvas, visibilité).
export function AvatarFigure({ variant, label, underlay, extra }: AvatarFigureProps) {
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

  const framing = FRAMINGS[variant];
  const { scale, offsetTop } = posterPlacement(framing);
  const feet = feetFraction(framing, outfit);
  const head = headFraction(framing, outfit);
  // Pieds dans le cadre (plein pied) : ombre de contact ; buste (chat) : aucune.
  const grounded = feet <= 1;

  return (
    <div
      className={styles.figure}
      data-outfit={outfit}
      style={
        {
          "--feet-frac": feet.toFixed(4),
          "--head-frac": head.toFixed(4),
          "--stage-aspect": STAGE_ASPECT.toFixed(4),
        } as CSSProperties
      }
    >
      {underlay}
      {grounded ? <span aria-hidden="true" className={styles.contact} /> : null}
      <div className={styles.floater}>
        <div
          ref={ref}
          data-avatar-anchor-id={id}
          className={styles.box}
          style={{ "--poster-scale": scale, "--poster-top": offsetTop } as CSSProperties}
          {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
        >
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
        {extra}
      </div>
    </div>
  );
}
