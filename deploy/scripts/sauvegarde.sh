#!/usr/bin/env bash
# Sauvegarde de la base PostgreSQL et des photos (dossier media).
# Garde 14 jours. Lancé chaque nuit par yaayvide-sauvegarde.timer.
# Pense à copier régulièrement /srv/sauvegardes ailleurs (OVH Object
# Storage, ou téléchargement sur un ordinateur) : une sauvegarde sur le
# même serveur ne protège pas d'une panne du serveur.
set -euo pipefail

DOSSIER=/srv/sauvegardes
DATE=$(date +%Y-%m-%d)
mkdir -p "$DOSSIER"

PGPASSWORD="$DB_PASSWORD" pg_dump -h "${DB_HOST:-localhost}" -U "$DB_USER" -Fc "$DB_NAME" \
  > "$DOSSIER/base-$DATE.dump"
# media = photos publiques ; media_prive = documents des livreurs
tar -czf "$DOSSIER/media-$DATE.tar.gz" -C /srv/yaayvide/backend media media_prive

find "$DOSSIER" -type f -mtime +14 -delete
echo "Sauvegarde du $DATE terminée."
