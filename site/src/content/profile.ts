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
  "programming",
  "web",
  "databases",
  "infrastructure",
  "project-management",
  "business",
] as const;
export type SkillGroupId = (typeof SKILL_GROUP_IDS)[number];

/**
 * Où la compétence a été acquise (cf. LinkedIn de Romain) : une école, le job,
 * ou "Projets" (projets perso / autodidacte).
 */
export const SKILL_SOURCES = ["ESIG", "CFPT", "HEG", "Infomaniak", "Projets"] as const;
export type SkillSource = (typeof SKILL_SOURCES)[number];

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
  /**
   * Nom de la ville dans son écriture d'origine (ex. 서울), affiché à côté du nom latin
   * (carte d'embarquement). Seulement pour une écriture couverte par une police du site :
   * le coréen (Jua). Pas de japonais ni de chinois (aucune police CJK embarquée).
   */
  nativeName: z.object({ text: z.string(), lang: z.literal("ko") }).optional(),
});
export type Place = z.infer<typeof placeSchema>;

const skillSchema = z.object({
  /** Nom affiché (identique en fr/en pour les noms techniques). */
  name: localizedSchema,
  /** Où la compétence a été acquise (plusieurs possibles). */
  sources: z.array(z.enum(SKILL_SOURCES)).min(1),
});
export type Skill = z.infer<typeof skillSchema>;

