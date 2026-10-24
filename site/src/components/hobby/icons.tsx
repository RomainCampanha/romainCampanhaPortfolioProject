import type { ComponentType, ReactNode } from "react";
import type { HobbyId } from "@/content/profile";

// Icônes SVG décoratives (aria-hidden) de la page Hobby, en currentColor.

function Icon({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const MusicIcon = () => (
  <Icon>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </Icon>
);

export const GamepadIcon = () => (
  <Icon>
    <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
    <path d="M17.3 5H6.7a4 4 0 0 0-3.96 3.4l-.9 6.3A2.6 2.6 0 0 0 6.4 17l2.1-2h7l2.1 2a2.6 2.6 0 0 0 4.56-2.3l-.9-6.3A4 4 0 0 0 17.3 5Z" />
  </Icon>
);

export const CodeIcon = () => (
  <Icon>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
  </Icon>
);

export const PlaneIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
  </Icon>
);

export const CameraIcon = () => (
  <Icon size={28}>
    <path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5l-2-3Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);

export const TrophyIcon = () => (
  <Icon>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM17 6h3a3 3 0 0 1-3 4M7 6H4a3 3 0 0 0 3 4" />
  </Icon>
);

export const HOBBY_ICONS: Record<HobbyId, ComponentType<{ size?: number }>> = {
  music: MusicIcon,
  gaming: GamepadIcon,
  coding: CodeIcon,
  travel: PlaneIcon,
};
