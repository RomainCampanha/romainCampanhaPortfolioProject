import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAge, pick, profile } from "@/content/profile";
import { Age } from "@/components/site/Age";
import { inSentence } from "@/lib/text";
import { ArrowIcon } from "./icons";
import { useWorkFacts } from "./useWorkFacts";

// Hero de la page Pro : qui je suis, en bref, + CTA vers le chat.
// Tous les faits viennent de profile.ts (les traductions ne gardent que la formulation).
export function ProHero() {
  const t = useTranslations("pro.hero");
  const locale = useLocale();
  const format = useFormatter();
  const { company, since, rate } = useWorkFacts();
  const location = pick(profile.location, locale);
  const studies = profile.education.find((e) => e.status === "in-progress");
  const previous = profile.education
    .filter((e) => e.status === "obtained")
    .sort((a, b) => a.startYear - b.startYear);

  const facts = [
    { term: t("facts.age"), value: <Age birthDate={profile.birthDate} buildAge={getAge()} /> },
    { term: t("facts.city"), value: location },
    { term: t("facts.job"), value: t("jobValue", { company, rate }) },
    ...(studies
      ? [
          {
            term: t("facts.studies"),
            value: t("studiesValue", { degree: pick(studies.shortTitle, locale), school: studies.school.shortName }),
          },
        ]
      : []),
  ];

  const bioWork = t("bioWork", {
    native: profile.birthPlace.en === profile.location.en ? "true" : "false",
    location,
    company,
    since,
    rate,
    role: inSentence(pick(profile.work.role, locale), locale),
  });
  const bioStudies = studies
    ? t("bioStudies", { studies: pick(studies.title, locale), school: studies.school.shortName })
    : null;
  const bioBefore =
    previous.length > 0
      ? t("bioBefore", {
          diplomas: format.list(
            previous.map((e) => `${pick(e.nickname ?? e.title, locale)} (${e.school.shortName})`),
            { type: "conjunction" },
          ),
        })
      : null;

  return (
    <section aria-labelledby="pro-title" className="pb-12 pt-6 sm:pt-10 lg:pt-14">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-accent sm:text-sm">
        {t("kicker", { firstName: profile.firstName })}
      </p>
      <h1
        id="pro-title"
        className="mt-3 font-display text-4xl font-black leading-tight text-shadow-neon sm:text-6xl"
      >
        {profile.name}
      </h1>
      <p className="mt-4 max-w-2xl text-lg font-medium sm:text-xl">{pick(profile.headline, locale)}.</p>

      <div className="mt-6 max-w-2xl space-y-4 leading-relaxed text-muted">
        <p>{[bioWork, bioStudies].filter(Boolean).join(" ")}</p>
        <p>{[bioBefore, pick(profile.aboutMe, locale)].filter(Boolean).join(" ")}</p>
      </div>

      <dl aria-label={t("factsLabel")} className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map(({ term, value }) => (
          <div key={term} className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{term}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/chat" className="btn-neon">
          {t("ctaChat")}
          <ArrowIcon />
        </Link>
        <a
          href="#parcours"
          className="inline-flex items-center gap-2 rounded-full px-4 py-3 font-semibold text-muted underline decoration-line underline-offset-4 transition-colors hover:text-fg hover:decoration-accent"
        >
          {t("ctaPath")}
          <ArrowIcon direction="down" />
        </a>
      </div>
    </section>
  );
}
