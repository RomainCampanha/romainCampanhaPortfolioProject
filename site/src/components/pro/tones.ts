import { profile, SKILL_SOURCES, type Education, type SkillGroupId, type SkillSource } from "@/content/profile";
import type { IconName, Tone } from "@/components/ui";

// Présentation de la page Pro (couleurs et icônes) : les FAITS restent dans profile.ts.
// Convention du design system : sage = ESIG, peach = CFPT, lilac = HEG / études,
// lake = Infomaniak / job, butter = autodidacte / en cours.

/** Ton de l'étiquette de provenance d'une compétence (et de la barre « D'où viennent mes compétences »). */
export const SOURCE_TONES: Record<SkillSource, Tone> = {
  ESIG: "sage",
  CFPT: "peach",
  HEG: "lilac",
  Infomaniak: "lake",
  Projets: "butter",
};

/** Cadre du mur des diplômes, par formation (profile.education[].id). */
const EDUCATION_TONES: Record<string, Tone> = {
  cfpt: "peach",
  esig: "sage",
  heg: "lilac",
};
const FALLBACK_TONES: Tone[] = ["peach", "sage", "lilac", "lake", "butter"];

export function educationTone(education: Education, index: number): Tone {
  return EDUCATION_TONES[education.id] ?? FALLBACK_TONES[index % FALLBACK_TONES.length];
}

/** Pastille de chaque groupe de compétences (« Mon inventaire »). */
export const SKILL_GROUP_STYLE: Record<SkillGroupId, { icon: IconName; tone: Tone }> = {
  programming: { icon: "code", tone: "peach" },
  web: { icon: "globe", tone: "butter" },
  databases: { icon: "database", tone: "sage" },
  infrastructure: { icon: "cloud", tone: "lake" },
  "project-management": { icon: "board", tone: "lilac" },
  business: { icon: "scale", tone: "peach" },
};

export type SourceCount = { source: SkillSource; count: number };

/**
 * Statistiques de provenance, calculées depuis profile.ts : nombre de compétences, et pour
 * chaque provenance le nombre de compétences acquises là (une compétence peut en avoir plusieurs,
 * d'où `overlap`). Provenances absentes ignorées, triées de la plus fréquente à la moins fréquente.
 */
export function skillSourceStats(): { total: number; counts: SourceCount[]; overlap: boolean } {
  const skills = profile.skillGroups.flatMap((group) => group.skills);
  const counts = SKILL_SOURCES.map((source) => ({
    source,
    count: skills.filter((skill) => skill.sources.includes(source)).length,
  }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);
  return { total: skills.length, counts, overlap: skills.some((skill) => skill.sources.length > 1) };
}
