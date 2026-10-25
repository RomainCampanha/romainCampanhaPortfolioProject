"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { pageFromPathname } from "@/lib/pages";
import { TOUR_STEPS, tourStore } from "@/lib/tour";
import type { BubbleTail } from "@/components/ui/SpeechBubble";
import { useTour } from "./useTour";

/** Queue de la bulle (mêmes valeurs que la bulle remplacée, cf. SpeechBubble). */
export type TourSlotTail = {
  tail: BubbleTail;
  tailOffset?: string;
  tailLg?: BubbleTail;
  tailOffsetLg?: string;
};

type TourSlotProps = TourSlotTail & {
  /** Bulle habituelle de Rominou (rendue côté serveur). */
  children: ReactNode;
  /** Placement de l'emplacement (mêmes classes que la bulle remplacée). */
  className?: string;
};

// Emplacement de la bulle de la visite dans le hero Pro : tant qu'une étape « hero » est
// affichée (et l'interface de la visite chargée), la bulle habituelle cède la place à celle de
// la visite (TourOverlay y fait un portail) ; Rominou reste sur son île. Sinon : la bulle
// habituelle, telle quelle.
export function TourSlot({ children, className, tail, tailOffset, tailLg, tailOffsetLg }: TourSlotProps) {
  const page = pageFromPathname(usePathname());
  const docked = useTour((s) => {
    const config = TOUR_STEPS[s.step];
    return (
      s.status === "active" &&
      s.overlay &&
      (s.pending === null || s.pending === page) &&
      config.dock === "hero" &&
      config.page === page
    );
  });
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!docked) return;
    tourStore.setSlot(ref.current);
    return () => tourStore.setSlot(null);
  }, [docked]);

  if (!docked) return children;
  // La queue est lue par la bulle de la visite (dataset de l'emplacement)
  return (
    <div
      ref={ref}
      data-tour-slot="hero"
      data-tail={tail}
      data-tail-offset={tailOffset}
      data-tail-lg={tailLg}
      data-tail-offset-lg={tailOffsetLg}
      className={className}
    />
  );
}
