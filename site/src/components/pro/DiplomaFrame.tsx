import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { isUntranslated, pick, type Education } from "@/content/profile";
import { ClayCard, StatusBadge, type Tone } from "@/components/ui";
import styles from "./PathSection.module.css";

type DiplomaFrameProps = {
  education: Education;
  /** Couleur du cadre (cf. tones.ts : CFPT pêche, ESIG sauge, HEG lilas). */
  tone: Tone;
};

// Un cadre du mur des diplômes : accroché à un clou par une ficelle, passe-partout crème.
// Trois niveaux de texte : école (sigle · ville, nom complet au survol), intitulé court en
// grand, titre officiel ; puis les années et le badge Obtenu / En cours. Les précisions
// (profile.education[].details) sont sous le mur (PathSection). Hauteur naturelle.
export function DiplomaFrame({ education: e, tone }: DiplomaFrameProps) {
  const t = useTranslations("pro.path");
  const locale = useLocale() as AppLocale;
  const titleId = `diploma-${e.id}`;
  // Noms officiels non traduits (ex. ESIG, CFPT) : en français sur les pages anglaises (WCAG 3.1.2)
  const french = locale !== "fr";
  const schoolLang = french && isUntranslated(e.school.name) ? "fr" : undefined;
  // Années passées en texte : un nombre serait formaté "2 017" par ICU.
  const period =
    e.endYear !== null
      ? t("period", { start: String(e.startYear), end: String(e.endYear) })
      : t("since", { start: String(e.startYear) });

  return (
    <ClayCard as="article" tone={tone} shade="strong" aria-labelledby={titleId} className={styles.frame}>
      <span aria-hidden="true" className={styles.nail} />
      <div className={styles.mat}>
        <p className={styles.school}>
          {t.rich("school", {
            school: e.school.shortName,
            city: pick(e.school.city, locale),
            abbr: (chunks) => (
              <abbr title={pick(e.school.name, locale)} lang={schoolLang}>
                {chunks}
              </abbr>
            ),
          })}
        </p>
        <h3 id={titleId} className={`type-h3 ${styles.frameTitle}`}>
          {pick(e.shortTitle, locale)}
        </h3>
        {/* Titre officiel (ex. « Informaticien de gestion diplômé ES, Professional Bachelor ») ;
            en anglais, suivi du titre protégé français s'il n'a pas de traduction officielle */}
        <p className={styles.official}>
          {pick(e.title, locale)}
          {french && e.nativeTitle ? (
            <>
              {" ("}
              <span lang="fr">{e.nativeTitle}</span>
              {")"}
            </>
          ) : null}
        </p>
        <p className={styles.years}>{period}</p>
      </div>
      <StatusBadge status={e.status} className={styles.badge} />
    </ClayCard>
  );
}
