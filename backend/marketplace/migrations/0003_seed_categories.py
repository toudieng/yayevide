from django.db import migrations


CATEGORIES = [
    ("Maman & Maternité", "maman-maternite", 0),
    ("Bébé", "bebe", 1),
    ("Enfant", "enfant", 2),
    ("Ados & Juniors", "ados-juniors", 3),
    ("Jeux & Jouets", "jeux-jouets", 4),
    ("Occasions spéciales", "occasions-speciales", 5),
    ("Équipements scolaires", "equipements-scolaires", 6),
    ("Bonnes affaires", "bonnes-affaires", 7),
]


def creer_categories(apps, schema_editor):
    Categorie = apps.get_model('marketplace', 'Categorie')
    for nom, slug, ordre in CATEGORIES:
        Categorie.objects.get_or_create(slug=slug, defaults={"nom": nom, "ordre": ordre})


def supprimer_categories(apps, schema_editor):
    Categorie = apps.get_model('marketplace', 'Categorie')
    Categorie.objects.filter(slug__in=[c[1] for c in CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0002_categorie_produit_caution_and_more'),
    ]

    operations = [
        migrations.RunPython(creer_categories, supprimer_categories),
    ]
