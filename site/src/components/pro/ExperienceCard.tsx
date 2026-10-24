import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { ExternalLink } from "@/components/site/ExternalLink";
import { COMPANY_LOGO } from "./assets";
import { useWorkFacts } from "./useWorkFacts";

// Emploi actuel (Infomaniak). Missions détaillées : TODO (à fournir par Romain, rien d'inventé).
export function ExperienceCard() {
  const t = useTranslations("pro.path");
  const locale = useLocale();
  const format = useFormatter();
  const { company, since, rate } = useWorkFacts();
  const { work } = profile;
  // Écoles fréquentées pendant cet emploi (du profil : rien d'écrit en dur)
  const startYear = Number(work.since.slice(0, 4));
  const schools = profile.education
    .filter((e) => (e.endYear ?? Number.POSITIVE_INFINITY) >= startYear)
    .sort((a, b) => a.startYear - b.startYear)
    .map((e) => e.school.shortName);

  return (
    <article
      aria-labelledby="experience-role"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:flex-row sm:gap-5 sm:p-6"
    >
      <span
        aria-hidden="true"
        className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1"
      >
        <Image src={COMPANY_LOGO} alt="" width={48} height={48} unoptimized className="size-12 rounded-xl" />
      </span>
      <div className="min-w-0">
        <h4 id="experience-role" className="font-display text-lg font-bold">
          {pick(work.role, locale)}
        </h4>
        <p className="mt-1 font-semibold">
          <ExternalLink
            href={work.url}
            className="text-accent underline decoration-line underline-offset-4 hover:decoration-accent"
          >
            {company}
          </ExternalLink>
        </p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          <li className="rounded-full border border-line px-3 py-1">{t("experienceSince", { date: since })}</li>
          <li className="rounded-full border border-line px-3 py-1">{t("experienceRate", { rate })}</li>
        </ul>
        {schools.length > 0 ? (
          <p className="mt-3 text-muted">
            {t("experienceText", { schools: format.list(schools, { type: "conjunction" }) })}
          </p>
        ) : null}
      </div>
    </article>
  );
}
