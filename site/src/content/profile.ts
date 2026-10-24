import { z } from "zod";
import type { AppLocale } from "@/i18n/routing";
import { ageInGeneva } from "@/lib/age";

// Source de vérité du contenu "profil" (pages, prompt système du chat, SEO).
// Règle : ne jamais inventer. Ce qui n'est pas connu reste null / [] avec un commentaire TODO.
// Le texte est rédigé à la 1re personne (c'est Romain / Rominou qui parle).

/* ------------------------------------------------------------------ */
/* Schémas                                                             */
/* ------------------------------------------------------------------ */

export const localizedSchema = z.object({ fr: z.string(), en: z.string() });
export type Localized<T = string> = { fr: T; en: T };

/** Choisit la valeur dans la langue demandée. */
export function pick<T>(value: Localized<T>, locale: AppLocale): T {
  return value[locale];
}

export const SKILL_GROUP_IDS = [
  "frontend",
  "fullstack",
  "languages",
  "infrastructure",
] as const;
export type SkillGroupId = (typeof SKILL_GROUP_IDS)[number];

// Destinations avec photos (= dossiers de photos, cf. src/content/photos.ts)
export const TRAVEL_IDS = [
  "busan",
  "berlin",
  "tokyo",
  "shanghai",
  "paris",
  "brighton-dubrovnik",
  "toronto",
  "seoul",
] as const;
export type TravelId = (typeof TRAVEL_IDS)[number];

export const HOBBY_IDS = ["music", "gaming", "coding", "travel"] as const;
export type HobbyId = (typeof HOBBY_IDS)[number];

const placeSchema = z.object({
  city: localizedSchema,
  country: localizedSchema.nullable(),
  /** ISO 3166-1 alpha-2 */
  countryCode: z.string().length(2).nullable(),
});
export type Place = z.infer<typeof placeSchema>;

const educationSchema = z.object({
  id: z.string(),
  title: localizedSchema,
  /** Intitulé court (fiche "En bref", mur des diplômes), ex. "CFC", "Bachelor HES-SO". */
  shortTitle: localizedSchema,
  /** Appellation courante utilisée par Romain */
  nickname: localizedSchema.nullable(),
  school: z.object({
    name: localizedSchema,
    shortName: z.string(),
    city: localizedSchema,
  }),
  startYear: z.number().int(),
  endYear: z.number().int().nullable(),
  status: z.enum(["in-progress", "obtained"]),
  details: localizedSchema.nullable(),
});
export type Education = z.infer<typeof educationSchema>;

const travelSchema = z.object({
  id: z.enum(TRAVEL_IDS),
  places: z.array(placeSchema).min(1),
  year: z.number().int().nullable(),
  /** "coming" : photos pas encore disponibles */
  photos: z.enum(["available", "coming"]),
  anecdotes: z.array(localizedSchema),
});
export type Travel = z.infer<typeof travelSchema>;

export const profileSchema = z.object({
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  /** Nom de l'avatar 3D / guide du site */
  guideName: z.string(),
  /** Publique (choix de Romain) : le chat peut la donner, la page Pro affiche l'âge. */
  birthDate: z.iso.date(),
  birthPlace: localizedSchema,
  location: localizedSchema,
  headline: localizedSchema,
  /** Phrase perso de la bio (page Pro), à la 1re personne. */
  aboutMe: localizedSchema,
  work: z.object({
    company: z.string(),
    url: z.url(),
    role: localizedSchema,
    /** "YYYY-MM" */
    since: z.string().regex(/^\d{4}-\d{2}$/),
    /** Taux d'activité actuel en % */
    ratePercent: z.number().int().min(0).max(100),
  }),
  education: z.array(educationSchema),
  languages: z.array(
    z.object({ name: localizedSchema, level: localizedSchema.nullable() }),
  ),
  skillGroups: z.array(
    z.object({
      id: z.enum(SKILL_GROUP_IDS),
      label: localizedSchema,
      skills: z.array(z.string()).min(1),
    }),
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      /** null tant que le site n'est pas en ligne / l'URL pas confirmée : aucun lien affiché. */
      url: z.url().nullable(),
      description: localizedSchema,
      /** L'idée du projet en une phrase (optionnel). */
      pitch: localizedSchema.nullable(),
      stack: z.array(z.string()),
    }),
  ),
  travels: z.array(travelSchema),
  otherCities: z.array(placeSchema),
  hobbies: z.array(
    z.object({
      id: z.enum(HOBBY_IDS),
      label: localizedSchema,
      description: localizedSchema,
    }),
  ),
  music: z.object({
    genre: localizedSchema,
    favoriteArtists: z.array(z.string()),
    tracks: z.array(z.object({ title: z.string(), src: z.string() })),
  }),
  gaming: z.object({
    games: z.array(z.string()),
    leagueOfLegends: z
      .object({
        summonerName: z.string(),
        rank: z.string().nullable(),
        mains: z.array(z.string()),
      })
      .nullable(),
  }),
  funFacts: z.array(localizedSchema),
  /** Personnes que le chatbot peut mentionner si on le lui demande */
  people: z.array(
    z.object({
      name: z.string(),
      relation: localizedSchema,
      description: localizedSchema,
    }),
  ),
  links: z.object({
    email: z.email(),
    linkedin: z.url(),
    instagram: z.url(),
    github: z.url().nullable(),
    website: z.url(),
  }),
});

