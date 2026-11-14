# Mise en ligne de Yaay Vidé sur OVHcloud

Guide pas à pas pour installer le site sur un **VPS OVHcloud** (Ubuntu 24.04).
Un seul serveur porte tout : le site React, l'API Django, la base PostgreSQL
et les photos, sur un seul domaine en HTTPS.

**Déploiement automatique** : une fois le serveur installé, chaque `git push`
sur `main` met le site à jour tout seul, comme sur Vercel (GitHub Actions,
fichier `.github/workflows/deploiement.yml`). GitHub vérifie les tests,
construit le site React et l'envoie sur le serveur par SSH. Le serveur n'a
**aucun accès** au dépôt GitHub ni à son historique.

```
git push main ──▶ GitHub Actions : tests Django + construction React
                         │ (si DEPLOIEMENT_ACTIF = oui)
                         ▼ rsync par SSH
                  VPS OVH : dépendances, migrations, redémarrage, contrôle
```

```
Navigateur ──HTTPS──▶ nginx ─┬─ /            → site React (frontend/dist)
                             ├─ /api/        → gunicorn → Django
                             ├─ /media/      → photos (backend/media)
                             ├─ /static/     → fichiers de l'admin Django
                             └─ /gestion-technique/ → admin Django
                                         Django ──▶ PostgreSQL
```

Fichiers prêts à l'emploi dans `deploy/` :

| Fichier | Rôle | Va sur le serveur dans |
|---|---|---|
| `deploy/env.exemple` | Toutes les variables de production | `/etc/yaayvide/yaayvide.env` |
| `deploy/nginx/yaayvide.conf` | Configuration nginx | `/etc/nginx/sites-available/yaayvide` |
| `deploy/systemd/yaayvide.service` | Django (gunicorn) | `/etc/systemd/system/` |
| `deploy/systemd/yaayvide-locations.*` | Tâche quotidienne des locations (7 h) | `/etc/systemd/system/` |
| `deploy/systemd/yaayvide-sauvegarde.*` | Sauvegarde chaque nuit (3 h) | `/etc/systemd/system/` |
| `deploy/scripts/sauvegarde.sh` | Sauvegarde base + photos (14 jours) | lancé par le timer |
| `deploy/scripts/apres-envoi.sh` | Fin de déploiement (migrations, redémarrage, contrôle) | lancé par GitHub Actions |
| `.github/workflows/deploiement.yml` | Déploiement automatique à chaque push sur `main` | reste sur GitHub |
| `backend/requirements-prod.txt` | Dépendances du serveur (gunicorn, PostgreSQL) | — |

En local, **rien ne change** : sans variables d'environnement, Django reste en
mode développement (DEBUG, SQLite, localhost et ngrok autorisés).

Dans ce guide, remplace `yaayvide.com` par le vrai domaine.

---

## 0. Avant de commencer (au nom de la cliente)

- [ ] **Compte OVHcloud** au nom de Yaay Vidé ; tu y es ajoutée comme contact technique.
- [ ] **VPS** : Ubuntu 24.04, au moins 2 Go de RAM et 40 Go de disque, centre de données en France (Gravelines, Roubaix ou Paris : le plus proche de Dakar).
- [ ] **Nom de domaine** : `.com` (achetable chez OVH) ou `.sn` (chez un registraire sénégalais). Choisir **une seule** forme et corriger les documents légaux du site, qui mélangent `.sn` et `.com`.
- [ ] **DNS** : un enregistrement `A` pour `yaayvide.com` et `www.yaayvide.com` vers l'adresse IP du VPS (et `AAAA` pour l'IPv6 si le VPS en a une).
- [ ] **Adresse d'envoi des e-mails** (`no-reply@…`) : e-mail OVH, ou Brevo (gratuit pour un petit volume).
- [ ] **Dépôt GitHub** : une « clé de déploiement » en lecture seule pour que le serveur puisse faire `git pull` (étape 3).

## 1. Sécuriser le serveur

