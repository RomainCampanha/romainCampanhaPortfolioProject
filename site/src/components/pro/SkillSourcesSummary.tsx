import { useTranslations } from "next-intl";
import { ClayCard } from "@/components/ui";
import { skillSourceStats, SOURCE_TONES } from "./tones";
import styles from "./SkillsSection.module.css";

// Carte « D'où viennent mes compétences » : total, barre empilée et légende, tout calculé
// depuis profile.ts (une compétence apprise à deux endroits compte pour chacun).
export function SkillSourcesSummary() {
  const t = useTranslations("pro.skills");
  const { total, counts, overlap } = skillSourceStats();

  return (
    <ClayCard as="figure" className={styles.summary}>
      <figcaption className={styles.summaryHead}>
        <span>{t("summary.title")}</span>
        <span aria-hidden="true" className={styles.summaryTotal}>
          {total}
        </span>
        <span className="sr-only">{t("summary.total", { count: total })}</span>
      </figcaption>

      {/* Barre empilée : redondante avec la légende (lue, elle), donc masquée aux lecteurs d'écran */}
      <div aria-hidden="true" className={styles.bar}>
        {counts.map(({ source, count }) => (
          <span key={source} data-tone={SOURCE_TONES[source]} className={styles.segment} style={{ flexGrow: count }} />
        ))}
      </div>

      <ul aria-label={t("summary.legendLabel")} className={styles.legend}>
        {counts.map(({ source, count }) => (
          <li key={source} data-tone={SOURCE_TONES[source]}>
            <span aria-hidden="true" className={styles.dot} />
            {t(`sources.${source}`)}
            <span className="sr-only">, </span>
            <b>{count}</b>
          </li>
        ))}
      </ul>

      {overlap ? <p className={styles.summaryNote}>{t("summary.overlap")}</p> : null}
    </ClayCard>
  );
}
