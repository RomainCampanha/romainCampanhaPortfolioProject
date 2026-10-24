import type { AvatarScene } from "@/lib/avatar/scenes";
import { GenevaDecor, GenevaIsland } from "./Geneva";
import { BeachDecor, BeachTowel } from "./Beach";
import { DuskDecor } from "./Dusk";

// Décors des cadres de Rominou (DA Cosy) : SVG inline et CSS, décoratifs (aria-hidden posé par
// le cadre), couleurs = tokens du design system (scenes.module.css). Chaque élément est placé en
// % de la scène (sous la bulle éventuelle) : le décor s'adapte à tous les formats.

/** Décor de la scène (astres, nuages, paysage), derrière Rominou ; le ciel est le fond du cadre. */
export function SceneDecor({ scene }: { scene: AvatarScene }) {
  switch (scene) {
    case "geneva":
      return <GenevaDecor />;
    case "beach":
      return <BeachDecor />;
    case "dusk":
      return <DuskDecor />;
    default:
      return null;
  }
}

/** Sol sous les pieds de Rominou (île du Léman, serviette de plage), immobile. */
export function SceneUnderlay({ scene }: { scene: AvatarScene }) {
  switch (scene) {
    case "geneva":
      return <GenevaIsland />;
    case "beach":
      return <BeachTowel />;
    default:
      return null;
  }
}
