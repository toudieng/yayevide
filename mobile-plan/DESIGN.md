# Yaay Vidé mobile : système de design

> Document de préparation. L'application n'existe pas encore.
> Stack prévue : React Native avec Expo (Android d'abord, iOS ensuite).
> Source : la charte du site (`frontend/src/index.css`, `design-system/yaayvide/MASTER.md`).
> On reprend l'identité du site et on l'adapte au tactile. On ne la réinvente pas.

## 1. Principes

| Principe | Règle concrète |
|---|---|
| Thème clair d'abord | Fond blanc, texte `ink`. Le mode sombre viendra plus tard ; les tokens sont nommés pour le permettre. |
| Lisible en plein soleil | Texte courant au moins à 4,5:1, informations clés (prix, statut, bouton) au moins à 7:1. Pas de gris clair pour une info utile. |
| Zones tactiles | Au moins 44 × 44 pt (iOS) et 48 × 48 dp (Android). Une icône plus petite reçoit un `hitSlop`. |
| Pouce d'abord | Actions principales en bas (barre d'onglets, bouton fixe « Ajouter au panier », « Payer »). |
| Connexion moyenne | Squelettes de chargement, images compressées et mises en cache, pas d'animation lourde. |
| Mouvement discret | Retour visuel au toucher entre 80 et 150 ms ; « Réduire les animations » du téléphone respecté. |
| Français, ton chaleureux | Mêmes formulations que le site (« Une question ? », « Bonne affaire »…). |

## 2. Couleurs (tokens)

Mêmes valeurs que le site. Les composants n'utilisent que des noms de tokens, jamais de code hexadécimal en dur.

| Token | Hex | Contraste sur blanc | Usage mobile |
|---|---|---|---|
| `ink` | `#1B2430` | 15,6:1 | Titres, corps, **prix** |
| `inkSoft` | `#3A4350` | 10,0:1 | Texte secondaire |
| `inkMuted` | `#3A4350` à 75 % | ≈ 4,9:1 | Méta-informations (lieu, date). Jamais plus clair. |
| `night` | `#0A2B58` | 14,0:1 | En-têtes sombres, écran de démarrage |
| `surface` | `#FFFFFF` | — | Fond de toutes les pages et cartes |
| `surfaceWarm` | `#FDF6EE` (creme) | — | Fond des zones de discussion, encarts doux |
| `peche` | `#F9E9DE` | — | Bandeaux d'information |
| `clay` | `#C4602F` | 4,15:1 | Icônes, soulignés, accents de titre (grand texte) |
| `clayDark` | `#A24E25` | 5,75:1 | **Bouton principal** (texte blanc), liens |
| `teal` | `#1E93AC` | 3,6:1 | Icônes actives, bordures de focus, puces |
| `tealDark` | `#176F84` | 5,8:1 | Texte teal, onglet actif, badges d'information |
| `orange` | `#FB8502` | 2,5:1 | Fonds décoratifs avec texte `ink` (6,3:1) seulement |
| `line` | `#DED5C2` | 1,5:1 | Séparateurs décoratifs |
| `lineStrong` | `#B8AE9A` | ≥ 3:1 | Contour des champs de formulaire (lisible au soleil) |
| `danger` | `#B91C1C` | 6,4:1 | Erreurs, badge « Bonne affaire » (texte blanc) |
| `success` | `tealDark` sur fond `teal` à 10 % | — | Confirmations |

**Règles**
- Texte blanc uniquement sur `clayDark`, `tealDark`, `night`, `ink` ou `danger`. Jamais sur `orange` ni sur `teal`.
- Un statut ne passe jamais par la couleur seule : toujours un libellé (« En attente », « Livrée »…).
- `lineStrong` est une proposition propre au mobile. **À clarifier** : la faire valider par la cliente.

## 3. Typographie

Les polices du site sont reprises. Pour limiter le poids de l'application, on n'en charge que **trois** (Cormorant Garamond et Quicksand restent sur le web).

| Rôle | Police | Taille / interligne | Graisse |
|---|---|---|---|
| Titre d'écran | Bricolage Grotesque | 24 / 30 | 800 |
| Titre de section | Bricolage Grotesque | 20 / 26 | 800 |
| Titre de produit | Playfair Display | 17 / 22 | 600 |
| Corps | Poppins | 16 / 24 | 400 |
| UI (boutons, onglets, champs) | Poppins | 15 / 20 | 600 |
| Prix | Poppins | 16 / 20 (carte) et 22 / 28 (fiche) | 700 |
| Méta (lieu, date) | Poppins | 13 / 18 | 400 |
| Badge | Poppins | 11 / 14 | 700 |
| Libellé de la barre d'onglets | Poppins | 11 / 14 | 600 |

