"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { PAGE_IDS, PAGE_PATHS, pageFromPathname } from "@/lib/pages";
import { LanguageSwitcher } from "./LanguageSwitcher";

type SiteHeaderProps = {
  /** Nom affiché (profil), ex. "Romain Campanha". */
  name: string;
  /** Initiales affichées sur petit écran, ex. "RC". */
  initials: string;
};

// Le profil n'est pas embarqué côté client : nom et initiales arrivent en props du layout.
export function SiteHeader({ name, initials }: SiteHeaderProps) {
  const t = useTranslations("common.nav");
  const current = pageFromPathname(usePathname());

  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-4 py-3 sm:gap-4">
        <Link
          href="/"
          aria-label={t("home", { name })}
          className="font-display text-base font-bold tracking-widest text-fg sm:text-lg"
        >
          <span aria-hidden="true" className="sm:hidden">
            {initials}
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            {name}
          </span>
        </Link>

        <nav aria-label={t("label")}>
          <ul className="flex items-center gap-0.5 sm:gap-2">
            {PAGE_IDS.map((id) => (
              <li key={id}>
                <Link
                  href={PAGE_PATHS[id]}
                  aria-current={current === id ? "page" : undefined}
                  className="nav-link"
                >
                  {t(id)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
