# Design System Master File — Yaay Vidé

> **LOGIC:** When building a specific page, first check `design-system/yaayvide/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Yaay Vidé
**Generated:** 2026-11-11 (méthode ui-ux-pro-max, catégorie produit « Marketplace (P2P) », écrit à la main à partir des tokens existants)
**Category:** Marketplace P2P — seconde main bébé / enfant / maternité, Sénégal
**Design Dials:** Variance 5/10 (équilibré) | Motion 2/10 (subtil) | Density 5/10 (standard ; dashboards 7/10)
**Cible :** familles et mamans, majoritairement sur mobile (360 px), connexion moyenne.
**Ton :** chaleureux, simple, rassurant. Textes en français.

---

## Global Rules

### Color Palette

Source de vérité : `frontend/src/index.css` (`@theme`). **Ne jamais écrire de hex brut dans un composant.**

| Role | Hex | CSS Variable | Contraste sur blanc |
|------|-----|--------------|---------------------|
| Texte principal / structure | `#1B2430` | `--color-ink` | 15.6 ✅ |
| Texte secondaire | `#3A4350` | `--color-ink-soft` | 10.0 ✅ |
| Nuit (bandeaux sombres) | `#0A2B58` | `--color-night` | 14.0 ✅ |
| Fond page / surfaces | `#FFFFFF` | `--color-sable`, `--color-cream` | — |
| CTA principal (fond) | `#C4602F` | `--color-clay` | 4.15 ⚠️ gros texte uniquement |
| CTA hover / texte argile | `#A24E25` | `--color-clay-dark` | 5.75 ✅ |
| Teal marque (fonds, icônes) | `#1E93AC` | `--color-teal` | 3.61 ⚠️ pas pour du texte courant |
| Teal texte / liens | `#176F84` | `--color-teal-dark` | 5.76 ✅ |
| Orange marque (fonds, accents) | `#FB8502` | `--color-orange` | 2.48 ❌ jamais en texte ni sous du blanc |
| Orange foncé | `#D66F20` | `--color-orange-dark` | 3.41 ⚠️ gros texte uniquement |
| Bordure décorative | `#DED5C2` | `--color-line` | 1.46 (décoratif seulement) |

**Tokens d'accessibilité à ajouter (dérivés, pas de nouvelle teinte) :**

| Role | Hex | CSS Variable | Contraste | Usage |
|------|-----|--------------|-----------|-------|
| Prix / texte orangé | `#A85600` | `--color-orange-ink` | 5.26 ✅ | prix, montants, liens orangés |
| Bordure de champ | `#8F846F` | `--color-line-strong` | 3.69 ✅ (≥3:1 UI) | inputs, selects, cases |
| Succès | `#15803D` | (Tailwind `green-700`) | 5.02 ✅ | badge « Neuf », statuts OK |
| Avertissement | `#A16207` | (Tailwind `yellow-700`) | 4.92 ✅ | badge « Excellent état », en attente |
| Erreur | `#B42318` | (Tailwind `red-700`) | 6.57 ✅ | messages d'erreur |

**Color Notes :**
- Texte atténué : jamais en dessous de `text-ink-soft/75` (4.86:1). `/50`, `/55`, `/60` échouent (2.6 à 3.3:1).
- Texte blanc sur fond : seulement sur `ink`, `night`, `clay-dark`, `teal-dark`, `clay` (≥ 18 px gras). Sur `orange`, mettre du texte `ink` (6.3:1).
- Une exception de marque admise : la teinte prune de l'e-book (`#3D1B36`), à déclarer en token `--color-plum` au lieu de hex brut.

### Typography

- **Titres (h1–h2, titres de section) :** Bricolage Grotesque 800 → `font-impact font-extrabold`, interlignage 1.05–1.15, `text-balance`.
- **Accents (mots en italique, citations, prix e-book, bandeaux) :** Playfair Display (`font-serif` / `font-display`) ou Cormorant Garamond (`font-banner`). Jamais pour un paragraphe ni pour une étiquette.
- **Corps :** Poppins (`font-sans`), 16 px sur mobile (`text-base`), 14 px minimum pour le texte secondaire, interlignage 1.5–1.6.
- **Boutons / pastilles :** Quicksand 700 (`font-rounded`).
- **Taille minimale :** 12 px (`text-xs`) pour toute information utile. 11 px toléré seulement pour les badges en MAJUSCULES et en gras. Jamais en dessous de 11 px.
- Le chargement Google Fonts inclut « Inter », qui n'est pas utilisé : à retirer (gain réseau).

