# Photos brutes (non versionnées)

Ce dossier reçoit les photos **originales** des voyages. Il est ignoré par git
(seul ce README est versionné) : les originaux ne quittent jamais ton ordinateur.
Le script `npm run assets:photos` en tire des versions légères pour le site.

## Ajouter des photos

1. **Exporter depuis l'iPhone sans la position GPS**
   - Dans Photos, sélectionne les photos → Partager → **Options** (en haut) →
     désactive **Position**, puis envoie-les (AirDrop, e-mail, câble…).
   - Format : **JPEG**. Les fichiers `.heic` ne sont pas acceptés par le script.
     Pour que l'iPhone produise du JPEG : Réglages → Appareil photo → Formats →
     **« Le plus compatible »** (ou convertis les `.heic` en JPEG sur ton ordinateur).
   - Le script supprime de toute façon toutes les métadonnées (GPS, date, appareil…),
     mais mieux vaut ne jamais faire circuler la position.

2. **Déposer les fichiers dans `photos-raw/<slug>/`**, un dossier par voyage :

   | Dossier                         | Voyage               |
   | ------------------------------- | -------------------- |
   | `photos-raw/tokyo/`             | Tokyo, Japon         |
   | `photos-raw/shanghai/`          | Shanghai, Chine      |
   | `photos-raw/seoul/`             | Séoul (en plus des photos de l'ancien site) |
   | `photos-raw/toronto/`           | Toronto              |
   | `photos-raw/brighton-dubrovnik/`| Brighton & Dubrovnik |

   Formats acceptés : `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.tif`.
   **L'ordre d'affichage suit l'ordre des noms de fichiers** (tri naturel :
   `2.jpg` avant `10.jpg`). Pour choisir l'ordre, renomme-les `01-…`, `02-…`, etc.

3. **Lancer le script** depuis le dossier `site/` :

   ```bash
   npm run assets:photos
   ```

   Il dédoublonne les photos, les redresse (orientation), supprime toutes les
   métadonnées et écrit :
   - `public/photos/<slug>/01.webp` (1600 px de large) et `01-sm.webp` (800 px) ;
   - `src/content/photos.generated.json` (liste des photos, utilisée par le site).

   Il termine par une vérification : aucune image produite ne contient de métadonnées.
   Options utiles : `--dry-run` (montre ce qui serait fait sans rien écrire),
   `--check` (revérifie les fichiers déjà générés).

4. **Vérifier puis committer** `public/photos/` et `src/content/photos.generated.json`
   (jamais ce dossier `photos-raw/`, git l'ignore déjà).

## Pour aller plus loin

- **Textes alternatifs** : par défaut ils sont génériques (« Tokyo — photo de voyage 3 »).
  Pour une vraie description, ajoute une entrée dans `ALT_OVERRIDES`
  (`scripts/optimize-photos.mjs`), avec pour clé `"<slug>/<nom du fichier>"`, puis relance le script.
- **Nouvelle destination** (ex. `lisbon`) : ajoute d'abord le slug à `TRAVEL_IDS`
  et le voyage à `travels` dans `src/content/profile.ts`, son nom dans
  `DESTINATION_LABELS` (`scripts/optimize-photos.mjs`), puis crée `photos-raw/lisbon/`.
  Sinon le script s'arrête avec un message d'erreur.
- Quand les photos de Tokyo ou Shanghai sont prêtes, passe aussi `photos: "coming"`
  à `"available"` (et renseigne l'année) dans `src/content/profile.ts`.
