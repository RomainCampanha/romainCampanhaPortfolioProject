# Design system « Cosy »

Pâte à modeler mate, pastels, détails de HUD de jeu cosy, Genève sur le lac. Maquette de référence validée
par Romain : `scratchpad/da/cosy/` (index.html + style.css). **Toutes les pages utilisent ce kit** : pas de
couleur, d'ombre ou de police en dur dans les composants de page.

- Tokens et thèmes : `src/app/globals.css`
- Styles des primitives : `src/components/ui/ui.css` (couche `components`, surchargeable par les utilitaires)
- Shell (header, dock mobile, footer, bandes de page) : `src/components/site/site.css`
- Primitives : `src/components/ui/*.tsx`, importables depuis `@/components/ui` (sauf `Hangul`)

## 1. Règles

1. **Faits = `profile.ts`**, formulations = `messages/{fr,en}/*.json`. Jamais de fait en dur dans un composant.
2. **Contraste AA** : un pastel porte toujours le texte de **sa teinte profonde -800** (`bg-tone-100 text-tone-800`,
   `bg-lake-200 text-lake-800`…). Texte courant : `text-fg` (encre) ou `text-muted` (encre douce, ≥ 5.5:1 partout).
   Jamais de texte -500/-300.
3. **Focus** : ne jamais supprimer l'outline ; l'anneau global (`--theme-focus`, bleu lac) suit les arrondis.
4. **Mouvement** : animations via `animate-float`, `animate-nudge` ou des transitions courtes ;
   `prefers-reduced-motion: reduce` les coupe toutes (règle globale). Rien d'essentiel ne doit dépendre d'une animation.
5. **Responsive** : aucun scroll horizontal jusqu'à 320 px ; gouttière 16 px sur mobile (`.site-container`).
   Sous `md` (48rem) un **dock** fixe occupe le bas de l'écran : le footer réserve déjà la place ; un élément
   collé en bas (ex. barre de saisie du chat) doit ajouter `calc(6.75rem + env(safe-area-inset-bottom))` de marge
   (le dock se masque tout seul quand un champ de saisie a le focus).
6. **Perf** : décor en SVG inline / CSS, pas de grosses images ; polices auto-hébergées (déjà chargées).

## 2. Tokens (Tailwind v4, `@theme static` : aussi dispo en `var(--…)` dans les CSS modules)

| Rôle | Utilitaires / variables |
| --- | --- |
| Base | `oat` (fond), `oat-deep` (creux), `cream` (surfaces), `cream-edge` (épaisseur), `sand` (traits), `ink`, `ink-soft` |
| Pastels | `sage-*`, `peach-*`, `butter-*`, `lake-*`, `lilac-*` en 100 / 200 / 300 / 500 / 800 |
| Argile | `clay` (bouton principal, blanc dessus 5.7:1), `clay-edge` |
| Bandes | `band-peach` (Hobby), `band-lilac` (Chat) |
| Rayons | `rounded-clay-sm/md/lg/xl` (14/20/28/40 px), `rounded-card`, `rounded-bubble` |
| Ombres | `shadow-clay`, `shadow-clay-sm`, `shadow-clay-pressed`, `shadow-well` (creux), `shadow-float` |
| Polices | `font-sans` (Nunito, défaut), `font-display` (Fraunces, SOFT 100 auto), `font-ko` (Jua, via `<Hangul>`) |
| Grain | `var(--texture-grain)` (fond papier, déjà sur la page et les bandes) |

### Typographie (utilitaires)

| Classe | Usage | Taille |
| --- | --- | --- |
| `type-hero` | h1 de page | 52 → 112 px, Fraunces WONK |
| `type-h2` | titre de section | 36 → 60 px |
| `type-h3` | grand titre de carte (cadre, ville) | 30 → 40 px |
| `type-title` | petit titre display (valeur, groupe, nom) | 21 px |
| `type-kicker` | étiquette HUD en capitales | 13 px, 900, +0.14em |
| `type-lede` | chapeau | 18.5 → 22 px, 650, `text-muted` |

Corps : Nunito 500, 16 px (17 px dès `md`), interligne 1.55.

### Thèmes de page (`data-theme`, posé par `PageThemeRoot` et `PageShell`)