**Échelle :** 12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 (desktop hero 56–68).

### Spacing Variables

*Density : 5/10 (standard) ; tableaux de bord 7/10.*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Écart icône/texte |
| `--space-sm` | `8px` / `0.5rem` | Écart entre pastilles, gap minimum entre cibles tactiles |
| `--space-md` | `16px` / `1rem` | Marge latérale mobile, padding de carte |
| `--space-lg` | `24px` / `1.5rem` | Padding de bloc dashboard, gap de grille |
| `--space-xl` | `32px` / `2rem` | Écart entre blocs |
| `--space-2xl` | `48px` / `3rem` | Section (mobile) |
| `--space-3xl` | `64px` / `4rem` | Section (desktop), `py-16 md:py-24` maximum |

Conteneur : `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. Aucun défilement horizontal à 360 px.

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| Carte produit | `0 4px 14px -6px rgba(27,36,48,.18)` → hover `0 18px 36px -14px rgba(27,36,48,.32)` | ProductCard |
| Bloc dashboard | `SHADOW_CARD` = `0 10px 30px -14px rgba(27,36,48,.22)` | Tous les blocs blancs des tableaux de bord |
| Modale / tiroir | `0 24px 60px -20px rgba(27,36,48,.35)` | CartDrawer, modales |

Rayons : `rounded-btn` (8 px) boutons/champs, `rounded-m` (16 px) blocs, `rounded-[20px]` cartes produit, `rounded-full` pastilles.

---

## Component Specs

### Buttons (`components/ui/Button.jsx`)

```css
/* Primary */
.btn-primary { background: var(--color-clay); color: #fff; min-height: 44px; padding: 12px 24px;
  border-radius: 8px; font: 700 14px/1 var(--font-rounded); transition: background-color 200ms, transform 200ms, box-shadow 200ms; }
