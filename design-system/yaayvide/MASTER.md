# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Yaay Vidé — marketplace sénégalaise de seconde main (bébé, enfant, maternité)
**Stack:** React 19 + Vite + Tailwind CSS v4 (`@theme` dans `src/index.css`)
**Audience:** familles et mamans au Sénégal, majoritairement mobile, connexion moyenne
**Generated:** 2026-11-11 12:03:03
**Category:** Classifieds / Buy-Sell
**Design Dials:** Motion 3/10 (Subtle)

---

## Global Rules

> Ancré sur les tokens existants de `frontend/src/index.css` (`@theme`). Le skill
> a proposé une palette bleue générique « classifieds » : **rejetée** au profit de
> l'identité Yaay Vidé. On renforce, on ne remplace pas.

### Color Palette (tokens Tailwind existants)

| Rôle | Token | Hex | Contraste sur blanc | Usage autorisé |
|------|-------|-----|---------------------|----------------|
| Texte principal | `ink` | `#1B2430` | 15.6:1 | Titres, corps |
| Texte secondaire | `ink-soft` | `#3A4350` | 10.0:1 | Corps secondaire |
| Texte discret | `ink-soft/75` | — | 4.9:1 | **Minimum** pour tout texte lisible |
| Structure sombre | `night` | `#0A2B58` | 14.0:1 | Bandeaux, footer |
| Fond | `sable` / `cream` | `#FFFFFF` | — | Toutes les surfaces |
| Accent clay | `clay` | `#C4602F` | 4.15:1 | Mots-accents des grands titres, icônes, soulignés — pas de fond sous texte blanc courant |
| CTA principal / texte | `clay-dark` | `#A24E25` | 5.75:1 | Fond des boutons principaux, prix, liens et petit texte clay |
| Marque teal | `teal` | `#1E93AC` | 3.6:1 | Fonds, icônes, bordures, focus — **pas** de texte courant |
| Texte teal | `teal-dark` | `#176F84` | 5.8:1 | Liens, badges, texte teal |
| Accent orange | `orange` | `#FB8502` | 2.5:1 | Fonds décoratifs, pastilles avec texte `ink` (6.3:1) |
| Texte orange | `orange-dark` | `#D66F20` | 3.4:1 | Prix grand format (≥ 18 px gras) uniquement |
| Bordures | `line` | `#DED5C2` | 1.5:1 | Séparateurs, contours non essentiels |

**Règles couleur**
- Texte courant : `ink`, `ink-soft`, ou `ink-soft/75` minimum. Bannir `ink-soft/30-70` pour du texte lisible (réservé aux icônes décoratives / placeholders).
- Jamais de texte blanc sur `orange` ni `teal` clair en petite taille ; utiliser `teal-dark`, `clay`/`clay-dark` ou texte `ink` sur `orange`.
- Pas de hex en dur dans les composants (sauf `GRADIENT_CARDS`).
- États sémantiques : erreur `red-600/700` + fond `red-50`, succès `teal-dark` + fond `teal/10`.

### Typography

| Rôle | Police | Classe |
|------|--------|--------|
| Titres H1/H2 (impact) | Bricolage Grotesque 800 | `font-impact font-extrabold` |
| Accents éditoriaux (titres de produit, citations) | Playfair Display | `font-serif` |
| Accents bannière | Cormorant Garamond | `font-banner` |
| Corps / UI | Poppins 400-700 | `font-sans` (défaut) |

- Échelle : 12 (minimum absolu, méta) · 14 (UI) · 16 (corps) · 18 · 20 · 24 · 28/32 (H1 mobile/desktop) · 40+ (hero).
- Pas de texte < 11 px ; badges ≥ 10 px gras uppercase.
- `leading-relaxed` (1.6) pour le corps, `leading-tight` pour les titres, `text-balance` sur H1/H2.
- Charger uniquement les familles utilisées (Inter est chargé mais inutilisé → à retirer).

### Spacing

Échelle Tailwind 4 px. Gouttière mobile 16 px (`px-4`), tablette 24 px (`sm:px-6`), desktop 32 px (`lg:px-8`).
Sections : `py-12` mobile → `py-16`/`py-20` desktop. Écart entre cartes : `gap-3` mobile, `gap-4`/`gap-5` desktop.

### Radius & Shadows

