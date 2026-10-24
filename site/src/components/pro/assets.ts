import type { Localized } from "@/content/profile";

// Visuels de la page Pro (fichiers WebP 128 px dans public/, issus de l'ancien site).

/** Logos des écoles, par id de formation (profile.education[].id). null = monogramme. */
export const SCHOOL_LOGOS: Record<string, string | null> = {
  cfpt: "/brand/cfpt.webp",
  // L'ancien site utilisait les armoiries genevoises pour l'ESIG (école cantonale).
  esig: "/brand/esig.webp",
  heg: null, // TODO: logo HEG Genève (pas de fichier fourni)
};

export const COMPANY_LOGO = "/brand/infomaniak.webp";

type SkillVisual = {
  icon: string;
  /** Libellé traduit si le nom technique ne suffit pas. */
  label?: Localized;
};

/** Icône (et libellé traduit éventuel) par nom de compétence (profile.skillGroups[].skills). */
export const SKILL_VISUALS: Record<string, SkillVisual> = {
  React: { icon: "/skills/react.webp" },
  "Next.js": { icon: "/skills/nextjs.webp" },
  "Tailwind CSS": { icon: "/skills/tailwindcss.webp" },
  "Node.js": { icon: "/skills/nodejs.webp" },
  PHP: { icon: "/skills/php.webp" },
  Python: { icon: "/skills/python.webp" },
  "C#": { icon: "/skills/csharp.webp" },
  MySQL: { icon: "/skills/mysql.webp" },
  DNS: {
    icon: "/skills/dns.webp",
    label: { fr: "Noms de domaine (DNS)", en: "Domain names (DNS)" },
  },
  "Web hosting": {
    icon: "/skills/hosting.webp",
    label: { fr: "Hébergement web", en: "Web hosting" },
  },
};
