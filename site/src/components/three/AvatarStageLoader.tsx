"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supportsWebGL2 } from "@/lib/avatar/device";
import { usePrefersReducedMotion } from "@/lib/avatar/hooks";
import { avatarStore } from "@/lib/avatar/store";

// next/dynamic avec ssr:false n'est autorisé que dans un composant client :
// ce wrapper permet de monter <AvatarStage /> depuis le layout (Server Component).
// Le code 3D (three.js, R3F : ~270 Ko gzip) n'est téléchargé QUE si la 3D peut s'afficher :
// WebGL 2 disponible et pas de prefers-reduced-motion. Sinon, poster permanent.
// <Suspense> : borne le "bailout" vers le rendu client (requis avec Cache Components).
const AvatarStage = dynamic(() => import("./AvatarStage"), { ssr: false });

/** Test WebGL 2 différé au premier moment d'inactivité (null = pas encore testé). */
function useWebGL2(): boolean | null {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useEffect(() => {
    const run = () => setWebgl(supportsWebGL2());
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 200);
    return () => clearTimeout(id);
  }, []);
  return webgl;
}

export function AvatarStageLoader() {
  const reducedMotion = usePrefersReducedMotion();
  const webgl = useWebGL2();
  const enabled = webgl === true && !reducedMotion;
  const unavailable = webgl === false || reducedMotion;

  useEffect(() => {
    if (unavailable) avatarStore.setStatus("unavailable");
  }, [unavailable]);

  if (!enabled) return null;
  return (
    <Suspense fallback={null}>
      <AvatarStage />
    </Suspense>
  );
}
