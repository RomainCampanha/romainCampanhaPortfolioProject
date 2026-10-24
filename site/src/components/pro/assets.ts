// Visuels de la page Pro (fichiers WebP 128 px dans public/, issus de l'ancien site).

/** Logos des écoles, par id de formation (profile.education[].id). null = monogramme. */
export const SCHOOL_LOGOS: Record<string, string | null> = {
  cfpt: "/brand/cfpt.webp",
  // L'ancien site utilisait les armoiries genevoises pour l'ESIG (école cantonale).
  esig: "/brand/esig.webp",
  heg: null, // TODO: logo HEG Genève (pas de fichier fourni)
};

export const COMPANY_LOGO = "/brand/infomaniak.webp";

/**
 * Icônes des compétences (ancien site), par nom anglais (profile.skillGroups[].skills[].name.en).
 * Pas d'icône = puce texte seule (rien d'inventé, pas de logo approximatif).
 */
export const SKILL_ICONS: Record<string, string> = {
  React: "/skills/react.webp",
  "Next.js": "/skills/nextjs.webp",
  "Tailwind CSS": "/skills/tailwindcss.webp",
  "Node.js": "/skills/nodejs.webp",
  PHP: "/skills/php.webp",
  Python: "/skills/python.webp",
  "C#": "/skills/csharp.webp",
  MySQL: "/skills/mysql.webp",
  "Domain Name System (DNS)": "/skills/dns.webp",
  "Web hosting": "/skills/hosting.webp",
};
