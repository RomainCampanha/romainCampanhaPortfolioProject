"use client";

import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// FR | EN : garde le chemin courant en changeant de langue.
export function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div role="group" aria-label={t("label")} className="lang-switcher">
      {routing.locales.map((l, index) => (
        <Fragment key={l}>
          {index > 0 && (
            <span aria-hidden="true" className="opacity-50">
              |
            </span>
          )}
          <Link
            href={pathname}
            locale={l}
            hrefLang={l}
            lang={l}
            aria-label={t(l)}
            aria-current={l === locale ? "true" : undefined}
            className="lang-link"
          >
            {l.toUpperCase()}
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
