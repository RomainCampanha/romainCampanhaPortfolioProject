import { getFormatter, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile, type SkillSource, type Travel } from "@/content/profile";
import { PAGE_IDS, type PageId } from "@/lib/pages";
import { inSentence } from "@/lib/text";
import { TOUR_LENGTH, TOUR_STEPS, type TourStepId } from "@/lib/tour";
import { skillSourceStats } from "@/components/pro/tones";
import { TourLoader } from "./TourLoader";
import type { TourLabels, TourStepText } from "./types";

// « La visite de Rominou » (composant serveur, monté une fois dans [locale]/layout) : textes des
// 10 étapes (messages tour.json) complétés par les faits de profile.ts, puis confiés au
// chargeur client (TourLoader). Le navigateur reçoit ~3 Ko de texte, ni le profil ni zod ;
// l'interface de la visite elle-même n'est téléchargée qu'au lancement.

type Values = Record<string, string | number>;

/** Étapes dont le bouton principal a son propre libellé (sinon « Suivant »). */
const NEXT_KEYS = {
  hello: "steps.hello.next",
  contact: "steps.contact.next",
  course: "steps.course.next",
  questions: "steps.questions.next",
} as const satisfies Partial<Record<TourStepId, string>>;

/** Étapes avec un bouton d'action (TOUR_STEPS[i].action) : son libellé. */
const ACTION_KEYS = {
  course: "steps.course.action",
} as const satisfies Partial<Record<TourStepId, string>>;

/** Provenance d'une compétence -> clin d'œil de l'étape « inventaire » (école, job, autodidacte). */
const SOURCE_KIND: Record<SkillSource, "school" | "job" | "self"> = {
  ESIG: "school",
  CFPT: "school",
  HEG: "school",
  Infomaniak: "job",
  Projets: "self",
};

/** Faits injectés dans chaque étape (paramètres ICU de tour.steps.<id>.text). */
async function stepValues(locale: AppLocale): Promise<Record<TourStepId, Values>> {
  const format = await getFormatter({ locale });
  const tSources = await getTranslations({ locale, namespace: "pro.skills.sources" });
  const tContact = await getTranslations({ locale, namespace: "pro.contact" });
  const { work } = profile;

  // Le mur des diplômes, du plus ancien au plus récent : « le dernier » = le cadre de droite
  const diplomas = [...profile.education].sort((a, b) => a.startYear - b.startYear);
  const last = diplomas.at(-1);
  const top = skillSourceStats().counts[0];
  const project = profile.projects[0];
  // profile.travels : du plus récent au plus ancien (le jeu va du plus ancien au plus récent)
  const latest = profile.travels[0];
  const lol = profile.gaming.leagueOfLegends;

  return {
    hello: { guide: profile.guideName, name: profile.firstName },
    parcours: {
      count: diplomas.length,
      currentSchool: last?.school.shortName ?? "",
      status: last?.status === "in-progress" ? "ongoing" : "done",
    },
    experience: {
      company: work.company,
      rate: format.number(work.ratePercent / 100, { style: "percent" }),
    },
    competences: {
      top: top ? tSources(top.source) : "",
      topCount: top?.count ?? 0,
      topKind: top ? SOURCE_KIND[top.source] : "self",
    },
    projets: {
      project: project?.name ?? "",
      kind: project?.kind ?? "personal",
      // Clin d'œil propre à un projet (ICU select : id sans tiret), rien pour les autres
      joke: project ? project.id.replace(/-/g, "_") : "none",
    },
    // Libellé du bouton « M'écrire » de la section (même texte que la page)
    contact: { button: tContact("email") },
    voyages: { latest: latest ? tripLabel(latest, locale) : "" },
    musique: {
      genre: inSentence(pick(profile.music.genre, locale), locale),
      role: lol ? pick(lol.role, locale) : "none",
    },
    // Dernier niveau du jeu = voyage le plus récent (catalog.ts)
    course: { last: latest ? tripLabel(latest, locale) : "" },
    questions: {},
  };
}

/** « Busan », « Brighton & Dubrovnik ». */
function tripLabel(trip: Travel, locale: AppLocale): string {
  return trip.places.map((place) => pick(place.city, locale)).join(" & ");
}

export async function TourRoot({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: "tour" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const values = await stepValues(locale);
  const total = TOUR_LENGTH;

  const steps: TourStepText[] = TOUR_STEPS.map(({ id }, index) => {
    const step = { current: index + 1, total };
    const title = t(`steps.${id}.title`, { guide: profile.guideName });
    const text = t(`steps.${id}.text`, values[id]);
    const nextKey = id in NEXT_KEYS ? NEXT_KEYS[id as keyof typeof NEXT_KEYS] : null;
    const next = nextKey ? t(nextKey) : t("dialog.next");
    const actionKey = id in ACTION_KEYS ? ACTION_KEYS[id as keyof typeof ACTION_KEYS] : null;
    return {
      id,
      title,
      text,
      next,
      ...(actionKey ? { action: t(actionKey) } : {}),
      counter: t("dialog.counter", step),
      counterLabel: t("dialog.counterLabel", step),
      live: t("dialog.live", { ...step, title, text }),
      resume: t("chip.resume", step),
      resumeLabel: t("chip.resumeLabel", step),
      expand: t("dialog.expand", step),
      expandLabel: t("dialog.expandLabel", step),
    };
  });

  const labels: TourLabels = {
    guide: tCommon("avatar.guideLabel"),
    kicker: t("dialog.kicker"),
    previous: t("dialog.previous"),
    quit: t("dialog.quit"),
    minimize: t("dialog.minimize"),
    keys: t("dialog.keys"),
    travelling: Object.fromEntries(
      PAGE_IDS.map((id) => [id, t("dialog.travelling", { page: tCommon(`nav.${id}`) })]),
    ) as Record<PageId, string>,
    paused: t("chip.label"),
  };

  return <TourLoader steps={steps} labels={labels} />;
}
