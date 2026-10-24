import type { ReactNode } from "react";
import type { PageId } from "@/lib/pages";

type PageShellProps = {
  /** Thème de la page : définit les variables CSS (--theme-*) pour son contenu. */
  theme: PageId;
  /**
   * Pleine largeur (pas de conteneur) : pour une page faite de bandes (WavyBand) dont chaque
   * section pose son propre <div className="site-container">. Défaut : contenu centré (1240 px).
   */
  bleed?: boolean;
  className?: string;
  children: ReactNode;
};

// Wrapper de chaque page : pose data-theme et, par défaut, le conteneur commun du site.
export function PageShell({ theme, bleed = false, className, children }: PageShellProps) {
  return (
    <div
      data-theme={theme}
      className={["page-shell", bleed ? null : "site-container", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
