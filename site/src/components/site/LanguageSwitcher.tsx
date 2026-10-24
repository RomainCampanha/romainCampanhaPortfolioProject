"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// FR / EN : pilule crème, langue active en encre. Garde le chemin courant en changeant de langue.
export function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div role="group" aria-label={t("label")} className="lang-toggle">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          className="lang-option"
        >
          {/* Nom accessible « FR – Français » : il contient le texte visible (WCAG 2.5.3) */}
          {l.toUpperCase()}
          <span className="sr-only"> – {t(l)}</span>
        </Link>
      ))}
    </div>
  );
}
