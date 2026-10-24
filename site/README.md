# romaincampanha.ch

Nouveau portfolio de **Romain Campanha** (Genève). Son avatar 3D, **Rominou**, guide la visite du site.

Trois pages, en français (par défaut, à la racine) et en anglais (`/en`) :

- **Pro** (`/`) : visite guidée par Rominou (parcours, Infomaniak, compétences, gesoif.ch, contact) + version texte complète.
- **Hobby** (`/hobby`) : voyages, jeu musical, musique, League of Legends.
- **Chat** (`/chat`) : discussion avec « la version IA de Romain ».

Stack : Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, next-intl 4, React Three Fiber, Motion, AI SDK. Hébergement : Vercel (Hobby).

## Lancer le projet

Prérequis : Node.js 22.

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev                  # http://localhost:3000
```

## Scripts

| Script                  | Rôle                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | Serveur de développement                                   |
| `npm run build`         | Build de production                                        |
| `npm run start`         | Sert le build de production                                |
| `npm run lint`          | ESLint (config Next.js)                                    |
| `npm run typecheck`     | Génère les types de routes puis `tsc --noEmit`             |
| `npm run test:e2e`      | Tests Playwright, avec un faux OpenAI (après `npm run build`) |
| `npm run assets:avatar` | Optimise les modèles 3D de l'avatar (`public/models/`)     |
| `npm run assets:photos` | Optimise les photos de voyage (`public/photos/` + JSON)    |

## Variables d'environnement

| Variable                                          | Rôle                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `OPENAI_API_KEY`                                  | Clé API pour le chat (serveur uniquement)                            |
| `CHAT_MODEL`                                      | Modèle utilisé par le chat                                           |
| `CHAT_RATE_LIMIT_PER_MINUTE`                      | Messages max par visiteur et par minute                              |
| `CHAT_DAILY_GLOBAL_LIMIT`                         | Plafond global journalier (garde-fou budget)                         |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN`               | Compteurs partagés des limites (obligatoire en production Vercel)    |
| `CHAT_SIGNING_SECRET`                             | Optionnel : secret de signature de l'historique (défaut : dérivé de la clé OpenAI) |
| `BOTID_DISABLED`                                  | `1` = pas de vérification BotID (local, CI, tests ; ignoré en production) |
| `NEXT_PUBLIC_SITE_URL`                            | URL publique (défaut : `https://romaincampanha.ch`)                  |

Ne jamais committer de secret : seules les valeurs vides de `.env.example` sont versionnées.

## Mise en production (chat) — étapes obligatoires

Budget max : 40 CHF/mois. Le code applique un plafond quotidien, mais seul OpenAI peut
garantir un plafond dur.

1. **OpenAI** : créer un projet dédié, lui fixer un budget mensuel (ex. 10 $) et y créer la clé
   `OPENAI_API_KEY`.
2. **Upstash Redis** (offre gratuite, via le Marketplace Vercel ou upstash.com) : renseigner
   `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_*`). Sans eux, le chat
   reste désactivé en production (les limites en mémoire ne valent qu'en local).
3. **Vercel Firewall** : règle de rate limiting sur `POST /api/chat` (ex. 10 requêtes/minute par IP).
4. **Vercel BotID** : rien à configurer (actif en production) ; ne pas définir `BOTID_DISABLED`.

## Tests

`npm run test:e2e` (après `npm run build`) lance le site et un faux OpenAI
(`e2e/mock-openai.mjs`) : pages, i18n, 404, en-têtes, API et parcours du chat, sans clé ni coût.

## Organisation

```
messages/{fr,en}/        traductions, un fichier par namespace (common, pro, hobby, chat)
src/app/[locale]/        pages localisées (layout racine, Pro, Hobby, Chat, 404)
src/i18n/                routing, navigation localisée, chargement des messages
src/components/site/     shell : header, footer, skip link, providers, thème
src/components/three/    avatar 3D (Canvas unique et persistant + ancres)
src/content/             profil (source de vérité du contenu) et photos
src/lib/                 helpers (pages, SEO, store de l'avatar)
```

Chaque page pose un thème (`data-theme="pro" | "hobby" | "chat"`) qui définit les variables CSS (`--theme-*`) et les utilitaires Tailwind sémantiques (`text-fg`, `text-muted`, `text-accent`, `bg-surface`, `border-line`, `shadow-glow`, `text-shadow-neon`).
