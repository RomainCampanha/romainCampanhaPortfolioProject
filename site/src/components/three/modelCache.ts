import { useGLTF } from "@react-three/drei";
import type { Material, Mesh, Object3D, Texture } from "three";

// Modèles chargés par useGLTF (cache global) : gardés tant que le Canvas vit, pour passer
// d'une tenue à l'autre sans re-télécharger ; libérés (GPU + cache) quand il est démonté.

const loaded = new Map<string, Object3D>();

export function rememberModel(url: string, scene: Object3D) {
  loaded.set(url, scene);
}

export function disposeModels() {
  for (const [url, scene] of loaded) {
    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if ((value as Texture | null)?.isTexture) (value as Texture).dispose();
        }
        material.dispose();
      }
    });
    useGLTF.clear(url);
  }
  loaded.clear();
}