- Rien sous 11 pt. Le corps reste à 16 pt.
- Les tailles suivent le réglage « Taille du texte » du téléphone (jusqu'à environ 130 %), sans casser la mise en page.
- Prix au format `5 500 FCFA` avec une espace insécable, sur une seule ligne.

## 4. Espacements, rayons, ombres

| Token | Valeur | Usage |
|---|---|---|
| `space.1` | 4 | Écart icône / texte |
| `space.2` | 8 | Entre éléments d'une carte |
| `space.3` | 12 | Gouttière de la grille produits |
| `space.4` | 16 | **Marge latérale des écrans** |
| `space.6` | 24 | Entre sections |
| `space.8` | 32 | Haut et bas d'un écran |
| `radius.btn` | 8 | Boutons, champs (comme le site) |
| `radius.card` | 16 | Cartes, feuilles du bas |
| `radius.pill` | 999 | Puces de filtre, badges |
| `shadow.card` | iOS : opacité 0,08, rayon 12, décalage y 4 · Android : `elevation` 2 | Cartes produit |
| `shadow.sheet` | iOS : opacité 0,18, rayon 24 · Android : `elevation` 8 | Feuilles du bas, barre d'achat fixe |

Rythme vertical de 4 et 8. Les zones sûres (encoche, barre de geste) sont toujours respectées en haut et en bas.

## 5. Icônes

- Une seule famille d'icônes au trait (style Lucide, trait de 1,75), en 20, 24 et 28 pt.
- Contour pour l'état normal, plein pour l'onglet actif et le favori ajouté.
- Pas d'émoji comme icône. Logos de paiement officiels (Wave, Orange Money, Mixx by Yas), comme dans `frontend/src/assets/paiement`.
- **À clarifier** : le choix de la bibliothèque (lucide-react-native ou @expo/vector-icons) se fera au démarrage du projet, avec ton accord, car c'est une dépendance.

## 6. Composants clés

### Carte produit (grille de 2 colonnes)
- Même logique que la grille mobile du site : 2 colonnes, gouttière 12, largeur environ 160 à 170 pt sur un téléphone de 360 à 390.
- Photo au format 4:5, coins de 16, squelette pendant le chargement.
- Badges en haut à gauche : état (texte `ink` sur blanc) et « Bonne affaire » (texte blanc sur `danger`). Bouton favori en haut à droite, zone tactile de 44.
- Contenu : catégorie (`tealDark`, 13), titre (Playfair, 1 ligne), prix (`ink`, gras, à droite du titre ou dessous si ça ne tient pas), lieu (méta, 1 ligne) et bouclier « boutique vérifiée ».
- Location : prix suivi de « /j ».
- Toute la carte est touchable (ouvre la fiche), avec une légère baisse d'opacité au toucher.

### Barre d'onglets (en bas)
- 4 ou 5 onglets au maximum, une icône et un libellé toujours visible.
- Onglet actif : icône pleine et libellé en `tealDark`. Inactif : `inkSoft`.
- Pastille rouge avec chiffre pour le panier et les réponses de l'équipe (lue aussi par le lecteur d'écran, par exemple « Panier, 2 articles »).
- Hauteur de 56 plus la zone sûre du bas.

### Panier
- Une ligne par article : miniature de 64, titre, taille, prix sur une ligne, lien « Retirer » souligné (zone de 44).
- Pour une location : dates, nombre de jours et caution sur leur propre ligne, en `ink`.
- Barre fixe en bas : « Total à payer » sur une ligne, puis le bouton « Commander » (`clayDark`, hauteur 52, pleine largeur).

### Fiche produit
- Carrousel de photos plein écran avec pagination par points et compteur « 1/4 » pour l'accessibilité.
- Badges, titre, prix, état, taille, lieu, vendeuse (lien vers sa boutique).
- Location : sélection de dates dans une feuille du bas, jours déjà réservés grisés **et** barrés (pas seulement colorés).
- Barre d'achat fixe en bas : prix et bouton « Ajouter au panier » ou « Louer ».

### Formulaires
- Libellé toujours visible au-dessus du champ, jamais seulement un texte indicatif.
- Champ de 48 de haut, contour `lineStrong`, focus en `teal` sur 2 pt.
- Clavier adapté : téléphone, e-mail, nombre. Bouton « Suivant » qui passe au champ suivant.
- Erreur sous le champ, en `danger`, avec une icône. Le texte saisi est conservé.
- Connexion compatible avec les gestionnaires de mots de passe (champs `username` et `password` déclarés) et le copier-coller.
- Ajout de produit en étapes courtes (Photos → Infos → Prix → Vérifier), avec une barre de progression.

### États vides et erreurs
- Même esprit que `EtatVide` sur le site : une icône au trait, un titre court, une phrase chaleureuse et une action.
  - Exemple : « Votre panier est vide » / « Des trésors vous attendent dans la boutique » / bouton « Découvrir ».
- Hors connexion : bandeau `peche` « Pas de connexion. On réessaie dès que le réseau revient. ». Les données déjà chargées restent visibles.
- Erreur serveur : message simple et bouton « Réessayer ». Jamais de code d'erreur brut.

### Autres
- Feuille du bas (filtres, dates, choix du paiement) avec poignée et bouton « Fermer » (le glisser n'est jamais le seul moyen).
- Notification interne (toast) en haut, 3 à 4 secondes, sans masquer la barre d'action.
- Discussion « Une question ? » : bulles comme le site, fond `surfaceWarm`, zone de saisie collée au clavier.

## 7. Accessibilité (liste de contrôle)

- [ ] Chaque contrôle a un `accessibilityLabel` et le bon `accessibilityRole`.
- [ ] Les icônes décoratives sont masquées au lecteur d'écran.
- [ ] L'ordre de lecture suit l'ordre visuel.
- [ ] Les états (sélectionné, désactivé, ouvert) sont annoncés.
- [ ] Testé avec TalkBack (Android) et VoiceOver (iOS), avec un texte agrandi et les animations réduites.
- [ ] Testé sur un petit Android (360 dp) en plein jour.
