#!/usr/bin/env node
// Optimise les photos de voyage du site (npm run assets:photos).
//
// Entrées (par défaut) :
//   - les dossiers de l'ancien site, en lecture seule (LEGACY_SOURCES ci-dessous) ;
//   - chaque dossier photos-raw/<slug>/ (ignoré par git), où Romain dépose ses nouvelles photos.
// Sorties :
//   - public/photos/<slug>/<nn>.webp (1600 px de large) et <nn>-sm.webp (800 px) ;
//   - src/content/photos.generated.json : PhotoEntry[] (cf. src/content/photos.ts).
//
// Garanties :
//   - dédoublonnage par hash du contenu (+ empreinte visuelle pour les ré-exports identiques) ;
//   - rotation EXIF appliquée, puis TOUTES les métadonnées supprimées (EXIF/GPS, XMP, IPTC, ICC) ;
//   - ordre et noms déterministes (même entrée => mêmes fichiers, octet pour octet) ;
//   - vérification finale : aucune sortie ne contient de métadonnées.
//
// Usage :
//   node scripts/optimize-photos.mjs [options]
//     --source <dossier>=<slug>  ajoute un dossier source (répétable)
//     --raw <dossier>            racine des photos brutes (défaut : photos-raw)
//     --no-legacy                ignore les dossiers de l'ancien site
//     --dry-run                  affiche ce qui serait fait sans rien écrire
//     --check                    vérifie seulement les sorties existantes (métadonnées, JSON)

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, rmdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_ROOT = path.resolve(SITE_ROOT, "../romain-portfolio/public/PhotoSitePortfolio");

/** Dossiers de l'ancien site → slug de destination (= TravelId). */
const LEGACY_SOURCES = [
  // 1-save.jpeg : copie inutilisée de 1.jpeg (avec ses métadonnées d'origine)
  { dir: path.join(LEGACY_ROOT, "Coree"), slug: "seoul", exclude: ["1-save.jpeg"] },
  { dir: path.join(LEGACY_ROOT, "Toronto"), slug: "toronto" },
  { dir: path.join(LEGACY_ROOT, "BrightonDubrovnik"), slug: "brighton-dubrovnik" },
];

const DEFAULT_RAW_DIR = path.join(SITE_ROOT, "photos-raw");
const OUT_DIR = path.join(SITE_ROOT, "public", "photos");
const PUBLIC_PREFIX = "/photos";
const JSON_PATH = path.join(SITE_ROOT, "src", "content", "photos.generated.json");
const PROFILE_PATH = path.join(SITE_ROOT, "src", "content", "profile.ts");

const VARIANTS = /** @type {const} */ ({
  large: { width: 1600, quality: 80, suffix: "" },
  small: { width: 800, quality: 75, suffix: "-sm" },
});
const BLUR = { width: 16, quality: 40 };
const WEBP_EFFORT = 6;

const INPUT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);
// Le sharp précompilé ne décode pas le HEVC : les .heic doivent être exportés en JPEG.
const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);
const IGNORED_FILES = new Set([".gitkeep", ".ds_store", "readme.md", "thumbs.db"]);

/** Empreinte visuelle : distance (bits sur 64) en dessous de laquelle on prévient. */
const NEAR_DUPLICATE_WARN_DISTANCE = 6;

/** Noms affichés dans les alt génériques. */
const DESTINATION_LABELS = {
  seoul: { fr: "Séoul", en: "Seoul" },
  toronto: { fr: "Toronto", en: "Toronto" },
  "brighton-dubrovnik": { fr: "Brighton et Dubrovnik", en: "Brighton and Dubrovnik" },
  tokyo: { fr: "Tokyo", en: "Tokyo" },
  shanghai: { fr: "Shanghai", en: "Shanghai" },
};

