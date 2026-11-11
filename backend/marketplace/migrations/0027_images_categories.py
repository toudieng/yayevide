"""
Photos définitives des catégories principales (remplacent les visuels
temporaires). Elles sont copiées depuis marketplace/donnees/categories vers
les médias, puis attachées à la catégorie, exactement comme un import depuis
le tableau de bord admin : l'équipe peut ensuite les changer depuis l'admin.

Migration de données uniquement (aucun changement de schéma). Les catégories
absentes de la base sont ignorées ; la migration inverse ne fait rien (on ne
retire pas une image que l'équipe aurait pu remplacer entre-temps).
"""
from pathlib import Path

from django.core.files import File
from django.db import migrations

DOSSIER = Path(__file__).resolve().parent.parent / "donnees" / "categories"

# slug de la catégorie principale -> fichier fourni
IMAGES = {
    "enfant": "enfant.webp",
    "junior": "junior.webp",
    "jeux-jouets": "jeux-jouets.webp",
    "equipements-scolaires": "equipements-scolaires.webp",
}


def attacher_images(apps, schema_editor):
    Categorie = apps.get_model("marketplace", "Categorie")
    for slug, nom_fichier in IMAGES.items():
        chemin = DOSSIER / nom_fichier
        categorie = Categorie.objects.filter(slug=slug, parent__isnull=True).first()
        if categorie is None or not chemin.exists():
            continue
        with chemin.open("rb") as f:
            # save() de l'ImageField copie le fichier dans MEDIA_ROOT/categories/
            categorie.image.save(nom_fichier, File(f), save=True)


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0026_split_enfant_junior"),
    ]

    operations = [
        migrations.RunPython(attacher_images, migrations.RunPython.noop),
    ]
