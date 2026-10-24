import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ClayCard } from "@/components/ui";
import { DiplomaFrame } from "./DiplomaFrame";
import { ExperienceNote } from "./ExperienceNote";
import { educationTone } from "./tones";
import styles from "./PathSection.module.css";

// #parcours : « Le mur des diplômes » (du plus ancien au plus récent, cadres accrochés)
// + le post-it « En parallèle » de l'emploi actuel (#experience), scotché sur le haut du mur,
// + sous les cadres, les cartels de précisions (profile.education[].details : complément
// « Professional Bachelor » de l'ES, Bachelor en emploi…).
export function PathSection() {
  const t = useTranslations("pro.path");
  const locale = useLocale() as AppLocale;
  const diplomas = [...profile.education].sort((a, b) => a.startYear - b.startYear);
  const notes = diplomas.flatMap((education, index) =>
    education.details ? [{ education, details: education.details, tone: educationTone(education, index) }] : [],
  );
  const first = diplomas.at(0);
  const last = diplomas.at(-1);
  // « toujours à Genève » seulement si toutes les écoles sont dans la même ville
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
    <section id="parcours" aria-labelledby="parcours-title" className={styles.section}>
      <SectionHeading
        id="parcours-title"
        kicker={t("kicker")}
        kickerIcon="graduation"
        title={t("title")}
        intro={intro}
        className={styles.heading}
      />

      <ExperienceNote className={styles.noteSlot} />

      <ClayCard variant="well" radius="xl" className={styles.wall}>
        <ol aria-label={t("diplomasLabel")} className={styles.frames}>
          {diplomas.map((education, index) => (
            <li key={education.id} className={styles.frameItem}>
              <DiplomaFrame education={education} tone={educationTone(education, index)} />
            </li>
          ))}
        </ol>

        {notes.length > 0 ? (
          <dl aria-label={t("notesLabel")} className={styles.cartels}>
            {notes.map(({ education, details, tone }) => (
              <div key={education.id} data-tone={tone} className={styles.cartel}>
                <dt className={styles.cartelTerm}>{pick(education.shortTitle, locale)}</dt>
                <dd className={styles.cartelText}>{pick(details, locale)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </ClayCard>
    </section>
  );
}
