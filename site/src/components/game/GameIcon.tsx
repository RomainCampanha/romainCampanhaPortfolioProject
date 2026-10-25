import type { ReactNode, SVGProps } from "react";
import { cx } from "@/components/ui/cx";

// Icônes propres au jeu (mêmes réglages de trait que le jeu d'icônes du design system :
// 24×24, stroke currentColor, classe .icon). Décoratives : le sens est porté par le bouton.

const GAME_ICONS = {
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  pause: (
    <>
      <rect x="6.5" y="5.5" width="3.8" height="13" rx="1.4" fill="currentColor" stroke="none" />
      <rect x="13.7" y="5.5" width="3.8" height="13" rx="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  "sound-on": (
    <>
      <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.6 7.6 0 0 1 0 11" />
    </>
  ),
  "sound-off": (
    <>
      <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" />
      <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
    </>
  ),
  expand: <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />,
  collapse: <path d="M9 4.5V9H4.5M19.5 9H15V4.5M15 19.5V15h4.5M4.5 15H9v4.5" />,
  "heart-full": (
    <path
      d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"
      fill="currentColor"
    />
  ),
  stamp: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" strokeDasharray="2.2 2.2" />
      <circle cx="12" cy="12" r="3.6" />
    </>
  ),
  gate: (
    <>
      <path d="M5 20V9.5a7 7 0 0 1 14 0V20" />
      <path d="M3.5 20h17M9 20v-6h6v6" />
    </>
  ),
  replay: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4.2h4.2" />
    </>
  ),
  map: (
    <>
      <path d="M9 5.5 3.5 7.5v11l5.5-2 6 2 5.5-2v-11l-5.5 2z" />
      <path d="M9 5.5v11M15 7.5v11" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type GameIconName = keyof typeof GAME_ICONS;

export function GameIcon({
  name,
  size = 20,
  className,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "children"> & { name: GameIconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cx("icon", className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {GAME_ICONS[name]}
    </svg>
  );
}
