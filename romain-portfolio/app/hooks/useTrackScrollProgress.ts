"use client";
import { useEffect, useState, RefObject } from "react";

/** Calcule un progress 0..1 pendant qu'on scrolle la piste (trackRef). */
export function useTrackScrollProgress(trackRef: RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);

  useEffect(() => {
    const update = () => {
      const track = trackRef.current;
      if (!track) return;
      const trackTop = track.offsetTop; // position de la piste dans le document
      const total = Math.max(1, track.offsetHeight - window.innerHeight); // partie "scrollable" de la piste
      const y = window.scrollY - trackTop; // position de scroll DANS la piste
      const progress = Math.min(1, Math.max(0, y / total));
      setP(progress);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [trackRef]);

  return p;
}
