import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile, type Skill, type SkillSource } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SKILL_ICONS } from "./assets";

// Couleur de l'étiquette de provenance : écoles (accent), job (accent 2), autodidacte (neutre).
const SOURCE_TONE: Record<SkillSource, string> = {
  ESIG: "text-accent",
  CFPT: "text-accent",
  HEG: "text-accent",
  Infomaniak: "text-accent-2",
  Projets: "text-fg",
};

// #competences : compétences groupées (LinkedIn + projets), chacune avec sa provenance, + langues.
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
            <ul aria-labelledby={`skills-${group.id}`} className="mt-4 flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <SkillChip key={skill.name.en} skill={skill} locale={locale} />
              ))}
            </ul>
          </div>
        ))}

        <div className="rounded-card border border-line bg-surface p-5 sm:col-span-2">
          <h3 id="spoken-languages" className="font-display text-base font-bold tracking-wide text-accent">
            {t("languagesTitle")}
          </h3>
          <ul aria-labelledby="spoken-languages" className="mt-4 flex flex-wrap gap-3">
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

/** Puce : icône (si l'ancien site en avait une), nom, étiquette de provenance. */
function SkillChip({ skill, locale }: { skill: Skill; locale: AppLocale }) {
  const t = useTranslations("pro.skills");
  const icon = SKILL_ICONS[skill.name.en];

  return (
    <li
      className={`inline-flex max-w-full items-center gap-2 rounded-xl border border-line bg-night/40 py-1 pr-1 text-sm ${
        icon ? "pl-1" : "pl-3"
      }`}
    >
      {icon ? (
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-lg bg-white p-1">
          <Image src={icon} alt="" width={20} height={20} unoptimized className="size-5 object-contain" />
        </span>
      ) : null}
      <span className="min-w-0 font-semibold">{pick(skill.name, locale)}</span>
      <span className="shrink-0 rounded-lg bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider">
        <span className="sr-only">{t("sourcePrefix")}</span>
        {skill.sources.map((source, index) => (
          <span key={source} className={SOURCE_TONE[source]}>
            {index > 0 ? " · " : null}
            {t(`sources.${source}`)}
          </span>
        ))}
      </span>
    </li>
  );
}
