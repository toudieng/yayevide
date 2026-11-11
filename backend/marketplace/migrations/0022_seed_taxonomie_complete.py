from django.db import migrations
from django.utils.text import slugify


TOP_CATEGORIES = [
    {
        "nom": "Maman & Maternité", "emoji": "👩", "slug": "maman-maternite", "ordre": 0,
        "groupes": {
            "Grossesse": ["Vêtements de grossesse", "Lingerie de grossesse", "Maillots de bain de grossesse"],
            "Allaitement": ["Vêtements d'allaitement", "Soutiens-gorge d'allaitement", "Tire-laits", "Accessoires de tire-lait", "Coussins d'allaitement", "Conservation du lait"],
            "Post-partum": ["Gaines", "Ceintures post-partum", "Sous-vêtements post-partum", "Accessoires de récupération"],
            "Bien-être": ["Coussins de grossesse", "Relaxation", "Yoga & sport", "Livres grossesse"],
            "Sacs & Organisation": ["Sacs à langer", "Sacs maternité", "Organisateurs"],
            "Tenues traditionnelles": ["Boubous", "Ensembles traditionnels", "Robes traditionnelles", "Chaussures traditionnelles", "Accessoires traditionnels"],
        },
    },
    {
        "nom": "Bébé (0-3 ans)", "emoji": "👶", "slug": "bebe", "ordre": 1,
        "groupes": {
            "Vêtements": ["Bodies", "Pyjamas", "Barboteuses", "Ensembles", "Pantalons", "Robes", "Vestes", "Gigoteuses", "Nids d'ange", "Tenues traditionnelles", "Tenues de cérémonie"],
            "Chaussures": ["Chaussons", "Premiers pas", "Sandales", "Baskets", "Bottines"],
            "Accessoires": ["Bonnets", "Chapeaux", "Bavoirs", "Attaches-tétines", "Lunettes"],
            "Repas": ["Tire-laits", "Conservation du lait", "Biberons", "Tétines", "Goupillons", "Égouttoirs", "Chauffe-biberons", "Stérilisateurs", "Robots bébé", "Cuiseurs vapeur", "Mixeurs", "Doseurs de lait", "Chaises hautes", "Rehausseurs", "Vaisselle bébé", "Gourdes", "Lunch box"],
            "Sommeil": ["Berceaux", "Lits bébé", "Lits parapluie", "Matelas", "Draps", "Couvertures", "Veilleuses", "Babyphones"],
            "Chambre": ["Armoires", "Commodes", "Tables à langer", "Décoration chambre", "Rangements"],
            "Bain & Hygiène": ["Baignoires", "Pots", "Réducteurs WC", "Serviettes", "Trousses de toilette"],
            "Santé & Sécurité": ["Thermomètres", "Mouche-bébés", "Humidificateurs", "Barrières", "Parcs"],
            "Transport & Promenade": ["Poussettes", "Sièges auto", "Porte-bébés", "Écharpes de portage", "Nacelles"],
            "Éveil & Jouets": ["Tapis d'éveil", "Hochets", "Doudous", "Peluches", "Jouets sensoriels", "Trotteurs", "Balancelles"],
            "Naissance": ["Cadeaux naissance", "Décoration naissance", "Matériel de réception", "Location de matériel"],
        },
    },
    {
        "nom": "Enfant & Junior (3-15 ans)", "emoji": "🧒", "slug": "enfant-junior", "ordre": 2,
        "groupes": {
            "Vêtements": ["Quotidien", "Sport", "Uniformes scolaires", "Pyjamas", "Maillots de bain", "Tenues traditionnelles", "Tenues de cérémonie"],
            "Chaussures": ["Chaussures quotidien", "Chaussures de sport", "Chaussures scolaires", "Chaussures de cérémonie", "Chaussures de natation"],
            "Accessoires": ["Cartables", "Sacs", "Casquettes", "Chapeaux", "Gourdes", "Lunch box", "Ceintures"],
            "Chambre & Bureau": ["Lits", "Bureaux", "Chaises", "Bibliothèques", "Décoration chambre enfant", "Rangements"],
            "Livres & Études": ["Livres", "Fournitures d'étude", "Matériel éducatif"],
            "Loisirs créatifs": ["Dessin", "Peinture", "Kits créatifs", "Instruments de musique"],
            "Sports & Plein air": ["Vélos", "Trottinettes", "Ballons", "Équipements sportifs", "Tenues anti-UV", "Chaussures de plage", "Bouées", "Brassards", "Lunettes de natation", "Serviettes de plage", "Jeux d'eau", "Jeux de plage", "Équipements de plein air"],
            "Santé & Bien-être": ["Accessoires de soin", "Lunettes"],
            "Fêtes": ["Tenues de fête", "Décoration fête", "Ballons de fête", "Cadeaux", "Location de matériel de fête"],
        },
    },
    {
        "nom": "Jeux & Jouets", "emoji": "🧸", "slug": "jeux-jouets", "ordre": 3,
        "groupes": {
            "Jouets": ["Premier âge", "Jeux éducatifs", "Construction", "Poupées", "Figurines", "Véhicules", "Jeux de société", "Puzzles", "Peluches", "Arts créatifs", "Musique", "Jeux d'extérieur"],
            "Déguisements & Spectacles": ["Déguisements", "Masques", "Perruques", "Accessoires de spectacle", "Costumes"],
        },
    },
    {
        "nom": "Équipements scolaires", "emoji": "🎒", "slug": "equipements-scolaires", "ordre": 4,
        "groupes": {
            "Fournitures": ["Cartables & Sacs", "Trousses", "Fournitures scolaires", "Papeterie", "Géométrie", "Arts plastiques"],
            "Tenue scolaire": ["Uniformes scolaires", "Chaussures scolaires"],
            "Repas & Mobilier": ["Lunch box & Gourdes", "Mobilier scolaire"],
            "Livres": ["Livres scolaires"],
        },
    },
]