| Variable → utilitaire | Pro | Hobby | Chat |
| --- | --- | --- | --- |
| `--theme-bg` → `bg-page` | avoine | avoine (header) | avoine (header) |
| `--theme-band` → `bg-band` | avoine foncé | pêche `#F9E2D1` | lilas `#ECE6F7` |
| `--theme-accent` → `text-accent` | pêche 800 | pêche 800 | lilas 800 |
| `--theme-accent-strong` → `text-accent-strong` | argile | argile | argile |
| `--theme-edge` → `shadow-[0_4px_0_var(--theme-edge)]` | crème edge | `#E9CBB4` | `#D7CBEE` |
| `--theme-dash` (pointillés) | sable | pêche 300 | lilas 300 |
| `text-fg` / `text-muted` / `bg-surface` / `border-line` | encre / encre douce / crème / sable | idem | idem |

Le header reste sur l'avoine ; sur **Hobby et Chat, `<main>` plonge dans la bande** (bord ondulé) et le footer la
prolonge. Rien à faire côté page.

### Tons (`tone-*` ou `data-tone`)

`className="tone-lake"` ou `data-tone="lake"` pose `--tone-100/200/300/500/800/edge` ; les utilitaires
`bg-tone-100`, `bg-tone-200`, `text-tone-800`, `border-tone-300`, `shadow-[0_4px_0_var(--tone-edge)]` suivent.
Les primitives prennent une prop `tone?: "sage" | "peach" | "butter" | "lake" | "lilac"`.

Convention de sens (comme la maquette) : **sage** = ESIG / obtenu / Genève · **lake** = Infomaniak / job / lac ·
**butter** = autodidacte / en cours / âge · **peach** = CFPT / Hobby · **lilac** = HEG / études / Chat.

## 3. Mise en page

```tsx
// Page simple (contenu centré, 1240 px max) :
<PageShell theme="pro">…</PageShell>

// Page en bandes pleine largeur : chaque section pose son conteneur
<PageShell theme="pro" bleed>
  <section className="site-container py-16">…</section>
  <WavyBand tone="peach" edges="both" className="py-16 sm:py-24">
    <div className="site-container">…</div>
  </WavyBand>
</PageShell>
```

`SectionHeading` (`src/components/site/`) = `SectionKicker` + h2 `type-h2` + intro :
`<SectionHeading id="parcours-title" kicker={t("kicker")} kickerIcon="graduation" title={t("title")} intro={t("intro")} />`.

## 4. Primitives

### `Button` — pilule d'argile (bouton ou lien)

```tsx
<Button icon="chat" href="/chat">{t("cta.chat")}</Button>                 // lien localisé (next-intl)
<Button variant="secondary" iconEnd="arrow-down" href="#parcours">…</Button> // ancre
<Button variant="secondary" href={project.url} iconEnd="arrow-up-right">…</Button> // externe : nouvel onglet + mention SR
<Button size="sm" onClick={…}>…</Button>                                  // <button type="button"> (composant client)
<Button size="icon" icon="send" type="submit" aria-label={t("send")} />   // rond, aria-label obligatoire
```

`variant`: `primary` (argile, 1 par zone) | `secondary` (crème). `size`: `md` | `sm` | `icon`. `block` = pleine largeur.
État enfoncé au clic (`:active`, `aria-pressed="true"`), `disabled` géré. Pour styler un autre élément :
`buttonClasses({ variant: "secondary", size: "sm" })` (ex. `<summary>`, `next/link` hors locale).

### `ClayCard` — surface en argile

```tsx
<ClayCard className="p-6 sm:p-8">…</ClayCard>                          // crème, épaisseur = thème
<ClayCard tone="lake" radius="md" depth="sm" className="p-4">…</ClayCard> // fait clé pastel
<ClayCard tone="sage" shade="strong" className="p-3">…</ClayCard>      // cadre (face 300, bord 500)
<ClayCard variant="well" radius="xl" className="p-2.5">…</ClayCard>    // plateau en creux (hotbar, mur)
```

Props : `as` (div, section, article, aside, figure, li, ol, ul, header), `variant`, `tone`, `shade`, `radius`
(`md`/`lg`/`xl`), `depth` (`md`/`sm`). Pas de padding imposé.

### `Chip`, `Tag`, `Highlight`

```tsx
<ul className="flex flex-wrap gap-2.5">
  <Chip as="li" tag={<Tag tone="sage" srPrefix={t("sourcePrefix")}>ESIG</Tag>}>Java</Chip>
</ul>
<Chip tone="lilac" icon="pin">Séoul</Chip>
<p>… chez <Highlight tone="lake">Infomaniak</Highlight> …</p>
```

