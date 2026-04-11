"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * Module-level texture cache shared across all components.
 * Avoids re-loading the same texture across re-mounts and re-renders.
 */
const TEXTURE_CACHE = new Map<string, THREE.Texture>();
const LOADER = new THREE.TextureLoader();

/**
 * Load and cache textures for a list of URLs.
 * Returns the current snapshot of loaded textures (resolves progressively).
 *
 * - Uses a global cache so the same URL is never fetched twice.
 * - Bypasses Suspense (no useLoader) to keep mount/unmount cheap.
 * - Caller can pass an empty array (Shanghai/Tokyo placeholder destinations).
 */
export function usePhotoTextureCache(urls: string[]) {
  const [textures, setTextures] = useState<Map<string, THREE.Texture>>(
    () => new Map()
  );

  useEffect(() => {
    let cancelled = false;
    const next = new Map<string, THREE.Texture>();

    // Seed from cache immediately
    for (const url of urls) {
      const cached = TEXTURE_CACHE.get(url);
      if (cached) next.set(url, cached);
    }
    if (next.size > 0) setTextures(new Map(next));

    // Load anything still missing
    const missing = urls.filter((u) => !TEXTURE_CACHE.has(u));
    if (missing.length === 0) return;

    let pending = missing.length;
    for (const url of missing) {
      LOADER.load(
        url,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          tex.needsUpdate = true;
          TEXTURE_CACHE.set(url, tex);
          next.set(url, tex);
          pending--;
          // Push a fresh snapshot so React re-renders
          setTextures(new Map(next));
        },
        undefined,
        () => {
          // Silent fail — placeholder will show for missing photos
          pending--;
        }
      );
    }

    return () => {
      cancelled = true;
    };
    // Stable URL list join makes the effect re-run only when the actual list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join("|")]);

  return textures;
}

/** Manually evict a texture from the global cache (free GPU memory) */
export function disposePhotoTexture(url: string) {
  const tex = TEXTURE_CACHE.get(url);
  if (tex) {
    tex.dispose();
    TEXTURE_CACHE.delete(url);
  }
}
