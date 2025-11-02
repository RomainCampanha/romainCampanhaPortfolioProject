// app/hooks/useScrollProgress.ts
"use client";
import { useEffect, useState } from "react";

export function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const vh = Math.max(window.innerHeight, 1);
      setP(Math.min(1, Math.max(0, y / vh)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return p;
}