const educationSchema = z.object({
  id: z.string(),
  title: localizedSchema,
  /**
   * Titre protégé dans sa langue d'origine (français), quand `title.en` n'en est qu'une
   * traduction descriptive : affiché entre parenthèses (lang="fr") après le titre anglais.
   */
  nativeTitle: z.string().optional(),
  /** Intitulé court (fiche "En bref", mur des diplômes), ex. "CFC", "Bachelor HES-SO". */
  shortTitle: localizedSchema,
  /** Domaine d'études, en minuscules dans une phrase (accroche Pro : « étudiant en … »). */
  field: localizedSchema,
  school: z.object({
    /** Nom complet ; identique en fr et en = nom officiel français, sans traduction (lang="fr"). */
    name: localizedSchema,
    /** Sigle, sans la ville (ex. "HEG") : la ville est affichée à côté (« HEG · Genève »). */
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
  /** Titre de son profil LinkedIn (tel quel en français). */
  linkedinHeadline: localizedSchema,
  /** Phrase perso de la bio (page Pro), à la 1re personne. */
  aboutMe: localizedSchema,
  work: z.object({
    company: z.string(),
    url: z.url(),
    role: localizedSchema,
    /** Ce que Romain fait concrètement (ses mots), à la 1re personne. */
    description: localizedSchema,
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
      skills: z.array(skillSchema).min(1),
    }),
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      /** null tant que le site n'est pas en ligne / l'URL pas confirmée : aucun lien affiché. */
      url: z.url().nullable(),
      /** "school" : projet réalisé dans le cadre d'une formation ; "personal" : projet perso. */
      kind: z.enum(["school", "personal"]),
      /** Cadre du projet, en une phrase (ex. "Réalisé au CFPT pendant mon CFC"). */
      context: localizedSchema,
      /** Année de participation de Romain (null = inconnue). */
      year: z.number().int().nullable(),
      description: localizedSchema,
      /** L'idée du projet en une phrase (optionnel). */
      pitch: localizedSchema.nullable(),
      /** Fonctionnalités / faits marquants, constatés sur le site (rien d'inventé). */
      highlights: z.array(localizedSchema),
      stack: z.array(z.string()),
      /** Capture d'écran (public/projects/), dimensions intrinsèques en px. */
      image: z
        .object({
          src: z.string().startsWith("/projects/"),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
          alt: localizedSchema,
        })
        .nullable(),
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
  /** Romain ÉCOUTE du rap français : il ne fait pas de musique lui-même. */
  music: z.object({
    genre: localizedSchema,
    favoriteArtists: z.array(z.string()),
    /** Ses sons préférés (d'autres artistes), à partager plus tard sur le site. */
    favoriteTracks: z.array(
      z.object({ title: z.string(), artist: z.string(), url: z.url().nullable() }),
    ),
  }),
  gaming: z.object({
    games: z.array(z.string()).min(1),
    leagueOfLegends: z
      .object({
        /** Rôle principal (ex. mid) */
        role: localizedSchema,
        /** Meilleur rang atteint */
        peakRank: localizedSchema,
        /** Champions préférés */
        champions: z.array(z.string()).min(1),
        /**
         * Confidentialité : JAMAIS de pseudo de jeu ni de lien vers un site de stats.
         * Seul alias autorisé, et seulement si c'est vraiment nécessaire : "Keresko"
         * (null = ne nommer aucun pseudo, à préférer).
         */
        alias: z.literal("Keresko").nullable(),
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
  nativeName?: Place["nativeName"],
): Place => ({ city, country, countryCode, ...(nativeName ? { nativeName } : {}) });

const same = (value: string): Localized => ({ fr: value, en: value });

/** Compétence : nom (chaîne = identique en fr/en) + provenance(s). */
const skill = (name: string | Localized, ...sources: [SkillSource, ...SkillSource[]]): Skill => ({
  name: typeof name === "string" ? same(name) : name,
  sources,
});

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
  linkedinHeadline: {
    fr: "Informaticien - Support IT",
    en: "IT specialist - IT support",
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
    description: {
      fr: "J'aide les clients à résoudre leurs problèmes de niveau 1 et 2 liés à l'hébergement de leur site web, et je contribue en interne à l'amélioration des produits.",
      en: "I help customers solve level 1 and 2 issues with their website hosting, and I contribute internally to improving the products.",
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
      field: { fr: "informatique de gestion", en: "Business IT" },
      school: {
        name: {
          fr: "Haute école de gestion de Genève",
          en: "Geneva School of Business Administration",
        },
        shortName: "HEG",
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
      // Titre protégé + complément de titre "Professional Bachelor", autorisé pour tous les
      // diplômes ES depuis le 1.10.2026 (après le titre, séparé par une virgule) :
      // https://www.sbfi.admin.ch/fr/faq-paquet-de-mesures-formation-professionnelle-superieure-diplomes
      // En anglais : "Professional Bachelor in <filière>". TODO : reprendre le nom anglais
      // officiel de la filière, fixé d'ici au printemps 2027 dans le plan d'études cadre.
      title: {
        fr: "Informaticien de gestion diplômé ES, Professional Bachelor",
        en: "Professional Bachelor in Business IT",
      },
      nativeTitle: "Informaticien de gestion diplômé ES",
      shortTitle: { fr: "Diplôme ES", en: "ES diploma" },
      field: { fr: "informatique de gestion", en: "Business IT" },
      school: {
        // Nom officiel en français (pas de traduction officielle connue)
        name: same("École supérieure d'informatique de gestion"),
        shortName: "ESIG",
        city: geneva,
      },
      startYear: 2023,
      endYear: 2025,
      status: "obtained",
      details: {
        fr: "Complément « Professional Bachelor » officiel depuis 2026 pour les diplômes ES. Ce n'est pas un bachelor de haute école : d'où mon Bachelor à la HEG.",
        en: "The “Professional Bachelor” supplement became official for ES diplomas in 2026. It is not a university-level bachelor, hence my Bachelor at HEG.",
      },
    },
    {
      id: "cfpt",
      title: {
        fr: "CFC d'informaticien développeur d'applications",
        en: "Federal VET Diploma (CFC) in application development",
      },
      shortTitle: same("CFC"),
      field: { fr: "développement d'applications", en: "application development" },
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

  // Compétences de son profil LinkedIn (avec l'école / le job où il les a acquises),
  // + les technos web apprises sur ses projets, en autodidacte ("Projets").
  skillGroups: [
    {
      id: "programming",
      label: { fr: "Programmation", en: "Programming" },
      skills: [
        skill("Java", "ESIG"),
        skill("C#", "CFPT"),
        skill("Python", "ESIG"),
        skill("Visual Basic", "ESIG"),
        skill(
          { fr: "Programmation orientée objet (POO)", en: "Object-oriented programming (OOP)" },
          "ESIG",
          "CFPT",
        ),
        skill({ fr: "Élaboration de programmes", en: "Program development" }, "CFPT"),
      ],
    },
    {
      id: "web",
      label: { fr: "Développement web", en: "Web development" },
      skills: [
        skill("PHP", "ESIG", "CFPT"),
        skill("React", "Projets"),
        skill("Next.js", "Projets"),
        skill("Node.js", "Projets"),
        skill("Tailwind CSS", "Projets"),
      ],
    },
    {
      id: "databases",
      label: { fr: "Bases de données", en: "Databases" },
      skills: [
        skill("Oracle Database", "ESIG"),
        skill("Oracle SQL Developer", "ESIG"),
        skill("PostgreSQL", "ESIG"),
        skill("MySQL", "Projets"),
        skill({ fr: "Administration de bases de données", en: "Database administration" }, "ESIG"),
      ],
    },
    {
      id: "infrastructure",
      label: { fr: "Infrastructure & hébergement", en: "Infrastructure & hosting" },
      skills: [
        skill({ fr: "Hébergement web", en: "Web hosting" }, "Infomaniak"),
        skill({ fr: "Noms de domaine (DNS)", en: "Domain Name System (DNS)" }, "Infomaniak"),
        skill({ fr: "Gestion DNS", en: "DNS management" }, "Infomaniak"),
        skill({ fr: "Serveurs DNS", en: "DNS servers" }, "Infomaniak"),
        skill({ fr: "Serveurs cloud", en: "Cloud servers" }, "Infomaniak"),
        skill("Windows Server Update Services (WSUS)", "CFPT"),
      ],
    },
    {
      id: "project-management",
      label: { fr: "Gestion de projet", en: "Project management" },
      skills: [skill("Scrum", "ESIG"), skill("JIRA", "ESIG"), skill("Trello", "ESIG")],
    },
    {
      id: "business",
      label: { fr: "Gestion d'entreprise", en: "Business management" },
      skills: [
        skill({ fr: "Comptabilité", en: "Accounting" }, "ESIG"),
        skill({ fr: "Droit du travail", en: "Employment law" }, "ESIG"),
      ],
    },
  ],

  projects: [
    {
      id: "ge-soif",
      name: "GE-Soif",
      url: "https://ge-soif.ch",
      // Projet collectif des élèves d'informatique du CFPT (plusieurs volées depuis 2014,
      // cf. page "À propos" du site) : PAS un projet perso de Romain.
      kind: "school",
      context: {
        fr: "Réalisé au CFPT pendant mon CFC",
        en: "Built at the CFPT during my CFC (Federal VET Diploma)",
      },
      year: null, // TODO(Romain): année(s) de participation et ce qu'il y a fait
      // Contenu vérifié sur https://ge-soif.ch (accueil + "À propos") le 2026-10-24.
      description: {
        fr: "Une application web participative pour trouver une fontaine d'eau potable à Genève (et ailleurs), directement depuis son téléphone.",
        en: "A collaborative web app to find a drinking-water fountain in Geneva (and beyond), right from your phone.",
      },
      pitch: {
        fr: "Un projet collectif des élèves d'informatique du CFPT, né d'une balade à vélo où la gourde s'est vidée plus vite que prévu… sans aucune fontaine en vue.",
        en: "A group project by the CFPT's IT students, born on a bike ride when the water bottle ran dry sooner than planned… with no fountain in sight.",
      },
      highlights: [
        {
          fr: "Carte des fontaines autour de toi, avec l'itinéraire à pied",
          en: "A map of the fountains around you, with walking directions",
        },
        {
          fr: "Participatif : chacun peut ajouter une fontaine (avec photo) ou en signaler une",
          en: "Collaborative: anyone can add a fountain (with a photo) or report one",
        },
        {
          fr: "Un compteur de bouteilles en PET économisées par fontaine",
          en: "A counter of plastic (PET) bottles saved at each fountain",
        },
        {
          fr: "Lancé en 2014, le projet a reçu la Distinction cantonale du développement durable (Genève, 2016)",
          en: "Launched in 2014, the project received Geneva's cantonal sustainable development award (2016)",
        },
      ],
      // TODO(Romain): stack qu'il a utilisée. Le site en ligne montre une app Vue.js,
      // une API PHP et Google Maps, mais sa version à lui n'est pas confirmée.
      stack: [],
      image: {
        src: "/projects/ge-soif.webp",
        width: 1280,
        height: 800,
        alt: {
          fr: "Capture d'écran de GE-Soif : « Localisez les fontaines autour de vous », avec l'application ouverte sur un téléphone (carte, fontaine sélectionnée, bouton « Afficher l'itinéraire »).",
          en: "Screenshot of GE-Soif: “Localisez les fontaines autour de vous” (find the fountains around you), with the app open on a phone (map, selected fountain, “show directions” button).",
        },
      },
    },
  ],

  // Du plus récent au plus ancien. Années tirées des dates EXIF des photos.
  travels: [
    {
      id: "busan",
      places: [
        place({ fr: "Busan", en: "Busan" }, { fr: "Corée du Sud", en: "South Korea" }, "KR", {
          text: "부산",
          lang: "ko",
        }),
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
        place({ fr: "Séoul", en: "Seoul" }, { fr: "Corée du Sud", en: "South Korea" }, "KR", {
          text: "서울",
          lang: "ko",
        }),
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
        fr: "Grand fan de rap français, surtout de Vald et Damso.",
        en: "Big fan of French rap, especially Vald and Damso.",
      },
    },
    {
      id: "gaming",
      label: { fr: "Jeux vidéo", en: "Video games" },
      description: {
        fr: "League of Legends (en mid), Overwatch, Cyberpunk 2077 et Pokémon Pokopia.",
        en: "League of Legends (mid lane), Overwatch, Cyberpunk 2077 and Pokémon Pokopia.",
      },
    },
    {
      id: "coding",
      label: { fr: "Code", en: "Coding" },
      description: {
        fr: "Apprendre de nouvelles technos web en autodidacte, comme React ou Next.js.",
        en: "Teaching myself new web tech, like React or Next.js.",
      },
    },
    {
      id: "travel",
      label: { fr: "Voyages", en: "Travel" },
      description: {
        fr: "De Séoul à Busan, en passant par Toronto, Paris, Shanghai, Tokyo et Berlin : j'adore découvrir de nouvelles villes.",
        en: "From Seoul to Busan, via Toronto, Paris, Shanghai, Tokyo and Berlin: I love discovering new cities.",
      },
    },
  ],

  music: {
    genre: { fr: "Rap français", en: "French rap" },
    favoriteArtists: ["Vald", "Damso"],
    favoriteTracks: [], // TODO(Romain): ses sons préférés, à partager plus tard
  },

  gaming: {
    games: ["League of Legends", "Overwatch", "Cyberpunk 2077", "Pokémon Pokopia"],
    leagueOfLegends: {
      role: same("Mid"),
      peakRank: { fr: "Platine 4", en: "Platinum 4" },
      champions: ["Sett", "Azir", "LeBlanc", "Vel'Koz"],
      alias: null, // Aucun pseudo affiché (choix de Romain)
    },
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

/**
 * Titre officiel d'une formation, en texte : en anglais, suivi du titre protégé français
 * entre parenthèses s'il existe (ex. "Professional Bachelor in Business IT (Informaticien de
 * gestion diplômé ES)"). Les pages balisent la partie française (lang="fr").
 */
export function educationTitle(e: Education, locale: AppLocale): string {
  const title = pick(e.title, locale);
  return locale === "en" && e.nativeTitle ? `${title} (${e.nativeTitle})` : title;
}

/** Nom affiché tel quel dans une page anglaise, mais en français (pas de traduction) ? */
export function isUntranslated(value: Localized): boolean {
  return value.fr === value.en;
}

/** Libellé "Ville, Pays" localisé. */
export function formatPlace(p: Place, locale: AppLocale): string {
  const city = pick(p.city, locale);
  return p.country ? `${city}, ${pick(p.country, locale)}` : city;
}

export function getTravel(id: TravelId): Travel | undefined {
  return profile.travels.find((t) => t.id === id);
}