.btn-primary:hover { background: var(--color-clay-dark); transform: translateY(-2px); }
/* Secondary */
.btn-outline { border: 1px solid var(--color-ink); color: var(--color-ink); }
.btn-outline:hover { background: var(--color-ink); color: #fff; }
/* Orange : texte ink, jamais blanc */
.btn-orange { background: var(--color-orange); color: var(--color-ink); }
/* Tous */
:focus-visible { outline: 2px solid var(--color-clay); outline-offset: 3px; }
:disabled { opacity: .5; cursor: not-allowed; transform: none; }
```

### Cards

- **ProductCard :** compacte, image carrée, ~190 px dans les grilles. **Ne pas agrandir.** Badges ≥ 11 px gras, prix en `text-orange-ink`, effet 3D au survol désactivé si `prefers-reduced-motion`.
- **Stats dashboard :** `GRADIENT_CARDS[i % 4]` + `SHADOW_CARD` (`utils/gradientCards.js`). Ne pas créer d'autres variantes.
- **Bloc dashboard :** `bg-white rounded-m p-5 sm:p-6 ${SHADOW_CARD}`, titre `text-sm font-bold uppercase tracking-widest text-ink`.

### Inputs

```css
.input { min-height: 44px; padding: 10px 14px; border: 1px solid var(--color-line-strong);
  border-radius: 8px; font-size: 16px; /* évite le zoom iOS */ background: #fff; }
.input:focus-visible { border-color: var(--color-teal-dark); box-shadow: 0 0 0 4px rgb(30 147 172 / .18); outline: none; }
.input[aria-invalid="true"] { border-color: #B42318; }
```
`focus:outline-none` est interdit s'il n'est pas remplacé par un anneau visible (`focus-visible:ring-*`).

### États obligatoires

| État | Règle |
|------|-------|
| Chargement | Squelette `bg-line/40 animate-pulse` aux dimensions finales (pas de saut de mise en page). Spinner seulement pour les actions < 1 s. `aria-busy="true"` sur la zone. |
| Vide | Icône SVG douce + phrase chaleureuse + 1 action (« Découvrir la boutique »). |
| Erreur | Message près du champ ou du bloc, `role="alert"`, couleur erreur + icône. |
| Hover | Changement de couleur ou de relief en 150–200 ms. Jamais la seule indication. |
| Focus | Anneau visible sur tout élément interactif, y compris les cartes-liens. |
| Désactivé | `opacity-50 cursor-not-allowed`, sans effet de survol. |

### Modals / Drawers

Fond `bg-ink/50`, panneau blanc, `SHADOW` modale, fermeture par Échap et bouton avec `aria-label="Fermer"`, focus piégé.

---

## Style Guidelines

**Style :** « Vibrant & Block-based + Flat », chaleureux : grands aplats blancs, accents teal/orange/argile, photos réelles, micro-interactions discrètes.

**Key Effects :** révélation au scroll (`.reveal`), survol avec élévation (−2 px) et ombre, `btn-shine` réservé au CTA principal du hero.

### Page Pattern

**Accueil :** Hero → Catégories → Bonnes affaires → Meilleurs produits → Engagements (confiance) → Témoignages → CTA vendeuse → Blog.
**Boutique :** filtres (tiroir sur mobile) → grille 2 colonnes à 360 px, puis 3, 4 et 5.
**Produit :** galerie → prix et état → CTA collant en bas sur mobile → vendeuse → infos livraison/retour.
**Dashboards :** fond blanc pur, rangée de stats `GRADIENT_CARDS`, blocs `SHADOW_CARD`.

---

## Motion

- Durées : 150 ms (hover), 200–300 ms (entrée de composant), ≤ 500 ms (révélation). Easing `cubic-bezier(.2,.7,.2,1)`.
- N'animer que `transform` et `opacity`.
- **Toujours** respecter `prefers-reduced-motion`, en CSS et en JS (effet 3D de la ProductCard, carrousels).
- Animations infinies (marquee, drift, spin-slow, pulse-glow) : au plus une par écran visible.

---

## Performance (mobile, connexion moyenne)

- `loading="lazy"` + `decoding="async"` sur toute image sous la ligne de flottaison ; `width`/`height` ou `aspect-*` pour réserver la place.
- Images d'assets < 200 Ko (WebP de préférence). À optimiser : `vendeuse.jpg` (575 Ko), `client.png` (524 Ko), `cta-banner-bg.png` (497 Ko).
- Polices : ne charger que les graisses utilisées.

---

## Anti-Patterns (Do NOT Use)

- ❌ Texte blanc sur `orange` ou `yellow-*` ; texte `orange` ou `teal` en corps de texte sur blanc
- ❌ `text-ink-soft/50`, `/55` ou `/60` pour une information utile
- ❌ Texte < 11 px (`text-[8.5px]`, `text-[9px]`, `text-[10px]`)
- ❌ `focus:outline-none` sans anneau de remplacement
- ❌ Hex brut ou couleurs hors palette (`#2563eb`, `#1DC8E0`, `#2E8B8B`)
- ❌ Playfair pour les grands titres de page (→ Bricolage `font-impact`)
- ❌ Nouvelles variantes de cartes dégradées hors `GRADIENT_CARDS`
- ❌ Agrandir les cartes produit
- ❌ Émojis comme icônes (SVG uniquement)
- ❌ Changements d'état instantanés ou animations sans réduction de mouvement

---

## Pre-Delivery Checklist

- [ ] Contraste texte ≥ 4.5:1 (≥ 3:1 pour le texte ≥ 18 px gras et les bordures de champs)
- [ ] Focus clavier visible sur boutons, liens, cartes et champs
- [ ] Cibles tactiles ≥ 44×44 px, espacées d'au moins 8 px
- [ ] États chargement / vide / erreur présents
- [ ] `prefers-reduced-motion` respecté (CSS et JS)
- [ ] Responsive : 360 px, 768 px, 1024 px, 1440 px — aucun défilement horizontal
- [ ] Images lazy avec dimensions réservées
- [ ] Aucun comportement ni appel API modifié