Connecté en SSH avec l'utilisateur fourni par OVH (`ubuntu`) :

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw unattended-upgrades
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo dpkg-reconfigure -plow unattended-upgrades
```

Se connecter **avec une clé SSH** et désactiver la connexion par mot de passe
(`PasswordAuthentication no` dans `/etc/ssh/sshd_config`, puis
`sudo systemctl restart ssh`). Vérifier dans un 2e terminal qu'on peut encore
se connecter **avant** de fermer le premier.

## 2. Installer les logiciels

```bash
sudo apt install -y nginx postgresql python3-venv python3-dev build-essential rsync curl certbot python3-certbot-nginx
```

Ni Git ni Node.js ne sont nécessaires sur le serveur : le site React est
construit par GitHub, et le code arrive par `rsync`.

## 3. Utilisateur et déploiement automatique

### 3.1 L'utilisateur du site, sur le serveur

```bash
sudo adduser --system --group --home /srv/yaayvide --shell /bin/bash yaayvide
sudo usermod -aG www-data yaayvide
sudo -u yaayvide mkdir -p /srv/yaayvide/backend /srv/yaayvide/frontend/dist /srv/yaayvide/deploy /srv/yaayvide/.ssh
sudo chmod 700 /srv/yaayvide/.ssh
```

Autoriser cet utilisateur à redémarrer Django, **et rien d'autre** :

```bash
echo 'yaayvide ALL=(root) NOPASSWD: /usr/bin/systemctl restart yaayvide' | sudo tee /etc/sudoers.d/yaayvide
sudo chmod 440 /etc/sudoers.d/yaayvide
sudo visudo -c
```

### 3.2 La clé de déploiement (sur TON ordinateur)

Une paire de clés réservée au déploiement, sans mot de passe :

```bash
ssh-keygen -t ed25519 -N "" -C "deploiement-yaayvide" -f ~/.ssh/yaayvide_deploiement
```

Copier la clé **publique** sur le serveur :

```bash
cat ~/.ssh/yaayvide_deploiement.pub
```

```bash
sudo -u yaayvide nano /srv/yaayvide/.ssh/authorized_keys
sudo chmod 600 /srv/yaayvide/.ssh/authorized_keys
```

(coller la ligne affichée, enregistrer). Vérifier depuis ton ordinateur :

```bash
ssh -i ~/.ssh/yaayvide_deploiement yaayvide@IP_DU_SERVEUR "echo connexion ok"
```

Récupérer l'empreinte du serveur (pour que GitHub soit sûr de parler au bon serveur) :

```bash
ssh-keyscan -H IP_DU_SERVEUR
```

### 3.3 Les secrets dans GitHub

Dépôt GitHub → **Settings → Secrets and variables → Actions** :

| Onglet | Nom | Valeur |
|---|---|---|
| Secrets | `OVH_HOST` | Adresse IP du VPS (ou le domaine) |
| Secrets | `OVH_USER` | `yaayvide` |
| Secrets | `OVH_SSH_KEY` | Tout le contenu de `~/.ssh/yaayvide_deploiement` (la clé **privée**, lignes BEGIN/END comprises) |
| Secrets | `OVH_KNOWN_HOSTS` | Le résultat de `ssh-keyscan -H IP_DU_SERVEUR` |
| Variables | `DEPLOIEMENT_ACTIF` | `oui` |

Tant que `DEPLOIEMENT_ACTIF` ne vaut pas `oui`, GitHub lance seulement les
tests et la construction, sans rien envoyer.

### 3.4 Premier envoi

GitHub → onglet **Actions** → « Déploiement OVH » → **Run workflow** (branche
`main`). Les fichiers arrivent dans `/srv/yaayvide`. Le journal se termine par
« `/etc/yaayvide/yaayvide.env` est absent » : c'est normal, on le crée à
l'étape 5.

## 4. Base PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER yaayvide WITH PASSWORD 'MOT_DE_PASSE_FORT';"
sudo -u postgres psql -c "CREATE DATABASE yaayvide OWNER yaayvide ENCODING 'UTF8';"
```

## 5. Variables de production

```bash
sudo mkdir -p /etc/yaayvide
sudo cp /srv/yaayvide/deploy/env.exemple /etc/yaayvide/yaayvide.env   # arrivé au premier envoi
sudo nano /etc/yaayvide/yaayvide.env
sudo chown root:yaayvide /etc/yaayvide/yaayvide.env
sudo chmod 640 /etc/yaayvide/yaayvide.env
```

Remplir **toutes** les valeurs `a-remplacer`. Pour la clé secrète :

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Sans `DJANGO_SECRET_KEY`, Django refuse volontairement de démarrer en production.

## 6. Django

Relancer le déploiement : GitHub → **Actions** → « Déploiement OVH » → **Run
workflow**. Cette fois, le serveur crée l'environnement Python, installe les
dépendances, crée les tables (`migrate`), rassemble les fichiers de l'admin
(`collectstatic`) et lance `check --deploy`. Le journal indique « Service
yaayvide pas encore installé » : il le sera à l'étape 9.

