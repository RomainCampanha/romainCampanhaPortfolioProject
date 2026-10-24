import type { ReactNode } from "react";

type SectionHeadingProps = {
  /** id du h2, référencé par aria-labelledby sur la section. */
  id: string;
  title: ReactNode;
  /** Petit sur-titre (optionnel). */
  kicker?: ReactNode;
  intro?: ReactNode;
};

// En-tête de section commun (h2 Orbitron + intro).
export function SectionHeading({ id, title, kicker, intro }: SectionHeadingProps) {
  return (
    <header className="mb-8 max-w-2xl">
      {kicker ? (
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {kicker}
        </p>
      ) : null}
      <h2 id={id} className="font-display text-2xl font-bold sm:text-3xl">
        {title}
      </h2>
      {intro ? <p className="mt-3 text-muted sm:text-lg">{intro}</p> : null}
    </header>
  );
}
