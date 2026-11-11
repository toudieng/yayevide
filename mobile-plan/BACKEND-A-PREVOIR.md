# Yaay Vidé mobile : ce qu'il faudra ajouter côté Django

> À faire **plus tard**, au démarrage du projet mobile, et pas maintenant.
> Principe : le site continue de fonctionner exactement comme aujourd'hui. Tout est **ajouté à côté**.

## État actuel (relevé dans le code)

| Sujet | Aujourd'hui | Fichier |
|---|---|---|
| Authentification | Session et cookie, avec un jeton CSRF pour chaque écriture | `core/settings.py`, `frontend/src/utils/api.js` |
| Base de données | SQLite | `core/settings.py` (`DATABASES`) |
| Mode debug | `DEBUG = True` et clé secrète écrite dans le fichier | `core/settings.py` |
| Hôtes autorisés | localhost, ngrok, trycloudflare | `ALLOWED_HOSTS` |
| Dépendances | Django 6, DRF 3.17, django-cors-headers, Pillow | `requirements.txt` |
| Préfixe API | `/api/…`, sans version | `core/urls.py` |
| Pagination | Aucune | `ProduitListView` |
| Suppression de compte | Aucune | — |

## Travaux à prévoir

| # | Sujet | Ce qu'il faut faire | Effort |
|---|---|---|---|
| 1 | **Authentification par jeton** | Ajouter `djangorestframework-simplejwt` **en plus** de la session. Endpoints `POST api/v1/auth/jeton/` (connexion), `…/jeton/rafraichir/` et `…/jeton/deconnexion/` (liste noire). Ajouter `JWTAuthentication` à `DEFAULT_AUTHENTICATION_CLASSES` sans retirer `SessionAuthentication` : le site reste en session. Jeton d'accès court (15 à 30 min) et jeton de rafraîchissement de 30 jours, stocké dans `expo-secure-store` côté app. | 2 à 3 j |
| 2 | **Jeton de notifications push** | Modèle `AppareilPush` (utilisateur, jeton Expo, plateforme, date de dernière vue, actif). Endpoints `POST/DELETE api/v1/appareils/`. Petit service `envoyer_push(utilisateur, titre, texte, lien)` appelé aux mêmes endroits que les e-mails actuels : commande, contre-proposition, prolongation, réponse de l'équipe, nouvelle course pour le livreur. | 3 à 4 j |
| 3 | **Suppression de compte** (exigée par Apple et Google) | `DELETE api/v1/moi/`, avec mot de passe demandé. Anonymiser plutôt qu'effacer, pour garder l'historique comptable : nom et e-mail neutralisés, articles retirés, sessions et jetons coupés. Refuser tant qu'une commande ou une location est en cours. Ajouter aussi une page web publique « Supprimer mon compte », que Google Play demande. | 2 j |
| 4 | **CORS** | **Non concerné** pour l'application native : CORS ne s'applique qu'aux navigateurs. Ne rien ouvrir de plus. CSRF ne s'applique pas aux requêtes authentifiées par jeton. | 0 |
| 5 | **PostgreSQL** | Passer de SQLite à PostgreSQL (déjà noté dans `requirements.txt`). Script de migration des données, sauvegardes quotidiennes. | 1 à 2 j |
| 6 | **Hébergement HTTPS stable** | Domaine fixe, par exemple `api.yaayvide.sn` (**À clarifier** : `.sn` ou `.com`). Certificat HTTPS, gunicorn et nginx (OVHcloud prévu). `DEBUG=False`, secrets dans des variables d'environnement, `ALLOWED_HOSTS` propre, médias servis en HTTPS. Les tunnels ngrok ou trycloudflare ne conviennent pas : une app publiée a besoin d'une adresse qui ne change jamais. | 2 à 3 j |
| 7 | **Versionnage de l'API** | Exposer les mêmes vues sous `api/v1/` (alias) et garder `api/` pour le site. Toute évolution qui casse la compatibilité part en `v2`, car les anciennes versions de l'app restent installées des mois. Endpoint `GET api/v1/version-min/` qui renvoie la version minimale de l'app (pour afficher « Mettez à jour »). | 1 j |
| 8 | **Pagination et recherche** | `PageNumberPagination` sur `produits/`, `mes-commandes/` et `mes-produits/` en v1 seulement, plus un paramètre `q=` pour la recherche texte. | 1 j |
| 9 | **Liens profonds** | Fichiers `/.well-known/assetlinks.json` (Android) et `apple-app-site-association` (iOS) sur le domaine, pour que les liens des e-mails ouvrent l'app. | 0,5 j |
| 10 | **Images** | Miniatures (par exemple 400 px en WebP) générées à l'envoi, pour économiser les données mobiles. URL absolues dans les réponses. | 1 à 2 j |
| 11 | **Limitation de débit** | `throttling` DRF sur la connexion, l'inscription et le mot de passe oublié. | 0,5 j |

**Total backend estimé : 14 à 20 jours**, tests compris.

## Dépendances à ajouter (à valider avec toi le moment venu)

- `djangorestframework-simplejwt` : jetons JWT.
- `psycopg[binary]` et `gunicorn` : production.
- `requests` ou `exponent-server-sdk` : envoi des notifications push Expo.
- `python-dotenv` : secrets hors du code.

## À clarifier

1. Nom de domaine définitif (`.sn` ou `.com`). Les documents légaux du site sont incohérents sur ce point.
2. Hébergeur et offre retenus (OVHcloud ? VPS ?) et qui paie l'abonnement.
3. Durée de conservation des données après suppression de compte (politique de confidentialité).
4. Prestataire et contrat d'e-mail en production (aujourd'hui SMTP ou console).
