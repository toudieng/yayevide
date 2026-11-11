# Yaay Vidé mobile : feuille de route

> Estimation pour **une seule développeuse** à temps plein (1 j = 1 jour de travail effectif).
> Stack : React Native avec Expo (EAS Build et EAS Submit), même backend Django, même base de données.
> Ordre : backend prêt → MVP Android → iOS.

## Étapes

| Phase | Contenu | Durée |
|---|---|---|
| **0. Cadrage** | Valider `ECRANS.md`, le périmètre v1, les maquettes des 6 écrans clés, le domaine et l'hébergeur | 3 à 5 j |
| **1. Backend prêt pour le mobile** | Tout `BACKEND-A-PREVOIR.md` : jetons, PostgreSQL, HTTPS, v1, push, suppression de compte, pagination | 14 à 20 j |
| **2. Socle de l'app** | Projet Expo, navigation, tokens de `DESIGN.md`, composants de base, client API avec jeton, gestion hors connexion | 5 à 7 j |
| **3. Parcours communs** | Connexion, inscription, mot de passe oublié, profil, « Une question ? », suppression de compte | 5 à 6 j |
| **4. Parcours cliente** | Accueil, catalogue et filtres, fiche, favoris, panier, commande, suivi commandes et locations, avis, plaintes | 14 à 18 j |
| **5. Parcours vendeuse** | Tableau de bord, articles (photos avec l'appareil), commandes, locations (contre-proposition, prolongation), avis, boutique | 9 à 12 j |
| **6. Parcours livreur** | Courses, statuts, retours, revenus, documents | 5 à 7 j |
| **7. Notifications push** | Branchement côté app, liens profonds | 3 à 4 j |
| **8. Tests et finitions Android** | Vrais téléphones Android d'entrée de gamme, réseau lent, accessibilité, corrections | 6 à 8 j |
| **9. Publication Android** | Fiche Play Store, captures, tests fermés (12 testeurs pendant 14 jours si compte personnel), mise en ligne | 3 j de travail + **2 à 3 semaines d'attente** |
| **= MVP Android** | | **≈ 65 à 90 j** (3,5 à 4,5 mois) |
| **10. iOS** | Adaptations iOS (zones sûres, gestes, permissions), TestFlight, fiche App Store, validation Apple | 8 à 12 j + **1 à 3 semaines** d'aller-retour avec Apple |
| **11. Après lancement** | Corrections, petites évolutions, mises à jour Expo et Android/iOS | Maintenance mensuelle |

**Total Android + iOS : environ 75 à 100 jours de travail, soit 4 à 6 mois calendaires.**

Ce qui n'est **pas** compris : le paiement en ligne InTouch (à chiffrer à part quand l'API sera fournie), l'espace admin mobile, le blog, le mode sombre.

## Risques

| Risque | Impact | Parade |
|---|---|---|
| **Validation Apple** | Refus pour app « trop proche du site », absence de suppression de compte, liens de paiement de l'e-book (produit numérique) | Fonctions natives utiles (push, appareil photo), suppression de compte intégrée, e-book non vendu dans l'app iOS (ou via l'achat intégré d'Apple, avec 15 à 30 % de commission). Prévoir 1 à 2 refus. |
| **Intégration InTouch** | Documentation, compte marchand et environnement de test dépendent du prestataire, avec des délais imprévisibles | Lancer le MVP avec le mode actuel (paiement à la livraison ou mobile money confirmé à la main) ; InTouch en v1.1. |
| **Hébergement** | Serveur instable ou adresse qui change, et l'app installée ne marche plus | Domaine fixe, HTTPS, supervision et sauvegardes avant toute publication. |
| **Tests Play Store** | Un compte Google **personnel** récent doit faire tester l'app par 12 personnes pendant 14 jours | Ouvrir un compte **organisation** (D-U-N-S requis) ou recruter tôt 12 testrices parmi les vendeuses. |
| **Compte organisation Apple** | Exige un numéro D-U-N-S (gratuit, mais 1 à 3 semaines) et une entité légale | Le demander dès la phase 0. |
| **Double maintenance web + mobile** | Une modification de l'API peut casser l'app | API versionnée (`v1`), tests backend, version minimale de l'app. |
| **Téléphones modestes et réseau lent** | Lenteurs, données consommées | Miniatures WebP, cache d'images, listes virtualisées. |

## Comptes à créer **au nom de la cliente** (pas au nom de la développeuse)

| Compte | Coût | Remarques |
|---|---|---|
| Google Play Console | 25 $ une seule fois (≈ 15 000 FCFA) | Type organisation conseillé. La développeuse y est invitée comme utilisatrice. |
| Apple Developer Program | 99 $ par an (≈ 60 000 FCFA) | Organisation : numéro D-U-N-S nécessaire. La développeuse est invitée via App Store Connect. |
| Numéro D-U-N-S | Gratuit | Pour les deux stores en mode organisation. |
| Expo (EAS) | Gratuit au départ ; offre payante si les compilations dépassent le quota | Compte de l'organisation, développeuse invitée. |
| Nom de domaine et hébergement | Selon l'offre (OVHcloud…) | Au nom de la cliente. |
| E-mail professionnel | Par exemple `contact@…` | Contact des fiches store et support. |

Les comptes, le code signé et les clés de signature appartiennent à la cliente : si elle change de prestataire, elle garde son application.

## À clarifier

1. Périmètre exact de la v1 : l'e-book est-il dans l'app ? La location dès la v1 ?
2. Date cible de lancement (des fêtes ou une rentrée imposent un calendrier).
3. Qui teste (12 testrices Android) et qui répond aux avis sur les stores ?
4. Budget de maintenance mensuel après le lancement.
