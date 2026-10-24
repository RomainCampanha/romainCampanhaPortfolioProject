import type { SVGProps } from "react";

// Pictos et décors propres à la page Hobby (absents du jeu d'icônes du design system,
// src/components/ui/Icon.tsx). Mêmes réglages de trait que <Icon> (classe "icon").
// Tous décoratifs (aria-hidden) : le sens est toujours porté par un texte.

type SvgProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

/** Cassette audio (coin musique), en currentColor + tons du parent (--tone-*). */
export function CassetteArt({ label, ...props }: SvgProps & { label: string }) {
  return (
    <svg viewBox="0 0 200 128" aria-hidden="true" focusable="false" {...props}>
      <rect x="4" y="4" width="192" height="120" rx="18" fill="var(--tone-300)" />
      <rect x="4" y="4" width="192" height="120" rx="18" fill="none" stroke="var(--tone-800)" strokeOpacity=".18" strokeWidth="3" />
      <rect x="22" y="18" width="156" height="58" rx="10" fill="var(--color-cream)" />
      <rect x="22" y="18" width="156" height="14" rx="7" fill="var(--tone-200)" />
      <text
        x="100"
        y="58"
        textAnchor="middle"
        fill="var(--tone-800)"
        style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}
      >
        {label}
      </text>
      <path d="M44 124 54 92h92l10 32" fill="var(--tone-200)" />
      <circle cx="70" cy="104" r="9" fill="var(--color-cream)" />
      <circle cx="130" cy="104" r="9" fill="var(--color-cream)" />
      <circle cx="70" cy="104" r="3.5" fill="var(--tone-800)" />
      <circle cx="130" cy="104" r="3.5" fill="var(--tone-800)" />
      <path d="M79 104h42" stroke="var(--tone-800)" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill="var(--tone-800)" fillOpacity=".25" />
      <circle cx="184" cy="16" r="3" fill="var(--tone-800)" fillOpacity=".25" />
    </svg>
  );
}

/** Gemme de rang (carte LoL) : hexagone facetté, tons lac. */
export function RankGem({ size = 56, ...props }: SvgProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" {...props}>
      <path d="M32 4 56 18v28L32 60 8 46V18z" fill="var(--color-lake-300)" />
      <path d="M32 4 56 18 32 32 8 18z" fill="var(--color-lake-200)" />
      <path d="M32 32 56 18v28L32 60z" fill="var(--color-lake-500)" />
      <path d="M32 16 44 23v14L32 44l-12-7V23z" fill="var(--color-cream)" fillOpacity=".55" />
      <path d="M32 4 56 18v28L32 60 8 46V18z" fill="none" stroke="var(--color-lake-800)" strokeOpacity=".35" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