- `rounded-btn` (8 px) boutons carrés, `rounded-full` boutons pilule, `rounded-m` (16 px) blocs, `rounded-[20px]` cartes produit.
- Tableaux de bord : **uniquement** `SHADOW_CARD` et `GRADIENT_CARDS` de `utils/gradientCards.js` (importer la constante, ne pas recopier la valeur).
- Site public : ombre douce teintée encre `rgba(27,36,48,…)`, jamais de noir pur.

---

## Component Specs

### Buttons
- Primaire : `bg-clay-dark text-white font-bold hover:bg-ink` (5.7:1), hauteur ≥ 44 px, `transition-colors duration-200`. Le `<Button variant="primary">` partagé l'applique déjà.
- Jamais de texte blanc sur `orange` : un fond orange prend un texte `ink` (ex. badge « Occasion spéciale », bandeau d'annonce).
- Secondaire : `border border-ink/15 text-ink hover:border-teal hover:text-teal-dark`.
- Focus : `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay` (déjà global) — ne jamais le supprimer avec `outline-none` sans remplaçant `focus-visible:ring-2 ring-teal/40`.
- Désactivé : `disabled:opacity-50 disabled:cursor-not-allowed`. Chargement : libellé « … en cours » + `aria-busy`.

### Inputs
- `h-11 px-4 rounded-btn border border-line bg-white text-[16px] sm:text-sm` (16 px sur mobile pour éviter le zoom iOS).
- Focus : `focus:border-teal focus-visible:ring-2 focus-visible:ring-teal/30`.
- Erreur : bordure `red-500`, message `text-red-700 text-[13px]` sous le champ.

### Cartes produit
- Compactes, image carrée, ~190 px de large en grille — **ne pas agrandir**.
- Prix lisible (`ink` ou `orange-dark` gras), badges ≥ 10 px, bouton ≥ 36 px.

### États (composants partagés)
- `components/ui/EtatVide.jsx` : état vide (icône douce + titre + texte + action), `compact` / `bordure={false}` dans les blocs.
- `components/ui/SqueletteTableau.jsx` : chargement des tableaux de bord (silhouette menu + stats + blocs, `role="status"`).
- Chargement : squelettes `bg-line/40 animate-pulse` à la forme du contenu (pas de spinner plein écran quand une mise en page est connue).
- Vide : icône SVG douce + phrase chaleureuse + action (lien/bouton).
- Erreur : message clair + « Réessayer ».

---

## Style Guidelines

**Style:** Flat Design chaleureux (adapté) — aplats de la palette, ombres douces teintées encre, dégradés réservés aux cartes stats des tableaux de bord

**Keywords:** 2D, minimalist, bold colors, no shadows, clean lines, simple shapes, typography-focused, modern, icon-heavy

**Best For:** Web apps, mobile apps, cross-platform, startup MVPs, user-friendly, SaaS, dashboards, corporate

**Key Effects:** Ombres douces (pas de noir pur), dégradés seulement via `GRADIENT_CARDS`, simple hover (color/opacity shift), fast loading, clean transitions (150-200ms ease), minimal icons

### Page Pattern

**Pattern Name:** Marketplace / Directory

- **Conversion Strategy:** Search is the primary CTA. Reduce friction with useful suggestions. For featured-listing carousels, provide previous/next and play/pause buttons, full keyboard access, and a single-pointer alternative to swiping; stop rotation on focus, hover, offscreen/hidden, or reduced motion and render the selected listing as the static final state.
- **CTA Placement:** Hero Search Bar + Navbar 'List your item'
- **Section Order:** Hero (Search focused) > Categories > Featured Listings > Trust/Safety > CTA (Become a host/seller)

---

## Motion

Niveau 3/10 (discret). **Pas de GSAP** (aucune nouvelle dépendance) : on utilise les utilitaires CSS de `index.css` (`.reveal`, `animate-card-in`, `animate-fade-in`).
- Durées : 150-200 ms (hover/focus), 300-450 ms (apparitions). Décalage d'apparition 8-16 px.
- Animer uniquement `opacity` et `transform`.
- Toute animation (CSS **et** JS, ex. tilt 3D des cartes) doit être désactivée sous `prefers-reduced-motion: reduce`.
- Animations infinies limitées au hero ; aucune dans les tableaux de bord.

---

## Anti-Patterns (Do NOT Use)

- ❌ No trust cues
- ❌ text-heavy pages
- ❌ hidden filters

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use inline SVG icons (style trait 1.8-2, comme l'existant)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons inline SVG, même épaisseur de trait
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 360px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
