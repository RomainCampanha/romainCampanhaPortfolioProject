import type { CSSProperties, ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { getAge, pick, profile } from "@/content/profile";
import { Age } from "@/components/site/Age";
import {
  Button,
  ClayCard,
  Coin,
  cx,
  Gauge,
  Highlight,
  Icon,
  Sticker,
  type IconName,
  type Tone,
} from "@/components/ui";
import { HeroStage } from "./HeroStage";
import { useWorkFacts } from "./useWorkFacts";
import styles from "./ProHero.module.css";

type Fact = { id: string; tone: Tone; icon: IconName; label: string; value: ReactNode; extra: ReactNode };

// Hero de la page Pro : sticker (titre LinkedIn), nom, accroche (entreprise et école surlignées),
// barre d'inventaire « En bref » (4 faits), boutons, et le diorama de Rominou.
// Tous les faits viennent de profile.ts ; les traductions ne portent que la formulation.
export function ProHero() {
  const t = useTranslations("pro.hero");
  const locale = useLocale() as AppLocale;
  const { company, rate } = useWorkFacts();
  const { work } = profile;
  const studies = profile.education.find((e) => e.status === "in-progress");
  const native = profile.birthPlace.en === profile.location.en;

  const facts: Fact[] = [
    {
      id: "age",
      tone: "butter",
      icon: "cake",
      label: t("facts.age"),
      value: <Age birthDate={profile.birthDate} buildAge={getAge()} />,
      extra: <FactNote>{t("ageNote", { year: profile.birthDate.slice(0, 4) })}</FactNote>,
    },
    {
      id: "city",
      tone: "sage",
      icon: "pin",
      label: t("facts.city"),
      value: pick(profile.location, locale),
      extra: native ? <FactNote>{t("cityNote")}</FactNote> : null,
    },
    {
      id: "job",
      tone: "lake",
      icon: "server",
      label: t("facts.job"),
      value: company,
      extra: <Gauge value={work.ratePercent} label={t("rateLabel", { rate })} />,
    },
    ...(studies
      ? [
          {
            id: "studies",
            tone: "lilac",
            icon: "graduation",
            label: t("facts.studies"),
            value: pick(studies.shortTitle, locale),
            extra: <FactNote icon="sprout">{t("studiesNote")}</FactNote>,
          } satisfies Fact,
        ]
      : []),
  ];

  // Accroche : rôle + entreprise (lac) + domaine de la formation en cours et école (lilas),
  // sinon le titre du profil.
  const lede = studies
    ? t.rich("lede", {
        role: pick(work.role, locale),
        company,
        field: pick(studies.field, locale),
        school: studies.school.shortName,
        lake: (chunks) => <Highlight tone="lake">{chunks}</Highlight>,
        lilac: (chunks) => (
          <Highlight tone="lilac" className="whitespace-nowrap">
            {chunks}
          </Highlight>
        ),
      })
    : `${pick(profile.headline, locale)}.`;

  return (
    // Pas de <section> nommée : la région rendrait le complémentaire « Rominou, le guide »
    // (HeroStage) non top-level ; le h1 ouvre directement le contenu principal.
    <div className={styles.hero}>
      <div className={styles.copy}>
        <Sticker as="p" className={styles.sticker}>
          {pick(profile.linkedinHeadline, locale).replace(" - ", " – ")}
        </Sticker>
        <h1 id="pro-title" className={cx("type-hero", styles.title)}>
          {profile.name}
        </h1>
        <p className={cx("type-lede", styles.lede)}>{lede}</p>

        <ClayCard
          variant="well"
          role="group"
          aria-label={t("factsLabel")}
          className={styles.facts}
        >
          <dl
            className={styles.factsGrid}
            style={{ "--facts": facts.length } as CSSProperties}
          >
            {facts.map((fact) => (
              <ClayCard key={fact.id} tone={fact.tone} radius="md" depth="sm" className={styles.fact}>
                <dt className={styles.factLabel}>
                  <Coin icon={fact.icon} size="xs" className={styles.factCoin} />
                  {fact.label}
                </dt>
                <dd className={cx("type-title", styles.factValue)}>{fact.value}</dd>
                {fact.extra ? <dd className={styles.factExtra}>{fact.extra}</dd> : null}
              </ClayCard>
            ))}
          </dl>
        </ClayCard>

        <div className={styles.ctas}>
          <Button icon="chat" href="/chat">
            {t("ctaChat")}
          </Button>
          <Button variant="secondary" iconEnd="arrow-down" href="#parcours">
            {t("ctaPath")}
          </Button>
        </div>
      </div>

      <HeroStage className={styles.stage} />
    </div>
  );
}

/** Petite note sous la valeur d'un fait (teinte profonde du ton, AA). */
function FactNote({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return (
    <span className={styles.factNote}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </span>
  );
}
