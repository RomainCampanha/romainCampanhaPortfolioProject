import type { ReactNode } from "react";
import type { PageId } from "@/lib/pages";

type PageShellProps = {
  /** Thème de la page : définit les variables CSS (--theme-*) pour son contenu. */
  theme: PageId;
  className?: string;
  children: ReactNode;
};

// Wrapper de chaque page : pose data-theme et la largeur de contenu par défaut.
export function PageShell({ theme, className, children }: PageShellProps) {
  return (
    <div
      data-theme={theme}
      className={["page-shell", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
