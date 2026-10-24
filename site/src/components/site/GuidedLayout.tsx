import type { ReactNode } from "react";

type GuidedLayoutProps = {
  /** Colonne de Rominou (ancre de l'avatar + bulle). */
  guide: ReactNode;
  /** Nom accessible de la colonne (landmark complementary). */
  guideLabel: string;
  children: ReactNode;
};

// Mise en page "guidée" des pages Pro et Hobby : Rominou en haut sur mobile,
// dans une colonne gauche sticky à partir de lg ; le contenu défile à droite.
export function GuidedLayout({ guide, guideLabel, children }: GuidedLayoutProps) {
  return (
    <div className="grid gap-x-12 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside
        aria-label={guideLabel}
        className="pt-6 lg:sticky lg:top-16 lg:self-start lg:pt-10"
      >
        {guide}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
