from django.db import migrations
from django.utils.text import slugify


GROUPES_PARTAGES = {
    "Vêtements": ["Quotidien", "Sport", "Uniformes scolaires", "Pyjamas", "Maillots de bain", "Tenues traditionnelles", "Tenues de cérémonie"],
    "Chaussures": ["Chaussures quotidien", "Chaussures de sport", "Chaussures scolaires", "Chaussures de cérémonie", "Chaussures de natation"],
    "Accessoires": ["Cartables", "Sacs", "Casquettes", "Chapeaux", "Gourdes", "Lunch box", "Ceintures"],
    "Chambre & Bureau": ["Lits", "Bureaux", "Chaises", "Bibliothèques", "Décoration chambre enfant", "Rangements"],
    "Livres & Études": ["Livres", "Fournitures d'étude", "Matériel éducatif"],
    "Loisirs créatifs": ["Dessin", "Peinture", "Kits créatifs", "Instruments de musique"],
    "Sports & Plein air": ["Vélos", "Trottinettes", "Ballons", "Équipements sportifs", "Tenues anti-UV", "Chaussures de plage", "Bouées", "Brassards", "Lunettes de natation", "Serviettes de plage", "Jeux d'eau", "Jeux de plage", "Équipements de plein air"],
    "Santé & Bien-être": ["Accessoires de soin", "Lunettes"],
    "Fêtes": ["Tenues de fête", "Décoration fête", "Ballons de fête", "Cadeaux", "Location de matériel de fête"],
}

NOUVELLES_CATEGORIES = [
    {"nom": "Enfant (3-9 ans)", "emoji": "🧒", "slug": "enfant", "ordre": 2},
    {"nom": "Junior (10-15 ans)", "emoji": "🧑", "slug": "junior", "ordre": 3},
]

TAGS_OCCASION_SOUS_NOM = {
    "Tenues traditionnelles": "fetes_religieuses",
    "Tenues de fête": "anniversaires",
    "Décoration fête": "anniversaires",
    "Ballons de fête": "anniversaires",
    "Cadeaux": "anniversaires",
    "Location de matériel de fête": "anniversaires",
    "Maillots de bain": "natation_plein_air",
    "Tenues anti-UV": "natation_plein_air",
    "Chaussures de plage": "natation_plein_air",
    "Bouées": "natation_plein_air",
    "Brassards": "natation_plein_air",
    "Lunettes de natation": "natation_plein_air",
    "Serviettes de plage": "natation_plein_air",
    "Jeux d'eau": "natation_plein_air",
    "Jeux de plage": "natation_plein_air",
    "Équipements de plein air": "natation_plein_air",
}

# Pour répartir les produits existants : âge en années extrait de `taille`
# (ex "7 ans" -> 7). En dessous de 10 -> Enfant, 10 et + -> Junior.
# Les tailles non numériques (pointures, tailles vêtements génériques,
# ou vide) tombent par défaut sur Enfant plutôt que de perdre la catégorie.
def annee_depuis_taille(taille):
    if not taille:
        return None
    chiffres = ''.join(c for c in taille.split()[0] if c.isdigit())
    return int(chiffres) if chiffres.isdigit() else None


def diviser_enfant_junior(apps, schema_editor):
    Categorie = apps.get_model('marketplace', 'Categorie')
    Produit = apps.get_model('marketplace', 'Produit')

    ancienne = Categorie.objects.filter(slug='enfant-junior').first()
    if not ancienne:
        return

    principales = {}
    for top in NOUVELLES_CATEGORIES:
        principale, _ = Categorie.objects.update_or_create(
            slug=top["slug"],
            defaults={"nom": top["nom"], "emoji": top["emoji"], "ordre": top["ordre"], "parent": None},
        )
        principales[top["slug"]] = principale

        ordre_sous = 0
        sous_par_nom = {}
        for groupe, sous_noms in GROUPES_PARTAGES.items():
            for nom_sous in sous_noms:
                tag = TAGS_OCCASION_SOUS_NOM.get(nom_sous, "")
                slug_sous = slugify(f"{top['slug']}-{nom_sous}")
                sous_cat, _ = Categorie.objects.update_or_create(
                    slug=slug_sous,
                    defaults={
                        "nom": nom_sous, "parent": principale, "groupe": groupe,
                        "ordre": ordre_sous, "tags_occasion": tag,
                    },
                )
                sous_par_nom[nom_sous] = sous_cat
                ordre_sous += 1
        principales[f"{top['slug']}_sous"] = sous_par_nom

    # Réassignation des produits existants vers la bonne tranche d'âge,
    # en gardant le même nom de sous-catégorie (ex: "Pyjamas" -> "Pyjamas")
    for produit in Produit.objects.filter(categorie__parent=ancienne):
        nom_sous = produit.categorie.nom
        annee = annee_depuis_taille(produit.taille)
        slug_cible = 'junior' if (annee is not None and annee >= 10) else 'enfant'
        nouvelle_sous = principales[f"{slug_cible}_sous"].get(nom_sous)
        if nouvelle_sous:
            produit.categorie = nouvelle_sous
            produit.save(update_fields=['categorie'])

    ancienne.delete()  # cascade sur ses anciennes sous-catégories


def revenir_arriere(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0025_user_immatriculation_user_marque_modele_vehicule_and_more'),
    ]

    operations = [
        migrations.RunPython(diviser_enfant_junior, revenir_arriere),
    ]