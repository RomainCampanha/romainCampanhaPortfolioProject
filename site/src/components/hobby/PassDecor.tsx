import type { CSSProperties } from "react";
import type { Tone } from "@/components/ui/tones";
import { cx } from "@/components/ui/cx";
import styles from "./BoardingPass.module.css";

// Décors SVG du talon de la carte d'embarquement (décoratifs : aria-hidden, les mêmes
// informations sont écrites sur la carte). Couleur = currentColor (teinte -800 du ton).

/** Tampon rond « composté » : ville(s) en arc en haut, année au centre, pays en arc en bas. */
export function PassStamp({
  id,
  top,
  year,
  bottom,
  tone,
  tilt,
  className,
}: {
  /** Identifiant unique sur la page (id du voyage) : sert aux arcs du texte. */
  id: string;
  top: string;
  year: string | null;
  bottom: string | null;
  tone: Tone;
  tilt: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-tone={tone}
      className={cx(styles.stamp, className)}
      style={{ "--stamp-tilt": `${tilt}deg` } as CSSProperties}
    >
      <svg viewBox="0 0 160 160" width="160" height="160" focusable="false">
        <defs>
          <path id={`stamp-${id}-top`} d="M 30 80 A 50 50 0 0 1 130 80" />
          <path id={`stamp-${id}-bottom`} d="M 22 80 A 58 58 0 0 0 138 80" />
        </defs>
        <circle cx="80" cy="80" r="77" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="80" cy="80" r="69" fill="none" stroke="currentColor" strokeWidth="3" />
        <text className={styles.stampArc} style={arcStyle(top)}>
          <textPath href={`#stamp-${id}-top`} startOffset="50%" textAnchor="middle">
            {top}
          </textPath>
        </text>
        {bottom ? (
          <text className={styles.stampArc} style={arcStyle(bottom)}>
            <textPath href={`#stamp-${id}-bottom`} startOffset="50%" textAnchor="middle">
              {bottom}
            </textPath>
          </text>
        ) : null}
        {year ? (
          <text x="80" y="92" textAnchor="middle" className={styles.stampYear}>
            {year}
          </text>
        ) : null}
        <path d={star(25, 80)} fill="currentColor" />
        <path d={star(135, 80)} fill="currentColor" />
      </svg>
    </span>
  );
}

/** Texte en arc : plus petit et moins espacé quand il est long (ex. « Brighton · Dubrovnik »). */
function arcStyle(text: string): CSSProperties {
  return text.length > 13 ? { fontSize: "8.5px", letterSpacing: "0.08em" } : {};
}

/** Petite étoile à 4 branches centrée en (x, y). */
function star(x: number, y: number): string {
  return `M${x} ${y - 5}c.5 3 1.9 4.5 5 5-3.1.5-4.5 2-5 5-.5-3-1.9-4.5-5-5 3.1-.5 4.5-2 5-5z`;
}

/** Code-barres décoratif, propre à chaque carte (barres dérivées de l'id du voyage). */
export function PassBarcode({ seed, className }: { seed: string; className?: string }) {
  const bars = barcode(seed);
  const width = bars.reduce((end, bar) => Math.max(end, bar.x + bar.w), 0);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${width} 40`}
      preserveAspectRatio="none"
      className={cx(styles.barcode, className)}
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y="0" width={bar.w} height="40" fill="currentColor" />
      ))}
    </svg>
  );
}

/** ~38 barres de 1 à 3 unités, espacées de 1 à 3 unités, tirées d'un PRNG déterministe. */
function barcode(seed: string): { x: number; w: number }[] {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  const next = () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507) >>> 0;
    state = Math.imul(state ^ (state >>> 13), 3266489909) >>> 0;
    return (state ^= state >>> 16) >>> 0;
  };
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; i < 38; i++) {
    const w = 1 + (next() % 3);
    bars.push({ x, w });
    x += w + 1 + (next() % 3);
  }
  return bars;
}