// Textes alternatifs décrivant chaque photo (ce qu'on y voit, rien d'inventé).
// Clé = "<slug>/<nom du fichier source>". Sans entrée : alt générique ("Séoul — photo de
// voyage 3") ; à compléter pour chaque nouvelle photo, ex. :
//   "tokyo/IMG_0001.jpeg": { fr: "Le carrefour de Shibuya de nuit", en: "Shibuya crossing at night" },
// TODO(Romain) : relire ces descriptions (lieux exacts, personnes).
/** @type {Record<string, { fr: string; en: string }>} */
const ALT_OVERRIDES = {
  // Séoul (dossier Coree de l'ancien site ; 5.jpeg est un doublon de 3.jpeg)
  "seoul/1.jpeg": {
    fr: "Romain au bord d'un lac, devant un parc d'attractions et un immense gratte-ciel",
    en: "Romain by a lake, in front of an amusement park and a towering skyscraper",
  },
  "seoul/2.jpeg": {
    fr: "Romain dans un couloir éclairé de néons verts",
    en: "Romain in a corridor lit with green neon lights",
  },
  "seoul/3.jpeg": {
    fr: "Romain dans une ruelle bordée de maisons traditionnelles coréennes, une tour au loin",
    en: "Romain in a lane lined with traditional Korean houses, a tower in the distance",
  },
  "seoul/4.jpeg": {
    fr: "Quatre personnes de dos sur un belvédère, face à Séoul illuminée la nuit",
    en: "Four people seen from behind on a viewpoint, looking out over Seoul lit up at night",
  },
  "seoul/6.jpeg": {
    fr: "Romain accroupi à côté d'une grande peluche Hello Kitty, faisant le signe de la victoire",
    en: "Romain crouching next to a giant Hello Kitty plush, making a peace sign",
  },
  "seoul/7.jpeg": {
    fr: "Selfie de Romain dans un parc boisé, un petit groupe derrière lui",
    en: "Romain's selfie in a wooded park, a small group behind him",
  },
  "seoul/8.jpeg": {
    fr: "Romain fait un cœur avec les bras sur une terrasse en bois entourée d'arbres",
    en: "Romain making a heart with his arms on a wooden deck surrounded by trees",
  },
  "seoul/9.jpeg": {
    fr: "Romain marche dans une allée ombragée d'un parc",
    en: "Romain walking along a shady park path",
  },
  // Toronto
  "toronto/1.jpeg": {
    fr: "Romain de dos au bord d'un étang dans un parc, la tour CN au loin",
    en: "Romain seen from behind by a pond in a park, the CN Tower in the distance",
  },
  "toronto/2.jpeg": {
    fr: "Romain accoudé à une balustrade au bord de l'eau, une mouette dans le ciel",
    en: "Romain leaning on a balustrade by the water, a gull in the sky",
  },
  "toronto/3.jpeg": {
    fr: "Les grandes lettres TORONTO sur une place, entourées de gratte-ciel",
    en: "The big TORONTO letters on a square, surrounded by skyscrapers",
  },
  "toronto/4.jpeg": {
    fr: "Romain allongé à l'intérieur d'une grande sculpture en forme d'anneau",
    en: "Romain lying inside a large ring-shaped sculpture",
  },
  "toronto/5.jpeg": {
    fr: "Romain de dos devant une baie vitrée, la ville et le lac vus de très haut",
    en: "Romain seen from behind at a window, the city and the lake far below",
  },
  "toronto/6.jpeg": {
    fr: "Toronto la nuit depuis un balcon, avec la tour CN illuminée",
    en: "Toronto at night from a balcony, with the CN Tower lit up",
  },
  // Brighton et Dubrovnik
  "brighton-dubrovnik/1.jpeg": {
    fr: "Romain sur une jetée au bord de la mer, une haute tour d'observation au loin",
    en: "Romain on a seaside pier, a tall observation tower in the distance",
  },
  "brighton-dubrovnik/2.jpeg": {
    fr: "Romain dans un cloître en pierre, devant une fontaine et des bougainvilliers",
    en: "Romain in a stone cloister, in front of a fountain and bougainvillea",
  },
  "brighton-dubrovnik/3.jpeg": {
    fr: "Romain fait le signe de la victoire sur une plage bondée, des remparts en arrière-plan",
    en: "Romain making peace signs on a crowded beach, old ramparts in the background",
  },
  "brighton-dubrovnik/4.jpeg": {
    fr: "Selfie de Romain au-dessus de la vieille ville de Dubrovnik et de la mer, au coucher du soleil",
    en: "Romain's selfie above Dubrovnik's old town and the sea at sunset",
  },  // Busan
  "busan/IMG_3290.jpg": {
    fr: "Romain assis dans un grand cadre blanc au milieu d'un jardin fleuri, la mer, un pont et des tours au loin",
    en: "Romain sitting inside a large white frame in a flower garden, the sea, a bridge and towers in the distance",
  },
  "busan/IMG_3340.jpg": {
    fr: "Romain assis sur une terrasse en bois au-dessus de la baie, les gratte-ciel de Busan au loin",
    en: "Romain sitting on a wooden deck above the bay, Busan's skyscrapers in the distance",
  },
  "busan/IMG_3394.jpg": {
    fr: "Romain attablé près d'une grande baie vitrée qui donne sur la ville et les montagnes",
    en: "Romain at a table by a large window overlooking the city and the mountains",
  },
  "busan/IMG_3404.jpg": {
    fr: "Romain dans une rue en pente, face à un quartier de maisons colorées accroché à la colline",
    en: "Romain on a sloping street, facing a neighbourhood of colourful houses clinging to the hillside",
  },
  // Berlin (la salle de concert : confirmée par Romain)
  "berlin/IMG_1013.jpg": {
    fr: "Romain avec sa valise devant la porte de Brandebourg, par un jour ensoleillé",
    en: "Romain with his suitcase in front of the Brandenburg Gate on a sunny day",
  },
  "berlin/IMG_1847.jpg": {
    fr: "Romain, de dos, dans les gradins d'une grande salle de concert à Berlin, face à la scène et à ses projecteurs avant le spectacle",
    en: "Romain, seen from behind, in the stands of a big Berlin concert hall, facing the stage and its lighting rig before the show",
  },
  // Paris
  "paris/IMG_6772.jpg": {
    fr: "Romain, bras croisés en doudoune blanche, devant la tour Eiffel par un jour gris",
    en: "Romain, arms crossed in a white puffer jacket, in front of the Eiffel Tower on a grey day",
  },
  "paris/IMG_6776.jpg": {
    fr: "Petit-déjeuner dans un café : croissant, jus d'orange, café et boisson chaude, devant une chemise aux motifs colorés",
    en: "Breakfast in a café: a croissant, orange juice, coffee and a hot drink, in front of a colourful patterned shirt",
  },
  "paris/IMG_6779.jpg": {
    fr: "Une lampe décorée de plumes roses et de lunettes en forme de cœur, dans un bar tamisé",
    en: "A lamp decorated with pink feathers and heart-shaped sunglasses, in a dimly lit bar",
  },
  "paris/IMG_6780.jpg": {
    fr: "Deux cocktails sur un comptoir en bois, dans un bar tamisé",
    en: "Two cocktails on a wooden bar counter, in a dimly lit bar",
  },
  "paris/IMG_6805.jpg": {
    fr: "Romain tient une peluche de cochon rose dans une boutique éphémère « Fashion Week » toute rose",
    en: "Romain holding a pink pig plush in an all-pink “Fashion Week” pop-up shop",
  },
  "paris/IMG_6816.jpg": {
    fr: "Romain en doudoune blanche sur les pavés, devant l'Arc de triomphe",
    en: "Romain in a white puffer jacket on the cobblestones, in front of the Arc de Triomphe",
  },
  "paris/IMG_6888.jpg": {
    fr: "Le quartier de La Défense à la tombée du jour : deux tours de verre et une sculpture géante en forme de pouce",
    en: "La Défense at dusk: two glass towers and a giant thumb-shaped sculpture",
  },
  // Tokyo
  "tokyo/IMG_8706-2.jpg": {
    fr: "Romain, sacs de shopping à la main, au milieu de la foule d'une rue animée",
    en: "Romain, shopping bags in hand, in the crowd of a busy street",
  },
  "tokyo/IMG_8807.jpg": {
    fr: "Romain au milieu d'une large avenue au crépuscule, bordée d'enseignes lumineuses",
    en: "Romain in the middle of a wide avenue at dusk, lined with illuminated signs",
  },
  "tokyo/IMG_8873-2.jpg": {
    fr: "Romain assis sur la pelouse d'un parc, un arbre en fleurs roses derrière lui",
    en: "Romain sitting on the lawn of a park, a tree in pink blossom behind him",
  },
  "tokyo/IMG_8884.jpg": {
    fr: "Romain sur un pont en bois d'un jardin japonais, un étang et des tours de bureaux derrière lui",
    en: "Romain on a wooden bridge in a Japanese garden, a pond and office towers behind him",
  },
  "tokyo/IMG_8910.jpg": {
    fr: "Une ruelle étroite bordée de petits restaurants et de lanternes en papier",
    en: "A narrow alley lined with small restaurants and paper lanterns",
  },
  "tokyo/IMG_9032.jpg": {
    fr: "Un assortiment de sushis sur un plateau doré, au comptoir d'un restaurant",
    en: "An assortment of sushi on a golden board, at a restaurant counter",
  },
  "tokyo/IMG_9050.jpg": {
    fr: "Les rangées de machines colorées d'une salle de pachinko",
    en: "Rows of colourful machines in a pachinko parlour",
  },
  "tokyo/IMG_9195.jpg": {
    fr: "Romain prend un selfie dans une salle d'art numérique immersive, entre fleurs projetées et traits de lumière",
    en: "Romain taking a selfie in an immersive digital art room, among projected flowers and streaks of light",
  },
  "tokyo/IMG_9224.jpg": {
    fr: "Un bol de thé vert où s'épanouissent des fleurs de lumière projetées",
    en: "A bowl of green tea with projected flowers of light blooming in it",
  },
  "tokyo/IMG_9243.jpg": {
    fr: "Romain pose la nuit devant la tour de Tokyo illuminée en orange",
    en: "Romain posing at night in front of Tokyo Tower, lit up in orange",
  },
  // Shanghai
  "shanghai/00D2F6FF-FC1D-49AD-BD15-E855DAF9A941.jpg": {
    fr: "Une rue piétonne bordée de bâtiments traditionnels chinois et de lanternes rouges, des gratte-ciel au loin",
    en: "A pedestrian street lined with traditional Chinese buildings and red lanterns, skyscrapers in the distance",
  },
  "shanghai/IMG_7369.jpg": {
    fr: "Romain sur les quais, la nuit, devant les gratte-ciel illuminés de Pudong et la tour de la Perle de l'Orient",
    en: "Romain on the waterfront at night, in front of Pudong's illuminated skyscrapers and the Oriental Pearl Tower",
  },
  "shanghai/IMG_7491.jpg": {
    fr: "Romain sourit au pied de très hauts gratte-ciel, dont la Shanghai Tower et sa silhouette torsadée",
    en: "Romain smiling at the foot of very tall skyscrapers, including the twisting Shanghai Tower",
  },
  "shanghai/IMG_7557-2.jpg": {
    fr: "Romain en doudoune blanche devant la tour de la Perle de l'Orient",
    en: "Romain in a white puffer jacket in front of the Oriental Pearl Tower",
  },
  "shanghai/IMG_7770.jpg": {
    fr: "Romain, de dos, contemple un jardin chinois traditionnel : rocaille, pavillon et une tour au loin",
    en: "Romain, seen from behind, looking out over a traditional Chinese garden: rockery, pavilion and a tower in the distance",
  },
  "shanghai/IMG_7903.jpg": {
    fr: "Romain adossé au mur vert d'un couloir à l'architecture courbe et futuriste",
    en: "Romain leaning against the green wall of a curved, futuristic corridor",
  },
  "shanghai/IMG_7922.jpg": {
    fr: "Romain et deux amis sur une passerelle, au milieu des plantes tropicales d'une serre",
    en: "Romain and two friends on a walkway among the tropical plants of a greenhouse",
  },
  "shanghai/IMG_7991.jpg": {
    fr: "Romain au pied d'un grand escalier qui mène à un temple chinois traditionnel",
    en: "Romain at the foot of a wide staircase leading up to a traditional Chinese temple",
  },
  "shanghai/IMG_8025.jpg": {
    fr: "Romain adossé à un pilier dans la galerie sculptée d'un temple",
    en: "Romain leaning against a pillar in the carved gallery of a temple",
  },
  "shanghai/IMG_8131.jpg": {
    fr: "Selfie de Romain et deux amis faisant le signe de la victoire, dans une rue illuminée de rouge",
    en: "Selfie of Romain and two friends making peace signs, in a street lit up in red",
  },
  "shanghai/IMG_8148.jpg": {
    fr: "Une immense lanterne illuminée en forme de chevaux et de fleurs, la nuit, devant des bâtiments traditionnels",
    en: "A huge illuminated lantern shaped like horses and flowers, at night, in front of traditional buildings",
  },
  "shanghai/IMG_8159.jpg": {
    fr: "Romain et deux amis posent la nuit sur le balcon en bois d'un bâtiment traditionnel éclairé de rouge",
    en: "Romain and two friends posing at night on the wooden balcony of a traditional building lit in red",
  },
  "shanghai/IMG_8160.jpg": {
    fr: "Romain brandit une lance à pompon rouge devant un pavillon traditionnel illuminé, la nuit",
    en: "Romain holding up a spear with a red tassel in front of an illuminated traditional pavilion, at night",
  },
  "shanghai/IMG_8162.jpg": {
    fr: "Romain attablé dans un café plein de plantes, une main au premier plan lève un verre de vin blanc vers lui",
    en: "Romain at a table in a café full of plants, a hand in the foreground raising a glass of white wine towards him",
  },
};

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

