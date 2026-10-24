import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile, type Skill } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Chip, ClayCard, Coin, Tag } from "@/components/ui";
import { SkillSourcesSummary } from "./SkillSourcesSummary";
import { SKILL_GROUP_STYLE, SOURCE_TONES } from "./tones";
import styles from "./SkillsSection.module.css";

// #competences : « Mon inventaire ». Une rangée par groupe (pastille + titre, puis les chips),
// chaque compétence avec l'étiquette colorée de sa provenance ; résumé « D'où viennent mes
// compétences » (calculé depuis profile.ts) et langues.
export function SkillsSection() {
  const t = useTranslations("pro.skills");
  const locale = useLocale() as AppLocale;

  return (
    <section id="competences" aria-labelledby="competences-title" className={styles.section}>
      <div className={styles.head}>
        <SectionHeading
          id="competences-title"
          kicker={t("kicker")}
          kickerIcon="sparkle"
          title={t("title")}
          intro={t("intro")}
          className="mb-0! sm:mb-0!"
        />
        <SkillSourcesSummary />
      </div>

      <ClayCard className={styles.inventory}>
        {profile.skillGroups.map((group) => {
          const { icon, tone } = SKILL_GROUP_STYLE[group.id];
          return (
            <div key={group.id} className={styles.row}>
              <h3 id={`skills-${group.id}`} className={`type-title ${styles.rowTitle}`}>
                <Coin icon={icon} tone={tone} />
                {pick(group.label, locale)}
              </h3>
              <ul aria-labelledby={`skills-${group.id}`} className={styles.chips}>
                {group.skills.map((skill) => (
                  <SkillChip key={skill.name.en} skill={skill} locale={locale} />
                ))}
              </ul>
            </div>
          );
        })}

        <div className={styles.row}>
          <h3 id="spoken-languages" className={`type-title ${styles.rowTitle}`}>
            <Coin icon="chat" tone="lilac" />
            {t("languagesTitle")}
          </h3>
          <ul aria-labelledby="spoken-languages" className={styles.chips}>
            {profile.languages.map((language) => (
              <Chip
                as="li"
                key={language.name.en}
                // Niveau inconnu (TODO dans profile.ts) : on n'affiche rien plutôt que d'inventer.
                tag={language.level ? <Tag srPrefix=", ">{pick(language.level, locale)}</Tag> : undefined}
              >
                {pick(language.name, locale)}
              </Chip>
            ))}
          </ul>
        </div>
      </ClayCard>
    </section>
  );
}

/** Chip de compétence : nom + étiquette(s) de provenance (« Java, provenance : ESIG » au lecteur d'écran). */
function SkillChip({ skill, locale }: { skill: Skill; locale: AppLocale }) {
  const t = useTranslations("pro.skills");
  return (
    <Chip
      as="li"
      className={styles.chip}
      tag={
        <span className={styles.tags}>
          {skill.sources.map((source, index) => (
            <Tag key={source} tone={SOURCE_TONES[source]} srPrefix={index === 0 ? t("sourcePrefix") : t("sourceJoin")}>
              {t(`sources.${source}`)}
            </Tag>
          ))}
        </span>
      }
    >
      {pick(skill.name, locale)}
    </Chip>
  );
}
