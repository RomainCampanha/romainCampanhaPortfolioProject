import type { ReactNode } from "react";
import type { IconName } from "@/components/ui/Icon";
import { SectionKicker } from "@/components/ui/SectionKicker";

type SectionHeadingProps = {
  /** id du h2, référencé par aria-labelledby sur la section. */
  id: string;
  title: ReactNode;
  /** Petit sur-titre en capitales (optionnel), avec sa pastille d'icône. */
  kicker?: ReactNode;
  /** Icône de la pastille du sur-titre (défaut : sparkle). */
  kickerIcon?: IconName;
  intro?: ReactNode;
  className?: string;
};

// En-tête de section commun « Cosy » : SectionKicker + h2 Fraunces + intro.
export function SectionHeading({ id, title, kicker, kickerIcon, intro, className }: SectionHeadingProps) {
  return (
    <header className={["mb-8 max-w-160 sm:mb-10", className].filter(Boolean).join(" ")}>
      {kicker ? <SectionKicker icon={kickerIcon}>{kicker}</SectionKicker> : null}
      <h2 id={id} className="type-h2 mt-3.5">
        {title}
      </h2>
      {intro ? <p className="mt-4 max-w-[56ch] font-semibold text-pretty text-muted sm:text-lg">{intro}</p> : null}
    </header>
  );
}
