import type { ReactNode, SVGProps } from "react";
import { cx } from "./cx";

// Jeu d'icônes du design system : traits arrondis 24×24 (stroke = currentColor, épaisseur 2.1).
// Pour en ajouter une : un tracé simple, mêmes réglages de trait, nom en kebab-case.
const ICONS = {
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="3.5" />
      <path d="M8.5 7V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8V7" />
      <path d="M3 12.5h18" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />,
  chat: (
    <>
      <path d="M6.5 4.5h11a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3H12l-4.5 3.5V17h-1a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth="2.6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.8-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </>
  ),
  cake: (
    <>
      <rect x="4" y="11" width="16" height="9" rx="3" />
      <path d="M4 15.2c2.1 1.4 3.6 1.4 5.3 0s3.3-1.4 5.3 0 3.3 1.4 5.4 0" />
      <path d="M12 11V8.2" />
      <path d="M12 5.8c.8 0 1.3-.6 1.3-1.3S12 2.6 12 2.6s-1.3 1.2-1.3 1.9.5 1.3 1.3 1.3z" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="4" width="16" height="7" rx="2.5" />
      <rect x="4" y="13" width="16" height="7" rx="2.5" />
      <path d="M8 7.5h.01M8 16.5h.01" strokeWidth="2.8" />
      <path d="M12 7.5h4M12 16.5h4" />
    </>
  ),
  graduation: (
    <>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.6v3.9c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-3.9" />
      <path d="M21.5 9.5v5" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-8.5" />
      <path d="M12 12.5C12 8.6 9.3 6.5 5 6.5c0 3.9 2.7 6 7 6z" />
      <path d="M12 10.5c0-3.4 2.4-5.5 6.5-5.5 0 3.4-2.4 5.5-6.5 5.5z" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-down": <path d="M12 5v14M6 13l6 6 6-6" />,
  "arrow-up-right": <path d="M7 17 17 7M9 7h8v8" />,
  "chevron-down": <path d="m6 9.5 6 6 6-6" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  plane: (
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="3.5" />
      <path d="M8.5 7 10 4.5h4L15.5 7" />
      <circle cx="12" cy="13.5" r="3.3" />
    </>
  ),
  send: (
    <>
      <path d="M4.5 11.2 19.5 4.5l-6.7 15-2.1-6.4z" />
      <path d="M10.7 13.1 19.5 4.5" />
    </>
  ),
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />,
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4.2h-4.2" />
    </>
  ),
  code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5z" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.8" />
      <path d="M5 6v12c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8V6" />
      <path d="M5 12c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8" />
    </>
  ),
  cloud: <path d="M7.2 18.5h10.3a4 4 0 0 0 .4-8A6 6 0 0 0 6.4 9.7a4.4 4.4 0 0 0 .8 8.8z" />,
  board: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="3.5" />
      <path d="M8.5 8.5v4M12 8.5v7M15.5 8.5v2.5" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4.5v15M8 19.5h8M5.5 8h13" />
      <path d="M5.5 8 3 13.5a2.5 2.5 0 0 0 5 0z" />
      <path d="M18.5 8 16 13.5a2.5 2.5 0 0 0 5 0z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3.5" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 15.5V12a8 8 0 0 1 16 0v3.5" />
      <rect x="3" y="14" width="4.5" height="6.5" rx="2" />
      <rect x="16.5" y="14" width="4.5" height="6.5" rx="2" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7 8.5h10a4.5 4.5 0 0 1 4.5 4.5v1.2a3.3 3.3 0 0 1-6 1.9l-.9-1.3H9.4l-.9 1.3a3.3 3.3 0 0 1-6-1.9V13A4.5 4.5 0 0 1 7 8.5z" />
      <path d="M7.5 11.5v3M6 13h3" />
      <path d="M15.5 12.2h.01M17.5 14h.01" strokeWidth="2.8" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      <path d="M12 14.5v2" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19.5c0-8.5 5-13.5 14.5-14.5 0 9.5-5 14.5-14.5 14.5z" />
      <path d="M5 19.5l7.5-7.5" />
    </>
  ),
  sparkle: (
    <path
      d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"
      fill="currentColor"
      stroke="none"
    />
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  /** Taille en px (défaut 20). Les primitives (Button, Chip…) la règlent aussi en CSS. */
  size?: number;
  /** Nom accessible : sans lui, l'icône est décorative (aria-hidden). */
  label?: string;
};

/** Icône inline (SVG), décorative par défaut ; passer `label` si elle porte du sens seule. */
export function Icon({ name, size = 20, label, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cx("icon", className)}
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...props}
    >
      {ICONS[name]}
    </svg>
  );
}