Chip cliquable (suggestion du chat, filtre) : `className="chip"` (+ `data-tone`) directement sur le `<button>`.

### `Sticker` — étiquette collée, penchée

`<Sticker tone="butter">{headline}</Sticker>` · `<Sticker tone="lilac" icon="headphones" size="lg" tilt={-5}>…</Sticker>`.
Props : `tone` (défaut butter), `icon` (défaut sparkle, `null` = aucune), `tilt` (°, défaut -2.5), `size`, `as`.

### `SpeechBubble` — boîte de dialogue de Rominou

```tsx
<SpeechBubble tail="bottom" tailLg="right">{t("bubble")}</SpeechBubble>   // cartouche « Rominou, le guide »
<SpeechBubble name={null} size="sm" tail="bottom" tailOffset="40%">{t("aside")}</SpeechBubble>
```

`tail`/`tailLg` : `left | right | top | bottom | none` (tailLg s'applique dès 64rem) ; `tailOffset(Lg)` place la
queue le long du bord ; `live="polite"` pour un texte qui change (visite guidée) ; `as` : div | figure | aside.
`showNext` (triangle « suite » qui sautille) : réservé à la future visite guidée animée, quand un clic fait
vraiment avancer le dialogue (ne pas l'afficher sans cette interaction).
Texte uniquement (pas de voix). Ex. : la bulle du hero Pro (`pro/HeroStage`), posée dans le cadre de Rominou.

### `SectionKicker`

`<SectionKicker icon="graduation">{t("kicker")}</SectionKicker>` → pastille + capitales, couleur `text-accent`.
`tone` force un pastel.

### `Gauge` — jauge HUD segmentée

```tsx
<Gauge value={profile.work.ratePercent} label={t("rateLabel", { rate })} />          // lac, « 70 % » localisé
<Gauge value={70} label={…} tone="butter" track="light" size="lg" caption={t("rate")} />
```

`label` = nom accessible **complet** (valeur incluse) : la jauge est un `role="img"`. `valueText` remplace le
pourcentage affiché (`null` = masqué) ; `segments` (défaut 7). Remplissage animé (coupé si mouvement réduit).

### `StatusBadge`

`<StatusBadge status={education.status} className="absolute -right-4 -top-4" />` → « Obtenu » (sauge, coche) /
« En cours » (beurre, pousse) ; `status` = `Education["status"]`. `tilt={false}` pour le poser droit.

### `WavyBand`

`<WavyBand tone="theme|peach|lilac|oat|cream|sage|lake|butter" edges="top|bottom|both|none" as="section">`.
Bord ondulé de 28 px qui déborde **hors** de la bande : prévoir l'espace. Pas de conteneur interne.

### `Coin`, `RominouHead`, `Icon`, `Hangul`

```tsx
<Coin icon="server" />                     // pastille crème, icône accent (xs 28 · sm 32 · md 40 · lg 48)
<Coin icon="code" tone="peach" size="sm" /> // pastille pastel
<RominouHead size={48} ring="theme" />      // tête de Rominou ; outfit="vacances" ; ring cream|theme|raised
<Icon name="plane" />                      // décorative ; label="…" si elle porte seule le sens
import { Hangul } from "@/components/ui/Hangul";
<Hangul className="text-clay">서울</Hangul>    // lang="ko" + Jua (police chargée seulement sur cette page)
```

Icônes (`IconName`) : briefcase, heart, chat, pin, cake, server, graduation, sprout, check, arrow-right,
arrow-down, arrow-up-right, chevron-down, close, plane, camera, send, stop, refresh, code, globe, database, cloud,
board, scale, mail, headphones, gamepad, lock, leaf, sparkle. Pour en ajouter : un tracé 24×24 dans `Icon.tsx`, mêmes
réglages de trait.

## 5. Shell (déjà en place)

- **Header** : tête de Rominou (vacances sur Hobby) + nom + accroche (`common.brand.tagline`, dès lg) ; onglets
  Pro / Hobby / Chat centrés (rail en creux, onglet actif en relief) ; FR/EN. **Une seule `<nav>`** : sous `md`
  elle devient le dock fixé en bas (zones sûres iOS, `viewport-fit=cover`). Header non collant (comme la maquette).
- **Footer** : tête + « Romain Campanha · Genève » + pilules M'écrire / LinkedIn / Instagram + date de mise à jour.
