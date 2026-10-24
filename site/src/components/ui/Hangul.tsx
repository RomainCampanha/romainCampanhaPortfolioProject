import type { ReactNode } from "react";
// Jua, découpée par plages Unicode : seuls les morceaux contenant les syllabes affichées sont
// téléchargés (quelques ko). Feuille importée ici, donc chargée uniquement par les pages
// qui affichent du coréen.
import "@fontsource/jua/400.css";
import { cx } from "./cx";

/** Texte coréen (ex. 서울) en police Jua, avec lang="ko" pour les lecteurs d'écran. */
export function Hangul({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span lang="ko" className={cx("font-ko", className)}>
      {children}
    </span>
  );
}