const collator = new Intl.Collator("en", { numeric: true });
const rel = (p) => path.relative(SITE_ROOT, p) || ".";
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} Ko`;
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} Mo`;

/** Tri "naturel" et déterministe : 2.jpeg < 10.jpeg, 1.jpeg < 1-save.jpeg. */
function compareFileNames(a, b) {
  const stem = (name) => name.slice(0, name.length - path.extname(name).length);
  return collator.compare(stem(a), stem(b)) || (a < b ? -1 : a > b ? 1 : 0);
}

async function isDirectory(p) {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

/** Lit TRAVEL_IDS dans profile.ts (source de vérité des slugs). null si introuvable. */
async function readTravelIds() {
  const source = await readFile(PROFILE_PATH, "utf8").catch(() => "");
  const match = source.match(/TRAVEL_IDS\s*=\s*\[([^\]]*)\]/);
  if (!match) return null;
  return [...match[1].matchAll(/["']([a-z0-9-]+)["']/g)].map((m) => m[1]);
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function altFor(slug, index, sourceName) {
  const override = ALT_OVERRIDES[`${slug}/${sourceName}`];
  if (override) return { fr: override.fr, en: override.en };
  const label = DESTINATION_LABELS[slug] ?? { fr: titleCase(slug), en: titleCase(slug) };
  return {
    fr: `${label.fr} — photo de voyage ${index}`,
    en: `${label.en} — travel photo ${index}`,
  };
}

/** Empreinte visuelle (dHash 64 bits) d'une image déjà orientée. */
async function visualHash(image) {
  const pixels = await image.clone().greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      hash = (hash << 1n) | (pixels[y * 9 + x] > pixels[y * 9 + x + 1] ? 1n : 0n);
    }
  }
  return hash;
}

function hammingDistance(a, b) {
  let diff = a ^ b;
  let count = 0;
  while (diff) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}

/** Écrit le fichier seulement si son contenu change (évite du bruit dans git). */
async function writeIfChanged(file, data) {
  const previous = await readFile(file).catch(() => null);
  if (previous && previous.equals(data)) return false;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
  return true;
}

/* ------------------------------------------------------------------ */
/* Collecte des sources                                                */
/* ------------------------------------------------------------------ */

function parseCli() {
  const { values } = parseArgs({
    options: {
      source: { type: "string", multiple: true, default: [] },
      raw: { type: "string" },
      "no-legacy": { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      check: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const extraSources = values.source.map((spec) => {
    const at = spec.lastIndexOf("=");
    if (at <= 0 || at === spec.length - 1) {
      throw new Error(`--source attend "<dossier>=<slug>", reçu "${spec}"`);
    }
    return { dir: path.resolve(spec.slice(0, at)), slug: spec.slice(at + 1) };
  });

  return {
    help: values.help,
    check: values.check,
    dryRun: values["dry-run"],
    legacy: !values["no-legacy"],
    rawDir: values.raw ? path.resolve(values.raw) : DEFAULT_RAW_DIR,
    extraSources,
  };
}

/** Sources dans l'ordre : ancien site, --source, puis photos-raw/<slug>/ (tri alphabétique). */
async function resolveSources(options) {
  const sources = [];
  if (options.legacy) {
    for (const source of LEGACY_SOURCES) {
      if (await isDirectory(source.dir)) sources.push(source);
      else console.warn(`! Dossier de l'ancien site introuvable, ignoré : ${rel(source.dir)}`);
    }
  }
  sources.push(...options.extraSources);
  if (await isDirectory(options.rawDir)) {
    const entries = await readdir(options.rawDir, { withFileTypes: true });
    const slugs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort(compareFileNames);
    for (const slug of slugs) sources.push({ dir: path.join(options.rawDir, slug), slug });
  }
  return sources;
}

/** Liste les images d'une source, triées ; signale les fichiers ignorés. */
async function listSourceFiles(source, problems) {
  const exclude = new Set(source.exclude ?? []);
  const entries = await readdir(source.dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (exclude.has(entry.name)) {
      console.log(`  exclu (configuration) : ${rel(path.join(source.dir, entry.name))}`);
      continue;
    }
    const lower = entry.name.toLowerCase();
    const ext = path.extname(lower);
    if (IGNORED_FILES.has(lower) || lower.startsWith(".")) continue;
    if (HEIC_EXTENSIONS.has(ext)) {
      problems.push(
        `${rel(path.join(source.dir, entry.name))} : format HEIC non supporté. ` +
          `Exporte la photo en JPEG (iPhone : Réglages > Appareil photo > Formats > « Le plus compatible »).`,
      );
    } else if (INPUT_EXTENSIONS.has(ext)) {
      files.push(entry.name);
    } else {
      console.warn(`! Fichier ignoré (format non géré) : ${rel(path.join(source.dir, entry.name))}`);
    }
  }
  return files.sort(compareFileNames);
}

/* ------------------------------------------------------------------ */
/* Vérification des sorties                                            */
/* ------------------------------------------------------------------ */

/** Liste les chunks RIFF d'un WebP et les drapeaux VP8X (ICC / EXIF / XMP). */
function inspectWebpContainer(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return { valid: false, chunks: [], flags: 0 };
  }
  const chunks = [];
  let flags = 0;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const fourCC = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (fourCC === "VP8X") flags = buffer[offset + 8];
    chunks.push(fourCC);
    offset += 8 + size + (size % 2);
  }
  return { valid: true, chunks, flags };
}

const METADATA_CHUNKS = new Set(["EXIF", "XMP ", "ICCP"]);
const VP8X_METADATA_FLAGS = 0x20 | 0x08 | 0x04; // ICC | EXIF | XMP

/** Problèmes de métadonnées d'une image WebP (tableau vide = OK). */
async function metadataProblems(buffer, label) {
  const problems = [];
  const container = inspectWebpContainer(buffer);
  if (!container.valid) return [`${label} : n'est pas un WebP valide`];
  const leaked = container.chunks.filter((c) => METADATA_CHUNKS.has(c));
  if (leaked.length) problems.push(`${label} : chunks de métadonnées ${leaked.join(", ")}`);
  if (container.flags & VP8X_METADATA_FLAGS) problems.push(`${label} : drapeaux VP8X de métadonnées`);
  const meta = await sharp(buffer).metadata();
  for (const key of ["exif", "icc", "iptc", "xmp", "tifftagPhotoshop"]) {
    if (meta[key]) problems.push(`${label} : métadonnée ${key} présente`);
  }
  if (meta.orientation && meta.orientation !== 1) problems.push(`${label} : orientation ${meta.orientation}`);
  return problems;
}

/** Vérifie toutes les sorties référencées par le JSON + l'absence de fichiers orphelins. */
async function verifyOutputs(entries, travelIds) {
  const problems = [];
  const referenced = new Set();
  for (const entry of entries) {
    if (travelIds && !travelIds.includes(entry.destination)) {
      problems.push(`${entry.src} : destination inconnue "${entry.destination}"`);
    }
    for (const [key, maxWidth] of [
      ["src", VARIANTS.large.width],
      ["srcSmall", VARIANTS.small.width],
    ]) {
      const file = path.join(OUT_DIR, entry[key].slice(PUBLIC_PREFIX.length + 1));
      referenced.add(file);
      const buffer = await readFile(file).catch(() => null);
      if (!buffer) {
        problems.push(`${entry[key]} : fichier manquant`);
        continue;
      }
      problems.push(...(await metadataProblems(buffer, entry[key])));
      const { width, height } = await sharp(buffer).metadata();
      if (width > maxWidth) problems.push(`${entry[key]} : ${width} px > ${maxWidth} px`);
      if (key === "src" && (width !== entry.width || height !== entry.height)) {
        problems.push(`${entry.src} : dimensions ${width}×${height} ≠ JSON ${entry.width}×${entry.height}`);
      }
    }
    const prefix = "data:image/webp;base64,";
    if (!entry.blurDataURL.startsWith(prefix)) {
      problems.push(`${entry.src} : blurDataURL invalide`);
    } else {
      const blur = Buffer.from(entry.blurDataURL.slice(prefix.length), "base64");
      problems.push(...(await metadataProblems(blur, `${entry.src} (blur)`)));
    }
    if (!entry.alt?.fr || !entry.alt?.en) problems.push(`${entry.src} : alt fr/en manquant`);
  }
  for (const file of await listOutputFiles()) {
    if (!referenced.has(file)) problems.push(`${rel(file)} : fichier orphelin (absent du JSON)`);
  }
  return problems;
}

/** Tous les .webp de public/photos/<slug>/. */
async function listOutputFiles() {
  if (!(await isDirectory(OUT_DIR))) return [];
  const files = [];
  for (const dir of await readdir(OUT_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of await readdir(path.join(OUT_DIR, dir.name))) {
      if (file.endsWith(".webp")) files.push(path.join(OUT_DIR, dir.name, file));
    }
  }
  return files.sort();
}

/** Supprime les .webp qui ne font plus partie de la sortie, puis les dossiers vides. */
async function removeStaleOutputs(keep) {
  const removed = [];
  for (const file of await listOutputFiles()) {
    if (keep.has(file)) continue;
    await rm(file);
    removed.push(file);
  }
  if (await isDirectory(OUT_DIR)) {
    for (const dir of await readdir(OUT_DIR, { withFileTypes: true })) {
      const full = path.join(OUT_DIR, dir.name);
      if (dir.isDirectory() && (await readdir(full)).length === 0) await rmdir(full);
    }
  }
  return removed;
}


/* ------------------------------------------------------------------ */
/* Traitement                                                          */
/* ------------------------------------------------------------------ */

const USAGE =
  "Usage : node scripts/optimize-photos.mjs [--source <dossier>=<slug>]... " +
  "[--raw <dossier>] [--no-legacy] [--dry-run] [--check]";

/** Collecte les fichiers sources, triés par destination (ordre de TRAVEL_IDS) puis par source. */
async function collectCandidates(options, travelIds) {
  const problems = [];
  const candidates = [];
  for (const source of await resolveSources(options)) {
    if (travelIds && !travelIds.includes(source.slug)) {
      problems.push(
        `${rel(source.dir)} : slug "${source.slug}" inconnu. Ajoute-le d'abord à TRAVEL_IDS ` +
          `(src/content/profile.ts) et à DESTINATION_LABELS (scripts/optimize-photos.mjs).`,
      );
      continue;
    }
    for (const name of await listSourceFiles(source, problems)) {
      candidates.push({ slug: source.slug, name, file: path.join(source.dir, name) });
    }
  }
  const rank = (slug) => (travelIds ? travelIds.indexOf(slug) : 0);
  candidates.sort((a, b) => rank(a.slug) - rank(b.slug)); // tri stable : l'ordre des sources est conservé
  return { candidates, problems };
}

/**
 * Dédoublonne : copie identique (sha256) ou même image ré-exportée (même empreinte visuelle
 * et mêmes dimensions). La première occurrence, dans l'ordre déterministe, est gardée.
 */
async function dedupe(candidates) {
  const byHash = new Map(); // sha256 → fichier gardé
  const kept = [];
  const skipped = [];
  const warnings = [];
  for (const candidate of candidates) {
    const buffer = await readFile(candidate.file);
    candidate.bytes = buffer.length;

    const sha = createHash("sha256").update(buffer).digest("hex");
    if (byHash.has(sha)) {
      skipped.push(`${rel(candidate.file)} = copie identique de ${rel(byHash.get(sha))}`);
      continue;
    }
    byHash.set(sha, candidate.file);

    const meta = await sharp(buffer).metadata();
    const swap = (meta.orientation ?? 1) >= 5; // orientations 5 à 8 : largeur/hauteur inversées
    const width = swap ? meta.height : meta.width;
    const height = swap ? meta.width : meta.height;
    const hash = await visualHash(sharp(buffer, { failOn: "error" }).autoOrient());

    const twin = kept.find((k) => k.hash === hash && k.width === width && k.height === height);
    if (twin) {
      skipped.push(`${rel(candidate.file)} ≈ même image que ${rel(twin.file)}`);
      continue;
    }
    for (const k of kept) {
      const distance = hammingDistance(k.hash, hash);
      if (distance <= NEAR_DUPLICATE_WARN_DISTANCE) {
        warnings.push(`${rel(candidate.file)} ressemble à ${rel(k.file)} (distance ${distance}/64)`);
      }
    }
    kept.push({ ...candidate, hash, width, height });
  }
  return { kept, skipped, warnings };
}

/** Numérote les photos gardées par destination : 01, 02… (3 chiffres au-delà de 99). */
function assignNames(kept) {
  const totals = new Map();
  for (const photo of kept) totals.set(photo.slug, (totals.get(photo.slug) ?? 0) + 1);
  const counters = new Map();
  return kept.map((photo) => {
    const index = (counters.get(photo.slug) ?? 0) + 1;
    counters.set(photo.slug, index);
    const nn = String(index).padStart(Math.max(2, String(totals.get(photo.slug)).length), "0");
    const base = `${PUBLIC_PREFIX}/${photo.slug}/${nn}`;
    return {
      ...photo,
      index,
      src: `${base}${VARIANTS.large.suffix}.webp`,
      srcSmall: `${base}${VARIANTS.small.suffix}.webp`,
    };
  });
}

const publicToFile = (publicPath) =>
  path.join(OUT_DIR, ...publicPath.slice(PUBLIC_PREFIX.length + 1).split("/"));

async function encodeVariant(image, { width, quality }) {
  return image
    .clone()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: WEBP_EFFORT })
    .toBuffer({ resolveWithObject: true });
}

/** Encode une photo (grande, miniature, placeholder flou) et renvoie son PhotoEntry. */
async function encodePhoto(photo) {
  // autoOrient() applique la rotation EXIF ; sharp ne recopie aucune métadonnée en sortie
  // (pas de keepMetadata/keepExif/withMetadata) et convertit le profil couleur en sRGB.
  const image = sharp(await readFile(photo.file), { failOn: "error" }).autoOrient();
  const large = await encodeVariant(image, VARIANTS.large);
  const small = await encodeVariant(image, VARIANTS.small);
  const blur = await image.clone().resize({ width: BLUR.width }).webp({ quality: BLUR.quality }).toBuffer();

  let written = 0;
  if (await writeIfChanged(publicToFile(photo.src), large.data)) written++;
  if (await writeIfChanged(publicToFile(photo.srcSmall), small.data)) written++;

  const entry = {
    destination: photo.slug,
    src: photo.src,
    srcSmall: photo.srcSmall,
    width: large.info.width,
    height: large.info.height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    alt: altFor(photo.slug, photo.index, photo.name),
  };
  return { entry, written, largeBytes: large.data.length, smallBytes: small.data.length };
}

async function main() {
  const options = parseCli();
  if (options.help) return console.log(USAGE);

  const travelIds = await readTravelIds();
  if (!travelIds) console.warn("! TRAVEL_IDS introuvable dans profile.ts : slugs non vérifiés.");

  if (options.check) {
    const entries = JSON.parse(await readFile(JSON_PATH, "utf8"));
    const problems = await verifyOutputs(entries, travelIds);
    return report(problems, `${entries.length} photos vérifiées : aucune métadonnée, JSON cohérent.`);
  }

  sharp.cache(false);

  // 1. Collecte
  const { candidates, problems } = await collectCandidates(options, travelIds);
  if (problems.length) return report(problems);

  // 2. Dédoublonnage et nommage
  const { kept, skipped, warnings } = await dedupe(candidates);
  const photos = assignNames(kept);

  // 3. Encodage
  const entries = [];
  const stats = new Map(); // slug → { files, photos, inBytes, outBytes }
  for (const c of candidates) {
    const s = stats.get(c.slug) ?? { files: 0, photos: 0, inBytes: 0, outBytes: 0 };
    s.files++;
    stats.set(c.slug, s);
  }
  let written = 0;
  for (const photo of photos) {
    const s = stats.get(photo.slug);
    s.photos++;
    s.inBytes += photo.bytes;
    if (options.dryRun) {
      console.log(`  ${rel(photo.file)} → ${photo.src} (+ ${path.basename(photo.srcSmall)})`);
      continue;
    }
    const result = await encodePhoto(photo);
    entries.push(result.entry);
    written += result.written;
    s.outBytes += result.largeBytes + result.smallBytes;
    console.log(
      `  ${rel(photo.file)} → ${photo.src} ${result.entry.width}×${result.entry.height} ` +
        `(${kb(result.largeBytes)} + ${kb(result.smallBytes)})`,
    );
  }

  // 4. Résumé
  console.log("");
  for (const line of skipped) console.log(`  doublon ignoré : ${line}`);
  for (const line of warnings) console.warn(`! ${line} — vérifie que ce n'est pas un doublon`);
  console.log("\nPar destination :");
  const sum = (key) => [...stats.values()].reduce((total, s) => total + s[key], 0);
  for (const [slug, s] of stats) {
    console.log(
      `  ${slug.padEnd(20)} ${String(s.photos).padStart(3)} photos (${s.files} fichiers lus)` +
        (options.dryRun ? "" : `  ${mb(s.inBytes)} → ${mb(s.outBytes)}`),
    );
  }
  const scannedBytes = candidates.reduce((total, c) => total + c.bytes, 0);
  console.log(
    `Total : ${photos.length} photos uniques sur ${candidates.length} fichiers ` +
      `(${mb(scannedBytes)} lus, ${mb(sum("inBytes"))} uniques)` +
      (options.dryRun ? "" : ` → ${mb(sum("outBytes"))} en WebP`),
  );
  if (options.dryRun) return console.log("\n(dry-run : rien n'a été écrit)");

  // 5. JSON, nettoyage des sorties obsolètes, vérification
  const jsonChanged = await writeIfChanged(JSON_PATH, Buffer.from(`${JSON.stringify(entries, null, 2)}\n`));
  const outputs = new Set(photos.flatMap((p) => [publicToFile(p.src), publicToFile(p.srcSmall)]));
  const removed = await removeStaleOutputs(outputs);
  for (const file of removed) console.log(`  supprimé (obsolète) : ${rel(file)}`);
  console.log(
    `${written} fichier(s) WebP écrit(s), ${removed.length} supprimé(s), ` +
      `${rel(JSON_PATH)} ${jsonChanged ? "mis à jour" : "inchangé"}.`,
  );

  report(
    await verifyOutputs(entries, travelIds),
    `Vérification OK : aucune métadonnée (EXIF/GPS/XMP/IPTC/ICC) dans les ${outputs.size} fichiers.`,
  );
}

function report(problems, successMessage) {
  if (problems.length) {
    console.error(`\n✗ ${problems.length} problème(s) :`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
  } else if (successMessage) {
    console.log(`\n✓ ${successMessage}`);
  }
}

main().catch((error) => {
  console.error(`[assets:photos] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
