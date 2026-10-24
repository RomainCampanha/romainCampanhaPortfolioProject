import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SKILL_VISUALS } from "./assets";

// #competences : compétences groupées (Frontend, Full stack, Langages, Infrastructure) + langues.
export function SkillsSection() {
  const t = useTranslations("pro.skills");
  const locale = useLocale();

  return (
    <section id="competences" aria-labelledby="competences-title" className="scroll-mt-20 py-12 sm:py-16">
      <SectionHeading id="competences-title" title={t("title")} intro={t("intro")} />

      <div className="grid gap-4 sm:grid-cols-2">
        {profile.skillGroups.map((group) => (
          <div key={group.id} className="rounded-card border border-line bg-surface p-5">
            <h3 id={`skills-${group.id}`} className="font-display text-base font-bold tracking-wide text-accent">
              {pick(group.label, locale)}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-3">
              {group.skills.map((skill) => (
                <SkillItem key={skill} skill={skill} locale={locale} />
              ))}
            </ul>
          </div>
        ))}

        <div className="rounded-card border border-line bg-surface p-5 sm:col-span-2">
          <h3 id="spoken-languages" className="font-display text-base font-bold tracking-wide text-accent">
            {t("languagesTitle")}
          </h3>
          <ul className="mt-4 flex flex-wrap gap-3">
            {profile.languages.map((language) => (
              <li key={language.name.en} className="rounded-full border border-line px-4 py-2">
                <span className="font-semibold">{pick(language.name, locale)}</span>
                {/* Niveau inconnu (TODO dans profile.ts) : on n'affiche rien plutôt que d'inventer. */}
                {language.level ? <span className="text-muted"> · {pick(language.level, locale)}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SkillItem({ skill, locale }: { skill: string; locale: AppLocale }) {
  const visual = SKILL_VISUALS[skill];
  const label = visual?.label ? pick(visual.label, locale) : skill;

  return (
    <li className="flex items-center gap-2.5 rounded-2xl border border-line bg-night/40 py-1.5 pl-1.5 pr-4">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-white p-1.5">
        {visual ? (
          <Image src={visual.icon} alt="" width={28} height={28} unoptimized className="size-7 object-contain" />
        ) : (
          <span className="font-display text-xs font-black text-night">{skill.slice(0, 2)}</span>
        )}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </li>
  );
}
