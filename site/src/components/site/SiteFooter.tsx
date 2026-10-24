import { useFormatter, useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { Icon } from "@/components/ui/Icon";
import { RominouHead } from "@/components/ui/RominouHead";
import { ExternalLink } from "./ExternalLink";

// Date de build injectée par next.config.ts (YYYY-MM-DD)
const LAST_UPDATED = process.env.NEXT_PUBLIC_LAST_UPDATED ?? "2026-01-01";

// Footer « Cosy » : signature (tête de Rominou + nom · ville) et pilules de contact
// (sauf sur la page Pro, qui a sa section contact juste au-dessus).
// Sur Hobby et Chat, il prolonge la bande de la page (cf. site.css).
export function SiteFooter() {
  const t = useTranslations("common.footer");
  const format = useFormatter();
  const locale = useLocale();
  const updated = new Date(`${LAST_UPDATED}T12:00:00Z`);
  const { email, linkedin, instagram } = profile.links;

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer-inner">
          <p className="footer-sign">
            <RominouHead />
            {t("signature", { name: profile.name, city: pick(profile.location, locale) })}
          </p>

          {/* Masqué en CSS sur une page qui a déjà sa section #contact (Pro) */}
          <nav aria-label={t("contact")} className="footer-nav">
            <ul className="footer-links">
              <li>
                <a href={`mailto:${email}`} title={t("writeMeTitle", { email })} className="footer-link">
                  <Icon name="mail" />
                  {t("writeMe")}
                </a>
              </li>
              <li>
                <ExternalLink href={linkedin} className="footer-link">
                  {t("linkedin")}
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={instagram} className="footer-link">
                  {t("instagram")}
                </ExternalLink>
              </li>
            </ul>
          </nav>
        </div>

        <p className="footer-meta">
          {t("lastUpdated", { date: format.dateTime(updated, { dateStyle: "long" }) })}
          <span aria-hidden="true"> · </span>
          {t("copyright", { year: String(updated.getUTCFullYear()), name: profile.name })}
        </p>
      </div>
    </footer>
  );
}