TAGS_OCCASION = {
    ("bebe", "Tenues de cérémonie"): "naissance",
    ("bebe", "Cadeaux naissance"): "naissance",
    ("bebe", "Décoration naissance"): "naissance",
    ("bebe", "Matériel de réception"): "naissance",
    ("bebe", "Location de matériel"): "naissance",

    ("bebe", "Tenues traditionnelles"): "fetes_religieuses",
    ("enfant-junior", "Tenues traditionnelles"): "fetes_religieuses",
    ("maman-maternite", "Boubous"): "fetes_religieuses",
    ("maman-maternite", "Ensembles traditionnels"): "fetes_religieuses",
    ("maman-maternite", "Robes traditionnelles"): "fetes_religieuses",
    ("maman-maternite", "Chaussures traditionnelles"): "fetes_religieuses",
    ("maman-maternite", "Accessoires traditionnels"): "fetes_religieuses",

    ("enfant-junior", "Tenues de fête"): "anniversaires",
    ("enfant-junior", "Décoration fête"): "anniversaires",
    ("enfant-junior", "Ballons de fête"): "anniversaires",
    ("enfant-junior", "Cadeaux"): "anniversaires",
    ("enfant-junior", "Location de matériel de fête"): "anniversaires",

    ("jeux-jouets", "Déguisements"): "deguisements_spectacles",
    ("jeux-jouets", "Masques"): "deguisements_spectacles",
    ("jeux-jouets", "Perruques"): "deguisements_spectacles",
    ("jeux-jouets", "Accessoires de spectacle"): "deguisements_spectacles",
    ("jeux-jouets", "Costumes"): "deguisements_spectacles",

    ("enfant-junior", "Maillots de bain"): "natation_plein_air",
    ("enfant-junior", "Tenues anti-UV"): "natation_plein_air",
    ("enfant-junior", "Chaussures de plage"): "natation_plein_air",
    ("enfant-junior", "Bouées"): "natation_plein_air",
    ("enfant-junior", "Brassards"): "natation_plein_air",
    ("enfant-junior", "Lunettes de natation"): "natation_plein_air",
    ("enfant-junior", "Serviettes de plage"): "natation_plein_air",
    ("enfant-junior", "Jeux d'eau"): "natation_plein_air",
    ("enfant-junior", "Jeux de plage"): "natation_plein_air",
    ("enfant-junior", "Équipements de plein air"): "natation_plein_air",
}


def creer_taxonomie(apps, schema_editor):
    Categorie = apps.get_model('marketplace', 'Categorie')
    Produit = apps.get_model('marketplace', 'Produit')

    ancien_enfant = Categorie.objects.filter(slug='enfant').first()
    ancien_ados = Categorie.objects.filter(slug='ados-juniors').first()

    ordre_top = 0
    for top in TOP_CATEGORIES:
        principale, _ = Categorie.objects.update_or_create(
            slug=top["slug"],
            defaults={"nom": top["nom"], "emoji": top["emoji"], "ordre": ordre_top, "parent": None},
        )
        ordre_top += 1

        ordre_sous = 0
        for groupe, sous_noms in top["groupes"].items():
            for nom_sous in sous_noms:
                tag = TAGS_OCCASION.get((top["slug"], nom_sous), "")
                slug_sous = slugify(f"{top['slug']}-{nom_sous}")
                Categorie.objects.update_or_create(
                    slug=slug_sous,
                    defaults={
                        "nom": nom_sous, "parent": principale, "groupe": groupe,
                        "ordre": ordre_sous, "tags_occasion": tag,
                    },
                )
                ordre_sous += 1

        if top["slug"] == "enfant-junior":
            if ancien_enfant:
                Produit.objects.filter(categorie=ancien_enfant).update(categorie=principale)
            if ancien_ados:
                Produit.objects.filter(categorie=ancien_ados).update(categorie=principale)

    if ancien_enfant:
        ancien_enfant.delete()
    if ancien_ados:
        ancien_ados.delete()

    # "Occasions spéciales" et "Bonnes affaires" ne sont plus des catégories
    # choisies manuellement — les produits qui y pointaient encore repassent
    # à categorie=NULL automatiquement (FK en SET_NULL) puisqu'ils n'ont pas
    # de sous-catégorie de repli évidente ; à réassigner manuellement si besoin.
    Categorie.objects.filter(slug__in=['occasions-speciales', 'bonnes-affaires'], parent__isnull=True).delete()


def revenir_arriere(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0021_categorie_emoji_categorie_groupe_categorie_parent_and_more'),
    ]

    operations = [
        migrations.RunPython(creer_taxonomie, revenir_arriere),
    ]
