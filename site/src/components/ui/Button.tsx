import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { ExternalLink } from "@/components/site/ExternalLink";
import { buttonClasses, type ButtonStyle } from "./buttonClasses";
import { Icon, type IconName } from "./Icon";

type ButtonStyleProps = ButtonStyle & {
  /** Icône avant le libellé (ou seule avec size="icon"). */
  icon?: IconName;
  /** Icône après le libellé (flèche…). */
  iconEnd?: IconName;
  children?: ReactNode;
};

type ButtonAsButton = ButtonStyleProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonStyleProps> & { href?: undefined };

type ButtonAsLink = ButtonStyleProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonStyleProps | "href"> & {
    /**
     * "/hobby" -> lien localisé (next-intl) · "#id" -> ancre · "https://…" -> nouvel onglet
     * (mention lecteur d'écran incluse) · "mailto:…" -> lien simple.
     */
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Bouton « argile » (état enfoncé au clic), rendu en <button> ou en lien selon `href`.
 * Sans "use client" : utilisable côté serveur (sans onClick) comme côté client.
 */
export function Button(props: ButtonProps) {
  const { variant, size, icon, iconEnd, block, className, children, ...rest } = props;
  const classes = buttonClasses({ variant, size, block, className });
  const content = (
    <>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {iconEnd ? <Icon name={iconEnd} /> : null}
    </>
  );

  if (rest.href === undefined) {
    const { type = "button", ...buttonProps } = rest as Omit<ButtonAsButton, keyof ButtonStyleProps>;
    return (
      <button type={type} className={classes} {...buttonProps}>
        {content}
      </button>
    );
  }

  const { href, ...linkProps } = rest as Omit<ButtonAsLink, keyof ButtonStyleProps>;
  if (/^https?:\/\//.test(href)) {
    return (
      <ExternalLink href={href} className={classes} {...linkProps}>
        {content}
      </ExternalLink>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes} {...linkProps}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} {...linkProps}>
      {content}
    </a>
  );
}
