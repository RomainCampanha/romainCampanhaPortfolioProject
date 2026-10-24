"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Object3D, SkinnedMesh } from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AvatarController, type AvatarInput } from "@/lib/avatar/controller";
import { applyStageLook } from "@/lib/avatar/look";
import { avatarStore, type AvatarOutfit } from "@/lib/avatar/store";
import { rememberModel } from "./modelCache";

type AvatarModelProps = {
  url: string;
  outfit: AvatarOutfit;
  /** Direction du regard (pointeur), lue à chaque frame ; null = droit devant. */
  getLook: () => AvatarInput["look"];
};

// Rominou dans le Canvas : charge le GLB (meshopt), le rend mat (look « pâte à modeler »),
// clone la scène (squelette propre à cette instance), branche le contrôleur d'animation sur
// le store et signale "ready" une fois les shaders compilés.
export function AvatarModel({ url, outfit, getLook }: AvatarModelProps) {
  // Pas de Draco (fichiers meshopt) ; décodeur meshopt inclus (WASM inline).
  const gltf = useGLTF(url, false, true);
  const get = useThree((state) => state.get);
  const controllerRef = useRef<AvatarController | null>(null);

  // Clone : géométries / matériaux / texture partagés avec le cache, os indépendants.
  const model = useMemo(() => {
    applyStageLook(gltf.scene);
    const root = cloneSkinned(gltf.scene);
    root.traverse((object: Object3D) => {
      // Une seule mesh, animée : pas de frustum culling (bounding sphere figée en T-pose).
      if ((object as SkinnedMesh).isSkinnedMesh) object.frustumCulled = false;
    });
    return root;
  }, [gltf.scene]);

  useLayoutEffect(() => {
    rememberModel(url, gltf.scene);
    const controller = new AvatarController(model, gltf.animations);
    controllerRef.current = controller;

    // Clips demandés via le store (play(), tool calls du chat…).
    let lastNonce = -1;
    const syncClip = () => {
      const { clip, clipNonce } = avatarStore.getState();
      if (clipNonce === lastNonce) return;
      lastNonce = clipNonce;
      const finish = () => avatarStore.finishClip(clipNonce);
      const started = controller.play(clip, finish);
      // Clip absent de ce modèle (ex. walk en tenue vacances) : Rominou reste en idle.
      if (!started && clip !== null) finish();
    };
    syncClip();
    const unsubscribe = avatarStore.subscribe(syncClip);

    // Compile les shaders hors écran, puis signale que la 3D peut remplacer le poster.
    let cancelled = false;
    const { gl, camera, scene } = get();
    gl.compileAsync(model, camera, scene)
      .catch(() => undefined)
      .then(() => {
        requestAnimationFrame(() => {
          if (!cancelled) avatarStore.setStatus("ready", outfit);
        });
      });

    return () => {
      cancelled = true;
      unsubscribe();
      controller.dispose();
      controllerRef.current = null;
      if (avatarStore.getState().readyOutfit === outfit) avatarStore.setStatus("idle");
      // Texture d'os propre au clone (géométrie et matériaux restent dans le cache).
      model.traverse((object: Object3D) => {
        if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.dispose();
      });
    };
  }, [get, gltf, model, outfit, url]);

  useFrame((_, delta) => {
    controllerRef.current?.update(delta, {
      speaking: avatarStore.getState().speaking,
      look: getLook(),
      reducedMotion: false,
    });
  });

  return <primitive object={model} />;
}
