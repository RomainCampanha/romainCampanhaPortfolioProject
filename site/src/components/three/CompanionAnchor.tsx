"use client";

import { cx } from "@/components/ui/cx";
import type { AvatarScene } from "@/lib/avatar/scenes";
import { AvatarFigure } from "./AvatarFigure";
import { SceneDecor } from "./scenes/SceneDecor";
import styles from "./AvatarAnchor.module.css";

type CompanionAnchorProps = {
  /** Décor de la page courante (Genève, plage, ciel du soir). */
  scene: AvatarScene;
  /** Taille du cadre (obligatoire : le cadre est un conteneur de requêtes « size »). */
  className?: string;
};

// Cadre « compagnon » de la visite guidée : la même fenêtre en argile que les cadres des pages,
// en petit, avec Rominou en buste. Ancre prioritaire (avatarStore.registerAnchor) : le Canvas
// persistant y est déplacé tant qu'elle est montée (aucun rechargement du modèle), puis revient
// au cadre de la page. Décoratif : la bulle de la visite porte le texte.
export function CompanionAnchor({ scene, className }: CompanionAnchorProps) {
  return (
    <div data-avatar-anchor="companion" data-scene={scene} className={cx(styles.frame, className)}>
      <div className={styles.window}>
        <div className={styles.ground}>
          {scene !== "none" ? (
            <div aria-hidden="true" className={styles.decor}>
              <SceneDecor scene={scene} />
            </div>
          ) : null}
          <AvatarFigure variant="companion" />
        </div>
      </div>
    </div>
  );
}
