import { getFormatter, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile, type Education } from "@/content/profile";
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

/** Première lettre en minuscule (milieu de phrase), sauf sigle (« CFPT », « L2 »). */
function lowerFirst(text: string): string {
  const second = text[1] ?? "";
  const acronym = /\d/.test(second) || (second !== second.toLowerCase() && second === second.toUpperCase());
  return acronym ? text : `${text[0]?.toLowerCase() ?? ""}${text.slice(1)}`;
}

/**
 * Complément de titre d'un diplôme (ex. « Professional Bachelor ») : ce qui suit le titre
 * protégé (nativeTitle) dans le titre complet. "none" s'il n'y en a pas.
 */
function titleSupplement(education: Education | undefined): string {
  const native = education?.nativeTitle;
  const full = education?.title.fr;
  if (!native || !full?.startsWith(native)) return "none";
  return full.slice(native.length).replace(/^[\s,]+/, "") || "none";
}

/** Faits injectés dans chaque étape (paramètres ICU de tour.steps.<id>.text). */
async function stepValues(locale: AppLocale): Promise<Record<TourStepId, Values>> {
  const format = await getFormatter({ locale });
  const tSources = await getTranslations({ locale, namespace: "pro.skills.sources" });
  const { work } = profile;

  const diplomas = [...profile.education].sort((a, b) => a.startYear - b.startYear);
  const current = diplomas.find((e) => e.status === "in-progress") ?? diplomas.at(-1);
  const [first, second] = diplomas.filter((e) => e !== current);
  const diploma = (e: Education | undefined) => (e ? inSentence(pick(e.shortTitle, locale), locale) : "");

  const { total, counts } = skillSourceStats();
  const top = counts[0];
  const project = profile.projects[0];
  const withPhotos = profile.travels.filter((trip) => trip.photos === "available");
  const latest = profile.travels[0];

  return {
    hello: { guide: profile.guideName, name: profile.firstName },
    parcours: {
      first: diploma(first),
      firstSchool: first?.school.shortName ?? "",
      second: diploma(second),
      secondSchool: second?.school.shortName ?? "",
      supplement: titleSupplement(second),
      current: diploma(current),
      currentSchool: current?.school.shortName ?? "",
    },
    experience: {
      company: work.company,
      rate: format.number(work.ratePercent / 100, { style: "percent" }),
      role: inSentence(pick(work.role, locale), locale),
      description: pick(work.description, locale),
    },
    competences: {
      count: total,
      top: top ? tSources(top.source) : "",
      topCount: top?.count ?? 0,
    },
    projets: {
      project: project?.name ?? "",
      kind: project?.kind ?? "personal",
      context: project ? lowerFirst(pick(project.context, locale)) : "",
      description: project ? pick(project.description, locale) : "",
      // Clin d'œil propre à un projet (ICU select : id sans tiret), rien pour les autres
      joke: project ? project.id.replace(/-/g, "_") : "none",
    },
    contact: {},
    voyages: {
      count: withPhotos.length,
      latest: latest ? latest.places.map((place) => pick(place.city, locale)).join(" & ") : "",
      year: latest?.year ?? "none",
    },
    musique: {
      genre: inSentence(pick(profile.music.genre, locale), locale),
      artists: format.list(profile.music.favoriteArtists, { type: "conjunction" }),
      games: format.list(profile.gaming.games, { type: "conjunction" }),
    },
    course: { guide: profile.guideName, start: pick(profile.location, locale) },
    questions: { name: profile.firstName },
  };
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
