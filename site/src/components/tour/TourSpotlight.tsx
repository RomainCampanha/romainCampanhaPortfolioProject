"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { paddingInsets, waitForElement } from "./dom";
import styles from "./Tour.module.css";

type Box = { top: number; left: number; width: number; height: number };

/** Espace entre la section et l'anneau (px), marge minimale au bord de l'écran. */
const PAD = 12;
const EDGE = 6;

// Anneau « projecteur » cosy autour de la section commentée par Rominou : trait pointillé pêche,
// halo beurre, étiquette avec le titre de l'étape. Purement décoratif (la bulle porte le texte),
// sans voile ni blocage : la page reste utilisable. Positionné dans la racine thémée, suit la
// section (redimensionnement, contenu qui se charge au-dessus).
type TourSpotlightProps = {
  selector: string;
  label: string;
  /** Étiquette au bord haut (défaut) ou bas de l'anneau. */
  tag?: "top" | "bottom";
};

export function TourSpotlight({ selector, label, tag = "top" }: TourSpotlightProps) {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let element: Element | null = null;
    let frame = 0;
    let observer: ResizeObserver | undefined;

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!element) return;
        const root = element.closest(".theme-root") ?? document.documentElement;
        const origin = root.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        const inset = paddingInsets(element);
        const left = Math.max(EDGE, rect.left - origin.left - PAD);
        const right = Math.min(root.clientWidth - EDGE, rect.right - origin.left + PAD);
        setBox({
          top: rect.top - origin.top + inset.top - PAD,
          left,
          width: Math.max(0, right - left),
          height: Math.max(0, rect.height - inset.top - inset.bottom) + PAD * 2,
        });
      });
    };

    void waitForElement(selector, controller.signal).then((found) => {
      if (!found || controller.signal.aborted) return;
      element = found;
      measure();
      observer = new ResizeObserver(measure);
      observer.observe(found);
      observer.observe(document.body);
    });
    window.addEventListener("resize", measure);
    return () => {
      controller.abort();
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [selector]);

  if (!box) return null;
  return (
    <div
      aria-hidden="true"
      data-tour-spotlight=""
      data-tag={tag}
      className={styles.ring}
      style={{ top: box.top, left: box.left, width: box.width, height: box.height } as CSSProperties}
    >
      <span className={styles.ringTag}>
        <Icon name="sparkle" />
        {label}
      </span>
    </div>
  );
}
