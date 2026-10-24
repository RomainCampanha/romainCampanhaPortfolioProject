import type { ComponentPropsWithoutRef } from "react";
import { useTranslations } from "next-intl";

type ExternalLinkProps = Omit<ComponentPropsWithoutRef<"a">, "target" | "rel"> & {
  href: string;
};

// Lien externe : nouvel onglet, rel sécurisé et mention "(nouvel onglet)" pour les lecteurs d'écran.
export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  const t = useTranslations("common.a11y");
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> {t("newTab")}</span>
    </a>
  );
}
