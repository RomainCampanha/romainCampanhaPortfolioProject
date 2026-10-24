"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// Le Canvas ne rend que si l'onglet est visible ET l'ancre proche du viewport.

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export function useStageActive(element: HTMLElement | null): boolean {
  const visible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => false,
  );
  const [intersecting, setIntersecting] = useState(true);

  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry?.isIntersecting ?? true),
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return visible && element !== null && intersecting;
}
