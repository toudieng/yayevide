"""
Tâche quotidienne de la location, à planifier une fois par jour (cron OVH,
par exemple tous les matins à 7 h) :

    python manage.py locations_quotidien

- rappel par e-mail la veille de la fin d'une location ;
- le jour de la fin, la location passe en « retour à récupérer » : elle
  apparaît dans l'espace des livreurs de la zone et la locataire est prévenue.
"""
from django.core.management.base import BaseCommand

from marketplace.location_api import traitement_quotidien


class Command(BaseCommand):
    help = "Rappels de fin de location et passage des locations terminées en « retour à récupérer »."

    def handle(self, *args, **options):
        nb_rappels, nb_retours = traitement_quotidien()
        self.stdout.write(self.style.SUCCESS(
            f"{nb_rappels} rappel(s) envoyé(s), {nb_retours} retour(s) à récupérer."
        ))
