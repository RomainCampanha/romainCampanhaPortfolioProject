import { useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { DiplomaFrame } from "./DiplomaFrame";
import { ExperienceCard } from "./ExperienceCard";

// Inclinaisons alternées des cadres (le mur a un petit côté fait main).
const TILTS = ["-rotate-1", "rotate-[0.8deg]", "-rotate-[0.4deg]"];

// #parcours : le "mur des diplômes" (du plus ancien au plus récent) + l'expérience.
export function PathSection() {
  const t = useTranslations("pro.path");
  const locale = useLocale();
  const diplomas = [...profile.education].sort((a, b) => a.startYear - b.startYear);
  const first = diplomas.at(0);
  const last = diplomas.at(-1);
  // "toujours à Genève" seulement si toutes les écoles sont dans la même ville
  const cities = new Set(diplomas.map((e) => pick(e.school.city, locale)));
  const intro =
    first && last
      ? t("intro", {
          first: pick(first.shortTitle, locale),
          last: pick(last.shortTitle, locale),
          city: cities.size === 1 ? [...cities][0] : "none",
        })
      : undefined;

  return (
    <section id="parcours" aria-labelledby="parcours-title" className="scroll-mt-20 py-12 sm:py-16">
      <SectionHeading id="parcours-title" title={t("title")} intro={intro} />

      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted">
        {t("diplomasTitle")}
      </h3>
      <div className="mt-4 rounded-[2rem] border border-line bg-white/[0.03] px-4 pb-6 pt-9 sm:px-6">
        <ol className="grid gap-10 md:grid-cols-3 md:gap-6">
          {diplomas.map((education, index) => (
            <li key={education.id}>
              <DiplomaFrame education={education} tiltClassName={TILTS[index % TILTS.length]} />
            </li>
          ))}
        </ol>
      </div>

      <div id="experience" className="mt-12 scroll-mt-20">
        <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          {t("experienceTitle")}
        </h3>
        <ExperienceCard />
      </div>
    </section>
  );
}
