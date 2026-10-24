"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAvatar } from "@/lib/avatar/store";

// Le Canvas ne rend que si l'onglet est visible, l'ancre proche du viewport et le rendu
// non suspendu (avatarStore.setSuspended, ex. pendant le jeu).

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
  const suspended = useAvatar((s) => s.suspended);
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

  return visible && !suspended && element !== null && intersecting;
}