`check --deploy` peut afficher `W005`, `W008` et `W021` (HSTS sur les
sous-domaines, redirection HTTPS, préchargement HSTS) : ce ne sont que des
avertissements, nginx et Certbot s'occupent de la redirection HTTPS.

Créer le compte administrateur :

```bash
sudo -u yaayvide bash -c 'set -a; . /etc/yaayvide/yaayvide.env; set +a; cd /srv/yaayvide/backend && ../venv/bin/python manage.py createsuperuser'
```

### Reprendre les données existantes (si la base locale contient de vrais comptes)

Sur l'ordinateur, dans `backend/` :

```bash
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.permission -e sessions --indent 2 -o donnees.json
```

Envoyer `donnees.json` et le dossier `backend/media/` sur le serveur
(`scp` ou `rsync`), puis, **sur une base vide qui vient d'être migrée** :

```bash
sudo -u yaayvide bash -c 'set -a; . /etc/yaayvide/yaayvide.env; set +a; cd /srv/yaayvide/backend && ../venv/bin/python manage.py loaddata /chemin/donnees.json'
```

Dans ce cas, ne pas lancer `createsuperuser` : les comptes existants sont repris.

## 7. Dossier des photos (droits)

```bash
sudo -u yaayvide mkdir -p /srv/yaayvide/backend/media
sudo chown -R yaayvide:www-data /srv/yaayvide/backend/media
sudo chmod -R g+rX /srv/yaayvide/backend/media
sudo find /srv/yaayvide/backend/media -type d -exec chmod g+s {} +
sudo chmod 755 /srv/yaayvide
```

nginx (utilisateur `www-data`) doit pouvoir lire `frontend/dist`,
`backend/staticfiles` et `backend/media`.

