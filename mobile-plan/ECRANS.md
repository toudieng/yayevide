# Yaay Vidé mobile : écrans et endpoints

> Document de préparation. Les chemins listés sont ceux qui existent aujourd'hui dans
> `backend/marketplace/urls.py` (préfixe `/api/`). L'admin reste sur le web.
> Un endpoint qui n'existe pas encore est signalé **« À clarifier »** ou renvoie vers `BACKEND-A-PREVOIR.md`.

## 0. Écrans communs (tous les profils)

| Écran | Endpoints existants | Remarques |
|---|---|---|
| Démarrage et chargement de la session | `GET moi/` | Le rôle renvoyé (`acheteur`, `vendeur`, `livreur`) choisit la navigation à afficher. |
| Connexion | `POST connexion/` | Session et cookie aujourd'hui, jeton à prévoir (voir BACKEND). |
| Inscription | `POST inscription/` | Le même endpoint sert la cliente et la vendeuse (champ `role`). |
| Vérification de la boutique | `GET statut-boutique/<username>/`, `POST renvoyer-verification-email/`, `GET verifier-email/<username>/<token>/` | Le lien de l'e-mail doit ouvrir l'application (lien profond, voir BACKEND). |
| Mot de passe oublié | `POST mot-de-passe-oublie/`, `POST reinitialiser-mot-de-passe/` | Le lien de l'e-mail pointe vers le site : à rediriger vers l'app (lien profond). |
| Déconnexion | `POST deconnexion/` | |
| Une question ? (discussion avec l'équipe) | `GET/POST support/`, `GET support/non-lus/`, `GET support/elements-joignables/` | Interrogation toutes les 5 s comme sur le web ; une notification push la remplacera. |
| Profil et adresse | `GET/PATCH moi/`, `PATCH mon-adresse/` | |
| Supprimer mon compte | **Aucun** | Obligatoire pour les stores (voir BACKEND). |
| Pages d'aide (FAQ, CGV, confidentialité, retours, guides) | Aucun, contenu statique | Ouvrir les pages du site dans un navigateur intégré, pour ne pas dupliquer le texte. |

## 1. Cliente (acheteuse ou locataire)

### Barre d'onglets
| Onglet | Icône | Écran racine |
|---|---|---|
| Accueil | maison | Accueil |
| Boutique | grille | Catalogue |
| Favoris | cœur | Mes favoris |
| Panier | sac (avec pastille) | Panier |
| Compte | personne | Mon compte |

### Écrans
| Écran | Endpoints existants | Remarques |
|---|---|---|
| Accueil (tendances, rayons) | `GET produits/?tri=tendance`, `GET categories/` | |
| Catalogue et filtres | `GET produits/?categorie=…&occasion=…&bonne_affaire=true&tri=…`, `GET categories/` | **À clarifier** : pas de pagination côté serveur et la recherche par mot-clé semble faite côté client. Les deux sont nécessaires sur mobile. |
| Fiche produit | `GET produits/<id>/`, `GET produits/<id>/autres-articles-boutique/`, `GET produits/<id>/reservations/` (location) | |
| Ajouter ou retirer un favori | `POST produits/<id>/favori/` | |
| Mes favoris | `GET mes-favoris/` | |
| Boutique d'une vendeuse | `GET boutiques/<slug>/` | |
| Laisser un avis | `POST boutiques/<slug>/avis/` | |
| Panier | Aucun, il est stocké sur l'appareil | Comme le site (localStorage). Sur mobile : AsyncStorage, vidé quand on change de compte. |
| Livraison et estimation | `GET zones-livraison/`, `POST estimer-livraison/` | |
| Paiement et commande | `POST commandes/` | `mode_paiement` : Wave, Orange Money, Mixx, espèces. **À clarifier** : aucun paiement en ligne réel aujourd'hui ; InTouch est prévu plus tard. |
| Mes commandes | `GET mes-commandes/` | |
| Mes locations (suivi) | `GET mes-commandes/`, `POST locations/<id>/reponse-proposition/`, `POST locations/<id>/annuler/`, `POST locations/<id>/prolongation/` | Accepter ou refuser une contre-proposition de dates, demander une prolongation. |
| Signaler un problème (plainte) | `GET/POST mes-plaintes/` | |
| E-book | `GET ebook/`, `POST ebook/acheter/`, `GET ebook/telecharger/<token>/` | `ebook/paiement/simuler-confirmation/` sert seulement aux tests : ne pas l'utiliser dans l'app. **À clarifier** : vendre l'e-book dans l'app iOS peut obliger à passer par l'achat intégré d'Apple (voir ROADMAP, risques). |

## 2. Vendeuse

Elle garde aussi l'accès achat (Accueil et Boutique). La barre d'onglets change selon le rôle.

### Barre d'onglets
| Onglet | Icône | Écran racine |
|---|---|---|
| Tableau de bord | graphique | Tableau de bord |
| Mes articles | étiquette | Mes articles |
| Vendre (+) | plus | Ajouter un article |
| Commandes | sac (avec pastille) | Commandes et locations |
| Compte | personne | Ma boutique, avis, aide |

### Écrans
| Écran | Endpoints existants | Remarques |
|---|---|---|
| Tableau de bord | `GET mes-ventes/`, `GET mes-commandes-vendeuse/`, `GET ma-boutique/` | |
| Mes articles | `GET mes-produits/` | |
| Ajouter un article (photos via l'appareil photo) | `POST ajouter-produit/` (multipart) | Compresser les photos sur le téléphone avant l'envoi. |
| Modifier un article | `PATCH mes-produits/<id>/modifier/` | |
| Disponibilité, suppression | `PATCH` et `DELETE mes-produits/<id>/disponibilite/` | |
| Commandes reçues | `GET mes-commandes-vendeuse/`, `PATCH commandes/<id>/confirmer-disponibilite/` | |
| Locations | `GET mes-commandes-vendeuse/`, `POST locations/<id>/contre-proposition/`, `POST locations/<id>/prolongation/reponse/` | `commandes/<id>/marquer-retournee/` renvoie maintenant 400 : ne pas l'utiliser, le retour passe par le livreur et l'admin. |
| Ventes et revenus | `GET mes-ventes/` | |
| Avis reçus et réponses | `GET mes-avis/`, `PATCH mes-avis/<id>/repondre/` | |
| Ma boutique (nom, photo, description) | `GET/PATCH ma-boutique/` | |

## 3. Livreur

### Barre d'onglets
| Onglet | Icône | Écran racine |
|---|---|---|
| Aujourd'hui | horloge | Tableau de bord du jour |
| Courses | camion | Disponibles et mes livraisons |
| Retours | flèche retour | Retours de location |
| Revenus | portefeuille | Revenus et historique |
| Profil | personne | Profil et documents |

### Écrans
| Écran | Endpoints existants | Remarques |
|---|---|---|
| Aujourd'hui | `GET livreur/stats-jour/`, `GET livreur/notifications/` | |
| Courses disponibles | `GET livreur/livraisons-disponibles/`, `PATCH livreur/commandes/<id>/prendre-en-charge/` | |
| Mes livraisons et changement de statut | `GET livreur/mes-livraisons/`, `PATCH livreur/commandes/<id>/statut/` | Gros boutons d'action et appel de la cliente en un toucher (`tel:`). |
| Retours de location | `GET livreur/retours/`, `PATCH livreur/retours/<id>/` | |
| Historique | `GET livreur/historique/` | |
| Revenus | `GET livreur/mes-revenus/` | |
| Notifications | `GET livreur/notifications/` | À remplacer par du push. |
| Profil et documents | `GET/PATCH moi/`, `PATCH livreur/documents/` | Envoi de photos de pièces. |

## 4. Hors périmètre mobile (reste sur le web)

Tout ce qui est sous `admin/…` : statistiques, utilisatrices, vendeuses, produits, commandes, catégories, plaintes, questions, e-book, locations (planifier le retour, clôturer).

## 5. À clarifier

1. **Pagination et recherche** : `GET produits/` renvoie toute la liste, filtrée seulement par `categorie`, `occasion`, `bonne_affaire` et `tri`. Il faut une pagination et un paramètre de recherche texte avant que le catalogue grandisse.
2. **Notifications pour la cliente et la vendeuse** : seul le livreur a un endpoint (`livreur/notifications/`). Il n'existe rien pour « commande confirmée », « contre-proposition reçue » ou « réponse de l'équipe ».
3. **Paiement en ligne** : les modes sont enregistrés, mais aucun paiement réel n'est intégré (InTouch est prévu).
4. **Liens profonds** : les e-mails (vérification, mot de passe, réponse de l'équipe) pointent vers le site. Faut-il ouvrir l'application quand elle est installée ?
5. **Blog** : il n'a pas d'endpoint (contenu dans le frontend). À exclure de la v1 ou à ouvrir dans un navigateur intégré.
6. **Images** : les URL des médias sont-elles absolues dans toutes les réponses ? À vérifier sur un serveur HTTPS réel.
