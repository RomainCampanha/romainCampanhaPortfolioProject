import { cx } from "./cx";

export type ButtonStyle = {
  /** primary : pilule d'argile (action principale, 1 par zone) · secondary : pilule crème */
  variant?: "primary" | "secondary";
  /** md (défaut) · sm · icon (rond 48 px, icône seule : aria-label obligatoire) */
  size?: "md" | "sm" | "icon";
  /** Pleine largeur. */
  block?: boolean;
  className?: string;
};

/**
 * Classes d'un Button, pour styler un autre élément comme un bouton
 * (ex. <summary>, <Link> de next/link hors next-intl).
 */
export function buttonClasses({ variant = "primary", size = "md", block = false, className }: ButtonStyle = {}): string {
  return cx(
    "btn",
    variant === "primary" ? "btn-primary" : "btn-secondary",
    size === "sm" && "btn-sm",
    size === "icon" && "btn-icon",
    block && "btn-block",
    className,
  );
}
