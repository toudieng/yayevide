#!/usr/bin/env bash
# Mise à jour du site après un « git push » sur main.
# À lancer sur le serveur avec l'utilisateur yaayvide :
#   sudo -u yaayvide /srv/yaayvide/deploy/scripts/mettre-a-jour.sh
# puis : sudo systemctl restart yaayvide
set -euo pipefail
cd /srv/yaayvide

echo "1/5 Récupération du code"
git pull --ff-only origin main

echo "2/5 Dépendances Python"
./venv/bin/pip install -q -r backend/requirements-prod.txt

echo "3/5 Base de données et fichiers de l'admin"
set -a; . /etc/yaayvide/yaayvide.env; set +a
cd backend
../venv/bin/python manage.py migrate --noinput
../venv/bin/python manage.py collectstatic --noinput
../venv/bin/python manage.py check --deploy
cd ..

echo "4/5 Site React"
cd frontend
npm ci --no-audit --no-fund
npm run build
cd ..

echo "5/5 Terminé. Redémarrer Django : sudo systemctl restart yaayvide"
