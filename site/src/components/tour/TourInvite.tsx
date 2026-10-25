"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { tourStore } from "@/lib/tour";
import { preloadTourOverlay } from "./preload";
import { useTour } from "./useTour";
import styles from "./TourInvite.module.css";

type TourInviteProps = {
  /** « Je te fais visiter ? » */
  question: string;
  /** « C'est parti ! » */
  start: string;
  /** « Je préfère lire » */
  decline: string;
  /** Réponse de Rominou au refus (la carte « Visite du site » reste là). */
  declined: string;
};

// Invitation de Rominou dans sa bulle du hero Pro : lancer la visite guidée ou lire seul.
// Jamais de lancement automatique. Affichée tant que la visite n'a jamais été lancée.
export function TourInvite({ question, start, decline, declined }: TourInviteProps) {
  const status = useTour((s) => s.status);
  const isDeclined = useTour((s) => s.declined);
  const reply = useRef<HTMLParagraphElement>(null);

  if (status !== "idle") return null;
  if (isDeclined) {
    return (
      <p ref={reply} tabIndex={-1} className={styles.reply}>
        {declined}
      </p>
    );
  }

  return (
    <div className={styles.invite}>
      <p className={styles.question}>{question}</p>
      <div className={styles.actions}>
        <Button
          size="sm"
          icon="sparkle"
          onPointerEnter={preloadTourOverlay}
          onFocus={preloadTourOverlay}
          onClick={() => tourStore.start()}
          className={styles.button}
        >
          {start}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            tourStore.decline();
            // Le bouton disparaît : le focus passe à la réponse de Rominou
            requestAnimationFrame(() => reply.current?.focus({ preventScroll: true }));
          }}
          className={styles.button}
        >
          {decline}
        </Button>
      </div>
    </div>
  );
}
