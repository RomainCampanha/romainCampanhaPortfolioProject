"use client";
import { useEffect, useState, RefObject } from "react";

/** Mesure un progress 0..1 du scroll d'un élément (via sa ref). */
export function useElementScrollProgress(ref: RefObject<HTMLElement>) {
  const [p, setP] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const total = Math.max(1, el.scrollHeight - el.clientHeight);
      const y = el.scrollTop;
      setP(Math.min(1, Math.max(0, y / total)));
    };

    onScroll(); // calcule une 1ère fois
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]); // <-- quand ref.current devient dispo, on (ré)attache

  return p;
}
