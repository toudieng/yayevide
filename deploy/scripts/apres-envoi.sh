#!/usr/bin/env bash
# Lancé sur le serveur par GitHub Actions après l'envoi des fichiers
# (utilisateur yaayvide). Installe les dépendances, applique les migrations,
# rassemble les fichiers de l'admin, redémarre Django et vérifie le site.
set -euo pipefail
cd /srv/yaayvide

ENV=/etc/yaayvide/yaayvide.env
if [ ! -r "$ENV" ]; then
  echo "Fichiers envoyés. $ENV est absent : terminer l'installation (DEPLOIEMENT.md, étape 5), puis relancer le déploiement."
  exit 0
fi

echo "1/4 Dépendances Python"
[ -x venv/bin/python ] || python3 -m venv venv
venv/bin/pip install -q -r backend/requirements-prod.txt

echo "2/4 Base de données et fichiers de l'admin"
set -a; . "$ENV"; set +a
cd backend
../venv/bin/python manage.py migrate --noinput
../venv/bin/python manage.py collectstatic --noinput -v 0
../venv/bin/python manage.py check --deploy --fail-level ERROR
cd ..

echo "3/4 Redémarrage de Django"
if systemctl cat yaayvide >/dev/null 2>&1; then
  sudo -n /usr/bin/systemctl restart yaayvide
  sleep 3
  systemctl is-active --quiet yaayvide || { echo "Django ne redémarre pas : journalctl -u yaayvide -n 50"; exit 1; }
else
  echo "Service yaayvide pas encore installé (DEPLOIEMENT.md, étape 9) : redémarrage ignoré."
  exit 0
fi

echo "4/4 Contrôle du site"
if [ -n "${FRONTEND_URL:-}" ]; then
  curl -fsS --retry 5 --retry-delay 2 --retry-all-errors -o /dev/null "$FRONTEND_URL/api/categories/" \
    && echo "Le site répond : $FRONTEND_URL" \
    || { echo "L'API ne répond pas sur $FRONTEND_URL"; exit 1; }
fi
echo "Déploiement terminé."