export type Profile = z.infer<typeof profileSchema>;

/* ------------------------------------------------------------------ */
/* Données                                                             */
/* ------------------------------------------------------------------ */

const geneva: Localized = { fr: "Genève", en: "Geneva" };

const place = (
  city: Localized,
  country: Localized | null,
  countryCode: string | null,
): Place => ({ city, country, countryCode });

const same = (value: string): Localized => ({ fr: value, en: value });

/**
 * Typographie française : espace insécable avant « : » et dans les guillemets,
 * espace fine insécable avant ; ! ? (évite un "!" seul en début de ligne).
 */
export function frenchTypography(text: string): string {
  return text
    .replace(/ ([;!?])/g, " $1")
    .replace(/ :/g, " :")
    .replace(/« /g, "« ")
    .replace(/ »/g, " »");
}

/** Applique frenchTypography à toutes les valeurs `fr` des objets { fr, en } (récursif). */
function withFrenchTypography<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withFrenchTypography) as T;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([key, v]) => [
      key,
      key === "fr" && typeof v === "string" ? frenchTypography(v) : withFrenchTypography(v),
    ]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

export const profile: Profile = profileSchema.parse(withFrenchTypography({
  name: "Romain Campanha",
  firstName: "Romain",
  lastName: "Campanha",
  guideName: "Rominou",
  birthDate: "2002-04-16",
  birthPlace: geneva,
  location: geneva,
  headline: {
    fr: "Support technique hosting L2 chez Infomaniak et étudiant en informatique de gestion à Genève",
    en: "L2 hosting technical support at Infomaniak and Business IT student in Geneva",
  },
  aboutMe: {
    fr: "Côté perso, j'aime coder, voyager, écouter du rap français… et la chasse, mais seulement dans l'assiette.",
    en: "Outside work, I love coding, travelling, French rap… and “la chasse”: game meat, on my plate only.",
  },

  work: {
    company: "Infomaniak",
    url: "https://www.infomaniak.com",
    role: {
      fr: "Support technique hosting L2",
      en: "L2 hosting technical support",
    },
    since: "2023-03",
    ratePercent: 70,
  },

  // Du plus récent au plus ancien ("mur des diplômes")
  education: [
    {
      id: "heg",
      title: {
        fr: "Bachelor of Science HES-SO en Informatique de gestion",
        en: "Bachelor of Science HES-SO in Business Information Technology",
      },
      shortTitle: { fr: "Bachelor HES-SO", en: "HES-SO Bachelor" },
      nickname: null,
      school: {
        name: {
          fr: "Haute école de gestion de Genève",
          en: "Geneva School of Business Administration",
        },
        shortName: "HEG Genève",
        city: geneva,
      },
      startYear: 2025,
      endYear: null,
      status: "in-progress",
      details: {
        fr: "En emploi, à temps partiel — actuellement en 2e année.",
        en: "Part-time, alongside work — currently in 2nd year.",
      },
    },
    {
      id: "esig",
      // TODO: confirmer l'intitulé officiel exact du diplôme
      title: {
        fr: "Informaticien de gestion diplômé ES",
        en: "Business IT specialist, Advanced Federal Diploma of Higher Education (Professional Bachelor ES)",
      },
      shortTitle: { fr: "Diplôme ES", en: "ES diploma" },
      nickname: {
        fr: "Bachelor professionnel ES",
        en: "ES Professional Bachelor",
      },
      school: {
        // Nom officiel en français (pas de traduction officielle connue)
        name: same("École supérieure d'informatique de gestion"),
        shortName: "ESIG",
        city: geneva,
      },
      startYear: 2023,
      endYear: 2025,
      status: "obtained",
      details: null,
    },
    {
      id: "cfpt",
      title: {
        fr: "CFC d'informaticien développeur d'applications",
        en: "Federal VET Diploma (CFC) in application development",
      },
      shortTitle: same("CFC"),
      nickname: null,
      school: {
        name: same("Centre de formation professionnelle technique"),
        shortName: "CFPT",
        city: geneva,
      },
      startYear: 2017,
      endYear: 2022,
      status: "obtained",
      details: null,
    },
  ],

  languages: [
    {
      name: { fr: "Français", en: "French" },
      level: { fr: "Langue maternelle", en: "Native" },
    },
    // TODO: niveau d'anglais à confirmer
    { name: { fr: "Anglais", en: "English" }, level: null },
  ],

  skillGroups: [
    {
      id: "frontend",
      label: same("Frontend"),
      skills: ["React", "Next.js", "Tailwind CSS"],
    },
    {
      id: "fullstack",
      label: same("Full stack"),
      skills: ["Node.js", "PHP"],
    },
    {
      id: "languages",
      label: { fr: "Langages", en: "Languages" },
      skills: ["Python", "C#"],
    },
    {
      id: "infrastructure",
      label: same("Infrastructure"),
      skills: ["MySQL", "DNS", "Web hosting"],
    },
  ],

  projects: [
    {
      id: "gesoif",
      name: "gesoif.ch",
      // TODO(Romain): remettre "https://gesoif.ch" une fois le site en ligne. Le domaine ne
      // répondait pas (NXDOMAIN) le 2026-10-24 ; un site homonyme "GE-Soif" existe sur
      // ge-soif.ch (lien avec Romain inconnu). En attendant : pas de bouton "Visiter".
      url: null,
      description: {
        fr: "Un site qui recense les fontaines d'eau potable à Genève.",
        en: "A website listing drinking-water fountains in Geneva.",
      },
      pitch: {
        fr: "L'idée : savoir où boire un coup d'eau fraîche (ou remplir sa gourde) quand on se balade en ville.",
        en: "The idea: knowing where to grab a sip of fresh water (or refill your bottle) while walking around town.",
      },
      // TODO: stack technique et détails du projet.
      stack: [],
    },
  ],

  // Du plus récent au plus ancien. Années tirées des dates EXIF des photos.
  travels: [
    {
      id: "busan",
      places: [
        place({ fr: "Busan", en: "Busan" }, { fr: "Corée du Sud", en: "South Korea" }, "KR"),
      ],
      year: 2026,
      photos: "available",
      anecdotes: [],
    },
    {
      id: "berlin",
      places: [place(same("Berlin"), { fr: "Allemagne", en: "Germany" }, "DE")],
      year: 2026,
      photos: "available",
      anecdotes: [],
    },
    {
      id: "tokyo",
      places: [place(same("Tokyo"), { fr: "Japon", en: "Japan" }, "JP")],
      year: 2026,
      photos: "available",
      anecdotes: [],
    },
    {
      id: "shanghai",
      places: [place(same("Shanghai"), { fr: "Chine", en: "China" }, "CN")],
      year: 2026,
      photos: "available",
      anecdotes: [
        {
          fr: "Les gens fument à l'intérieur des restaurants… ça m'a vraiment choqué !",
          en: "People smoke inside restaurants… that really shocked me!",
        },
      ],
    },
    {
      id: "paris",
      places: [place(same("Paris"), same("France"), "FR")],
      year: 2025,
      photos: "available",
      anecdotes: [],
    },
    {
      id: "brighton-dubrovnik",
      places: [
        place(same("Brighton"), { fr: "Royaume-Uni", en: "United Kingdom" }, "GB"),
        place(same("Dubrovnik"), { fr: "Croatie", en: "Croatia" }, "HR"),
      ],
      year: 2024,
      photos: "available",
      anecdotes: [],
    },
    {
      id: "toronto",
      places: [place(same("Toronto"), same("Canada"), "CA")],
      year: 2024,
      photos: "available",
      anecdotes: [],
    },
    {
      id: "seoul",
      places: [
        place({ fr: "Séoul", en: "Seoul" }, { fr: "Corée du Sud", en: "South Korea" }, "KR"),
      ],
      year: 2023,
      photos: "available",
      anecdotes: [],
    },
  ],

  otherCities: [
    place(same("Santiago"), null, null), // TODO: confirmer le pays (Chili ?)
    place({ fr: "New York", en: "New York" }, { fr: "États-Unis", en: "United States" }, "US"),
    place(same("Rome"), { fr: "Italie", en: "Italy" }, "IT"),
    place(same("Milan"), { fr: "Italie", en: "Italy" }, "IT"),
    place({ fr: "Londres", en: "London" }, { fr: "Royaume-Uni", en: "United Kingdom" }, "GB"),
    place({ fr: "Barcelone", en: "Barcelona" }, { fr: "Espagne", en: "Spain" }, "ES"),
    place({ fr: "Lisbonne", en: "Lisbon" }, same("Portugal"), "PT"),
    place(same("Porto"), same("Portugal"), "PT"),
    place(same("Split"), { fr: "Croatie", en: "Croatia" }, "HR"),
    place(same("Amsterdam"), { fr: "Pays-Bas", en: "Netherlands" }, "NL"),
  ],

  hobbies: [
    {
      id: "music",
      label: { fr: "Rap français", en: "French rap" },
      description: {
        fr: "Fan de Vald et Damso, et je fais aussi des sons avec des potes.",
        en: "Big fan of Vald and Damso, and I also make tracks with friends.",
      },
    },
    {
      id: "gaming",
      label: { fr: "Jeux vidéo", en: "Video games" },
      description: same("League of Legends, Overwatch, Cyberpunk 2077."),
    },
    {
      id: "coding",
      label: { fr: "Code", en: "Coding" },
      description: {
        fr: "Coder des projets perso, comme gesoif.ch.",
        en: "Building side projects, like gesoif.ch.",
      },
    },
    {
      id: "travel",
      label: { fr: "Voyages", en: "Travel" },
      description: {
        fr: "De Séoul à Toronto en passant par Dubrovnik : j'adore découvrir de nouvelles villes.",
        en: "From Seoul to Toronto via Dubrovnik: I love discovering new cities.",
      },
    },
  ],

  music: {
    genre: { fr: "Rap français", en: "French rap" },
    favoriteArtists: ["Vald", "Damso"],
    tracks: [], // TODO: liste des sons de Romain et ses potes
  },

  gaming: {
    games: ["League of Legends", "Overwatch", "Cyberpunk 2077"],
    leagueOfLegends: null, // TODO: détails de la carte LoL (pseudo, rang, mains)
  },

  funFacts: [
    {
      fr: "Mon plat préféré : la chasse (le gibier de saison, une vraie tradition romande).",
      en: "My favourite dish: “la chasse”, seasonal game meat — a real French-speaking Swiss tradition.",
    },
    { fr: "J'aime le bon vin.", en: "I enjoy good wine." },
    { fr: "Je ne suis pas un grand cuisinier.", en: "I'm not a great cook." },
    {
      fr: "J'ai un gros accent français quand je parle anglais.",
      en: "I have a strong French accent when I speak English.",
    },
    { fr: "J'ai les cheveux bouclés.", en: "I have curly hair." },
  ],

  people: [], // TODO: personnes que le chatbot peut mentionner

  links: {
    email: "contact@romaincampanha.ch",
    linkedin: "https://www.linkedin.com/in/romain-c-9159ba267/",
    instagram: "https://www.instagram.com/romain_yehhh/",
    github: null, // TODO: lien GitHub
    website: "https://romaincampanha.ch",
  },
}));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Âge de Romain à la date `at` (calendrier genevois). Dans une page statique, new Date()
 * est figé au build : l'affichage passe par <Age>, qui le recalcule dans le navigateur.
 */
export function getAge(at: Date = new Date()): number {
  return ageInGeneva(profile.birthDate, at);
}

/** Libellé "Ville, Pays" localisé. */
export function formatPlace(p: Place, locale: AppLocale): string {
  const city = pick(p.city, locale);
  return p.country ? `${city}, ${pick(p.country, locale)}` : city;
}

export function getTravel(id: TravelId): Travel | undefined {
  return profile.travels.find((t) => t.id === id);
}
