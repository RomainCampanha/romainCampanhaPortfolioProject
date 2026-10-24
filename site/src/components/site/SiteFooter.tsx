import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { pick, profile } from "@/content/profile";
import { PAGE_IDS, PAGE_PATHS } from "@/lib/pages";
import { ExternalLink } from "./ExternalLink";

// Date de build injectée par next.config.ts (YYYY-MM-DD)
const LAST_UPDATED = process.env.NEXT_PUBLIC_LAST_UPDATED ?? "2026-01-01";

export function SiteFooter() {
  const t = useTranslations("common.footer");
  const tNav = useTranslations("common.nav");
  const format = useFormatter();
  const locale = useLocale();
  const updated = new Date(`${LAST_UPDATED}T12:00:00Z`);
  const { email, linkedin, instagram } = profile.links;

  const external = [
    { href: linkedin, label: t("linkedin") },
    { href: instagram, label: t("instagram") },
  ];

  return (
    <footer className="site-footer">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div>
          <p className="font-display text-sm font-bold tracking-widest">{profile.name}</p>
          <p className="mt-1 text-sm text-muted">{t("madeIn", { city: pick(profile.location, locale), guide: profile.guideName })}</p>
        </div>

        <div className="flex flex-col gap-4 sm:items-end">
          <nav aria-label={t("pages")}>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              {PAGE_IDS.map((id) => (
                <li key={id}>
                  <Link href={PAGE_PATHS[id]} className="footer-link">
                    {tNav(id)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("contact")}>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <li>
                <a href={`mailto:${email}`} className="footer-link">
                  <span className="sr-only">{t("email")} </span>
                  {email}
                </a>
              </li>
              {external.map(({ href, label }) => (
                <li key={href}>
                  <ExternalLink href={href} className="footer-link">
                    {label}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="text-xs text-muted sm:col-span-2">
          {t("lastUpdated", {
            date: format.dateTime(updated, { dateStyle: "long" }),
          })}
          <span aria-hidden="true"> · </span>
          {t("copyright", { year: String(updated.getUTCFullYear()), name: profile.name })}
        </p>
      </div>
    </footer>
  );
}