Les documents des livreurs (pièce d'identité, permis) sont rangés à part,
dans `backend/media_prive`, que **seul Django** doit pouvoir lire. nginx n'y
a pas accès : ils ne s'ouvrent que par l'API, pour le livreur concerné et
l'équipe.

```bash
sudo -u yaayvide mkdir -p /srv/yaayvide/backend/media_prive
sudo chown -R yaayvide:yaayvide /srv/yaayvide/backend/media_prive
sudo chmod -R 700 /srv/yaayvide/backend/media_prive
```

Si tu reprends des données de l'ordinateur (étape 6), copie aussi
`backend/media_prive/` (et `backend/media/livreurs/` s'il existe encore :
la migration `0034` le déplace automatiquement dans `media_prive`).

## 8. Site React

Rien à faire : GitHub construit le site et l'envoie dans
`/srv/yaayvide/frontend/dist` à chaque déploiement. Le site appelle l'API sur
`/api` (même domaine) : aucune adresse à changer.

## 9. Démarrer Django (gunicorn)

```bash
sudo cp /srv/yaayvide/deploy/systemd/yaayvide.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now yaayvide
sudo systemctl status yaayvide
```

## 10. nginx et HTTPS

```bash
sudo cp /srv/yaayvide/deploy/nginx/yaayvide.conf /etc/nginx/sites-available/yaayvide
sudo nano /etc/nginx/sites-available/yaayvide
sudo ln -s /etc/nginx/sites-available/yaayvide /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yaayvide.com -d www.yaayvide.com --redirect
```

Dans le `nano`, remplacer le domaine. Si `DJANGO_ADMIN_PATH` a une autre
valeur que `gestion-technique/`, changer aussi le bloc `location`
correspondant. Certbot ajoute le HTTPS, la redirection depuis HTTP et le
renouvellement automatique du certificat.

## 11. Tâches automatiques

```bash
sudo cp /srv/yaayvide/deploy/systemd/yaayvide-locations.* /srv/yaayvide/deploy/systemd/yaayvide-sauvegarde.* /etc/systemd/system/
sudo mkdir -p /srv/sauvegardes && sudo chown yaayvide:yaayvide /srv/sauvegardes
sudo systemctl daemon-reload
sudo systemctl enable --now yaayvide-locations.timer yaayvide-sauvegarde.timer
systemctl list-timers | grep yaayvide
```

Tester tout de suite :

```bash
sudo systemctl start yaayvide-locations.service && journalctl -u yaayvide-locations -n 5
sudo systemctl start yaayvide-sauvegarde.service && ls -lh /srv/sauvegardes
```

## 12. Vérifications avant d'annoncer le site

- [ ] `https://yaayvide.com` s'ouvre avec le cadenas ; `http://` redirige vers `https://`.
- [ ] Recharger une page interne (`/boutique`, `/produit/1`, `/admin`) : pas d'erreur 404.
- [ ] Inscription, e-mail de vérification reçu, lien du mail qui ouvre bien le site.
- [ ] « Mot de passe oublié » : e-mail reçu, lien valide.
- [ ] Connexion, ajout d'un article avec photos depuis un téléphone.
- [ ] Commande de test, puis suivi côté vendeuse et livreur.
- [ ] « Une question ? » : message envoyé, réponse depuis `/admin/questions`.
- [ ] E-book : l'aperçu s'affiche, `https://yaayvide.com/media/ebook/complet/…` renvoie **403**.
- [ ] Livreur : sa pièce d'identité s'ouvre depuis son profil ; le même lien ouvert dans une fenêtre privée (non connectée) est **refusé**.
- [ ] Admin Django sur `/gestion-technique/` ; `/admin` affiche bien le tableau de bord React.
- [ ] Après quelques jours sans problème de HTTPS : `DJANGO_HSTS_SECONDS=31536000`, puis `sudo systemctl restart yaayvide`.

## 13. Mettre à jour le site

Il suffit de pousser sur `main` :

```bash
git push origin main
```

Suivre le déploiement dans l'onglet **Actions** du dépôt (2 à 4 minutes). Si
les tests échouent, rien n'est envoyé et le site en ligne ne change pas. En
cas d'échec sur le serveur, le journal de l'étape « Mise à jour sur le
serveur » indique la commande qui a échoué.

Pour suspendre les déploiements (par exemple pendant une maintenance du
serveur) : passer la variable `DEPLOIEMENT_ACTIF` à `non`.

Remarque : le dernier contrôle (« Le site répond ») n'aboutit qu'une fois le
HTTPS en place (étape 10). Avant cela, cette dernière étape peut échouer, sans
conséquence.

## 14. En cas de problème

| Symptôme | Où regarder |
|---|---|
| Déploiement GitHub en échec | Onglet Actions → l'étape en rouge ; « Permission denied (publickey) » = secrets `OVH_*` ou `authorized_keys` |
| Erreur 502 | `sudo systemctl status yaayvide` puis `journalctl -u yaayvide -n 50` |
| Erreur 500 sur l'API | `journalctl -u yaayvide -n 50` (les erreurs Django y sont écrites) |
| Photos absentes | droits du dossier `media` (étape 7), `sudo tail /var/log/nginx/error.log` |
| 403 à la connexion | `DJANGO_CSRF_TRUSTED_ORIGINS` doit contenir `https://` + le domaine exact |
| E-mails non reçus | variables `EMAIL_*`, dossier spam, `journalctl -u yaayvide` |

Restaurer une sauvegarde :

```bash
pg_restore -h localhost -U yaayvide -d yaayvide --clean /srv/sauvegardes/base-AAAA-MM-JJ.dump
tar -xzf /srv/sauvegardes/media-AAAA-MM-JJ.tar.gz -C /srv/yaayvide/backend
sudo chmod -R 700 /srv/yaayvide/backend/media_prive
```

---

## À corriger ou décider avant la mise en ligne

1. ~~**Documents des livreurs**~~ : **fait.** Ils sont rangés dans
   `backend/media_prive` (hors du dossier public) et ne s'ouvrent que par
   `/api/livreurs/<id>/documents/<piece_identite|permis_conduire>/`, pour le
   livreur concerné et l'équipe.
2. **Domaine** : choisir `.com` ou `.sn` et corriger les documents légaux (CGV,
   confidentialité, retours), qui mélangent les deux.
3. **Copie des sauvegardes hors du serveur** : `/srv/sauvegardes` est sur le
   même VPS. Copier régulièrement ces fichiers ailleurs (OVH Object Storage,
   ou un téléchargement hebdomadaire sur un ordinateur).
4. ~~**E-book**~~ : **fait.** Paiement manuel par Wave, Orange Money ou
   Mixx by Yas sur les numéros de `EBOOK_NUMERO_*`. L'équipe confirme chaque
   achat dans `/admin/ebook`, ce qui envoie le lien par e-mail : les e-mails
   doivent donc fonctionner (`EMAIL_*`) et au moins un compte admin doit avoir
   une adresse e-mail pour être prévenu des achats à vérifier.
5. ~~**Numéro WhatsApp de l'équipe**~~ : **fait** (71 018 91 91), réglé dans
   `frontend/src/config/contact.js`.
