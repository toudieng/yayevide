# backend/marketplace/stockage.py
# Stockage des fichiers PRIVÉS (pièce d'identité et permis des livreurs) :
# ils sont rangés hors du dossier media public (PRIVATE_MEDIA_ROOT), donc
# jamais servis directement par nginx ni par Django. On les lit uniquement
# via DocumentLivreurView, qui vérifie qui les demande.
import os

from django.conf import settings
from django.core.files.storage import FileSystemStorage


class StockagePrive(FileSystemStorage):
    # Emplacement relu à chaque fois dans les réglages (et non figé au
    # démarrage), pour suivre DJANGO_PRIVATE_MEDIA_ROOT et les tests.
    @property
    def base_location(self):
        return settings.PRIVATE_MEDIA_ROOT

    @property
    def location(self):
        return os.path.abspath(self.base_location)


def stockage_prive():
    return StockagePrive()
