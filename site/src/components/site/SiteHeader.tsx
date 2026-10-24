"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { PAGE_IDS, PAGE_PATHS, pageFromPathname, type PageId } from "@/lib/pages";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RominouHead } from "@/components/ui/RominouHead";
import { LanguageSwitcher } from "./LanguageSwitcher";

const PAGE_ICONS: Record<PageId, IconName> = {
  pro: "briefcase",
  hobby: "heart",
  chat: "chat",
};

type SiteHeaderProps = {
  /** Nom affiché (profil), ex. "Romain Campanha". */
  name: string;
  /** Nom du guide (profil), pour l'accroche « Le portfolio guidé par Rominou ». */
  guide: string;
};

// Header « Cosy » : marque (tête de Rominou + nom + accroche), onglets des pages, langue.
// Une seule <nav> : rail d'onglets centré à partir de md, dock fixé en bas de l'écran sur mobile.
// Le profil n'est pas embarqué côté client : nom et guide arrivent en props du layout.
export function SiteHeader({ name, guide }: SiteHeaderProps) {
  const t = useTranslations("common");
  const current = pageFromPathname(usePathname());

  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link href="/" aria-label={t("nav.home", { name })} className="brand">
          {/* Sur la page Hobby, Rominou est en tenue de vacances (comme l'avatar 3D) */}
          <RominouHead ring="raised" outfit={current === "hobby" ? "vacances" : "default"} />
          <span className="brand-text">
            <span className="brand-name">{name}</span>
            <span className="brand-tagline">{t("brand.tagline", { guide })}</span>
          </span>
        </Link>

        <nav aria-label={t("nav.label")} className="page-nav">
          <ul className="page-tabs">
            {PAGE_IDS.map((id) => (
              <li key={id}>
                <Link
                  href={PAGE_PATHS[id]}
                  aria-current={current === id ? "page" : undefined}
                  className="page-tab"
                >
                  <Icon name={PAGE_ICONS[id]} />
                  {t(`nav.${id}`)}
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
