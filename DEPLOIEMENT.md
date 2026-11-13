# Mise en ligne de Yaay Vidé sur OVHcloud

Guide pas à pas pour installer le site sur un **VPS OVHcloud** (Ubuntu 24.04).
Un seul serveur porte tout : le site React, l'API Django, la base PostgreSQL
et les photos, sur un seul domaine en HTTPS.

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
| `deploy/scripts/mettre-a-jour.sh` | Mise à jour après un `git push` | lancé à la main |
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
sudo apt install -y git nginx postgresql python3-venv python3-dev build-essential certbot python3-certbot-nginx
```

Node.js 22 (Vite 8 ne fonctionne pas avec le Node 18 d'Ubuntu) :

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

## 3. Utilisateur et code

```bash
sudo adduser --system --group --home /srv/yaayvide --shell /bin/bash yaayvide
sudo usermod -aG www-data yaayvide
sudo -u yaayvide ssh-keygen -t ed25519 -N "" -f /srv/yaayvide/.ssh/id_ed25519
sudo cat /srv/yaayvide/.ssh/id_ed25519.pub
```

Ajouter cette clé publique dans GitHub : dépôt → **Settings → Deploy keys →
Add deploy key** (sans cocher « Allow write access »). Puis :

```bash
sudo -u yaayvide git clone git@github.com:toudieng/yayevide.git /srv/yaayvide/app-tmp
sudo -u yaayvide bash -c 'shopt -s dotglob; mv /srv/yaayvide/app-tmp/* /srv/yaayvide/ && rmdir /srv/yaayvide/app-tmp'
```

## 4. Base PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER yaayvide WITH PASSWORD 'MOT_DE_PASSE_FORT';"
sudo -u postgres psql -c "CREATE DATABASE yaayvide OWNER yaayvide ENCODING 'UTF8';"
```

## 5. Variables de production

```bash
sudo mkdir -p /etc/yaayvide
sudo cp /srv/yaayvide/deploy/env.exemple /etc/yaayvide/yaayvide.env
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

```bash
sudo -u yaayvide python3 -m venv /srv/yaayvide/venv
sudo -u yaayvide /srv/yaayvide/venv/bin/pip install -r /srv/yaayvide/backend/requirements-prod.txt
sudo -u yaayvide bash -c 'set -a; . /etc/yaayvide/yaayvide.env; set +a; cd /srv/yaayvide/backend && \
  ../venv/bin/python manage.py migrate && \
  ../venv/bin/python manage.py collectstatic --noinput && \
  ../venv/bin/python manage.py check --deploy'
```

`check --deploy` peut encore signaler `W005`, `W008` et `W021` (HSTS sur les
sous-domaines, redirection HTTPS, préchargement HSTS) : c'est normal, nginx et
Certbot s'occupent de la redirection HTTPS.

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

```bash
sudo -u yaayvide bash -c 'cd /srv/yaayvide/frontend && npm ci --no-audit --no-fund && npm run build'
```

Le site appelle déjà l'API sur `/api` (même domaine) : aucune adresse à changer.

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

Après un `git push` sur `main` :

```bash
sudo -u yaayvide /srv/yaayvide/deploy/scripts/mettre-a-jour.sh
sudo systemctl restart yaayvide
```

Le script récupère le code, installe les dépendances, applique les migrations,
rassemble les fichiers de l'admin et reconstruit le site React.

## 14. En cas de problème

| Symptôme | Où regarder |
|---|---|
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
4. **Paiement InTouch / e-book** : les variables `INTOUCH_*` restent vides
   tant que le contrat n'est pas signé. En production, la confirmation
   « simulée » du paiement de l'e-book est volontairement bloquée
   (`DEBUG=False`) : **l'e-book ne pourra donc pas être vendu en ligne avant
   l'intégration d'InTouch**. Masquer le bouton d'achat ou prévoir une vente
   manuelle d'ici là.
5. **Numéro WhatsApp de l'équipe** : `WHATSAPP_SUPPORT_NUMBER` contient encore
   un numéro d'exemple.
