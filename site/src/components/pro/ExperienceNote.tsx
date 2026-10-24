import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { ExternalLink } from "@/components/site/ExternalLink";
import { cx, Gauge, Icon } from "@/components/ui";
import { useWorkFacts } from "./useWorkFacts";
import styles from "./PathSection.module.css";

// Post-it « En parallèle » scotché sur le mur des diplômes : l'emploi actuel (Infomaniak),
// rôle, depuis quand, ce que Romain y fait (ses mots, profile.work.description) et son taux.
// id="experience" : ancre stable (visite guidée, chat).
export function ExperienceNote({ className }: { className?: string }) {
  const t = useTranslations("pro.path.experience");
  const locale = useLocale() as AppLocale;
  const { company, since, rate } = useWorkFacts();
  const { work } = profile;

  return (
    <article id="experience" aria-labelledby="experience-title" className={cx(styles.note, className)}>
      <span aria-hidden="true" className={styles.tape} />
      <p className={styles.noteKicker}>{t("kicker")}</p>
      <h3 id="experience-title" className={styles.noteTitle}>
        <ExternalLink href={work.url} className={styles.noteLink}>
          {company}
          <Icon name="arrow-up-right" size={18} />
        </ExternalLink>
      </h3>
      <p className={styles.noteRole}>{t("roleSince", { role: pick(work.role, locale), since })}</p>
      <p className={styles.noteText}>{pick(work.description, locale)}</p>
      <Gauge
        value={work.ratePercent}
        label={t("rateLabel", { rate })}
        tone="lake"
        track="light"
        size="lg"
        className={styles.noteGauge}
      />
    </article>
  );
}
