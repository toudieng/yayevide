from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from decimal import Decimal
import uuid

# ==========================================
# ZONES DE LIVRAISON — paiement à la livraison, frais estimés à la commande
# et encaissés par le livreur (plus de paiement en ligne via InTouch).
# ==========================================
ZONES_LIVRAISON = [
    {
        "code": "zone1",
        "nom": "Zone 1 - Dakar Centre",
        "localites": "Plateau, Médina, Fann, Point E, Mermoz, Sacré-Cœur, Liberté, Dieuppeul, HLM, Grand Dakar, Colobane, Gueule Tapée, Hann Bel-Air",
    },
    {
        "code": "zone2",
        "nom": "Zone 2 - Nord Dakar",
        "localites": "Yoff, Ngor, Almadies, Ouakam, Mamelles, Cité Mixta, Patte d'Oie, Grand Yoff, Ouest Foire, Nord Foire, Sicap Foire",
    },
    {
        "code": "zone3",
        "nom": "Zone 3 - Parcelles & Cambérène",
        "localites": "Parcelles Assainies, Cambérène",
    },
    {
        "code": "zone4",
        "nom": "Zone 4 - Guédiawaye",
        "localites": "Golf Sud, Sam Notaire, Wakhinane Nimzatt, Médina Gounass",
    },
    {
        "code": "zone5",
        "nom": "Zone 5 - Pikine",
        "localites": "Pikine Est, Pikine Ouest, Pikine Nord, Pikine Sud, Guinaw Rails Nord, Guinaw Rails Sud, Djiddah Thiaroye Kao, Dalifort, Thiaroye Gare, Thiaroye-sur-Mer, Mbao",
    },
    {
        "code": "zone6",
        "nom": "Zone 6 - Keur Massar",
        "localites": "Keur Massar Nord, Keur Massar Sud, Malika, Yeumbeul Nord, Yeumbeul Sud",
    },
    {
        "code": "zone7",
        "nom": "Zone 7 - Rufisque",
        "localites": "Rufisque Centre, Rufisque Est, Rufisque Ouest, Bargny, Diamniadio, Sangalkam, Sébikotane, Sendou, Jaxaay, Tivaouane Peulh-Niaga, Yène, Bambilor",
    },
    {
        "code": "zone8",
        "nom": "Zone 8 - Hors Dakar",
        "localites": "Thiès, Mbour, Saly, Saint-Louis, Kaolack, etc.",
    },
]
ZONES_LIVRAISON_CHOICES = [(z["code"], z["nom"]) for z in ZONES_LIVRAISON]

# Tarifs de livraison par taille de colis (cf. FAQ) — un supplément
# s'applique en zone 8 (hors Dakar), estimation à confirmer avec le service
# logistique réel avant mise en production.
FRAIS_LIVRAISON_PAR_TAILLE = {
    "s_m": 1500,   # jusqu'à 2kg
    "l_xl": 2000,  # 2 à 3kg
    "xxl": 3000,   # au-delà — estimation, un devis réel peut différer
}
SUPPLEMENT_HORS_DAKAR = 1500


def calculer_frais_livraison(taille_colis, zone_code):
    base = FRAIS_LIVRAISON_PAR_TAILLE.get(taille_colis, FRAIS_LIVRAISON_PAR_TAILLE["s_m"])
    if zone_code == "zone8":
        base += SUPPLEMENT_HORS_DAKAR
    return base


# ==========================================
# 1. UTILISATEURS & RÔLES
# ==========================================
class User(AbstractUser):
    # Django bloque les espaces dans username par défaut — mais ce champ
    # sert ici à la fois d'identifiant de connexion ET de "nom complet"
    # ("Aminata Diop" en placeholder à l'inscription), donc on doit
    # explicitement autoriser les espaces et accents.
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[RegexValidator(
            regex=r'^[\w\séèêëàâäùûüôöîïçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ.+\-]+$',
            message="Le nom d'utilisateur ne peut contenir que des lettres, chiffres, espaces et .+-_",
        )],
        error_messages={'unique': "Ce nom d'utilisateur est déjà pris."},
    )
    ROLE_CHOICES = (
        ('acheteur', 'Acheteur/Client'),
        ('vendeur', 'Vendeur/Boutique'),
        ('livreur', 'Livreur'),
        ('admin', 'Administrateur'),
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='acheteur')
    phone_number = models.CharField(max_length=20, unique=True, verbose_name="Numéro WhatsApp")

    # Adresse de livraison enregistrée — pré-remplit le checkout des
    # prochaines commandes (cf. "si le client a déjà un compte, l'adresse
    # est complétée automatiquement"). Séparée du profil vendeur/boutique,
    # ça concerne toute acheteuse.
    adresse_sauvegardee = models.CharField(max_length=255, blank=True)
    complement_adresse_sauvegarde = models.CharField(max_length=255, blank=True)
    zone_sauvegardee = models.CharField(max_length=10, choices=ZONES_LIVRAISON_CHOICES, blank=True)

    # Zone que ce livreur couvre — sert à lui proposer/assigner en priorité
    # les commandes de sa zone plutôt que de traverser tout Dakar.
    zone_livreur = models.CharField(max_length=10, choices=ZONES_LIVRAISON_CHOICES, blank=True, verbose_name="Zone de livraison couverte")
    
    # Sécurité et validation WhatsApp gratuite
    is_whatsapp_verified = models.BooleanField(default=False)
    whatsapp_verification_token = models.CharField(max_length=8, blank=True, null=True)

    # Comment prévenir la vendeuse d'une nouvelle commande — choisi à
    # l'inscription. WhatsApp nécessite une intégration API payante non
    # encore branchée (cf. services/notifications.py) ; l'email fonctionne
    # dès maintenant avec la config SMTP du site.
    NOTIFICATION_CHOICES = (
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
    )
    notification_preference = models.CharField(max_length=10, choices=NOTIFICATION_CHOICES, default='email')

    # --- Véhicule et documents (livreur uniquement) ---
    TYPE_VEHICULE_CHOICES = (
        ('scooter', 'Scooter'),
        ('moto', 'Moto'),
        ('voiture', 'Voiture'),
        ('velo', 'Vélo'),
        ('a_pied', 'À pied'),
    )
    type_vehicule = models.CharField(max_length=15, choices=TYPE_VEHICULE_CHOICES, blank=True)
    marque_modele_vehicule = models.CharField(max_length=100, blank=True, verbose_name="Marque / modèle")
    immatriculation = models.CharField(max_length=20, blank=True)

    piece_identite = models.FileField(upload_to='livreurs/documents/', null=True, blank=True)
    piece_identite_verifiee = models.BooleanField(default=False)
    permis_conduire = models.FileField(upload_to='livreurs/documents/', null=True, blank=True)
    permis_conduire_verifie = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Si c'est un nouveau vendeur, on génère un code de validation unique (ex: YV-A1B2)
        if not self.whatsapp_verification_token and self.role == 'vendeur':
            self.whatsapp_verification_token = str(uuid.uuid4())[:6].upper()
        super().save(*args, **kwargs)


# ==========================================
# 2. PROFIL BOUTIQUE (VENDEUR)
# ==========================================
class Boutique(models.Model):
    vendeur = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'role': 'vendeur'}, related_name='boutique')
    nom_boutique = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=110, unique=True, blank=True)
    description = models.TextField(blank=True, help_text="Présentation épurée de la boutique")
    zone = models.CharField(
        max_length=10, choices=ZONES_LIVRAISON_CHOICES, blank=True,
        verbose_name="Zone générale (pas l'adresse exacte, juste pour informer sur la livraison)",
    )
    banniere = models.ImageField(upload_to='boutiques/bannieres/', null=True, blank=True)
    visible = models.BooleanField(default=True, verbose_name="Boutique visible publiquement")
    locations_activees = models.BooleanField(default=True, verbose_name="Accepte les demandes de location")
    date_creation = models.DateTimeField(auto_now_add=True)

    # Offre de lancement : réservée aux 100 premières boutiques créées sur la
    # plateforme, TOUTES CONFONDUES (pas 100 par catégorie). Calculé une
    # seule fois à la création, jamais recalculé ensuite — même si des
    # boutiques plus anciennes sont supprimées, ce statut reste acquis pour
    # celles qui l'avaient déjà obtenu.
    beneficiaire_lancement = models.BooleanField(
        default=False,
        verbose_name="Fait partie des 100 premières boutiques (tarif de lancement)",
    )

    def __str__(self):
        return self.nom_boutique

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.nom_boutique)
            slug = base_slug
            i = 1
            while Boutique.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f"{base_slug}-{i}"
            self.slug = slug
        if self.pk is None:
            # Nouvelle boutique : bénéficie du tarif de lancement si elle
            # fait partie des 100 premières jamais créées.
            self.beneficiaire_lancement = Boutique.objects.count() < 100
        super().save(*args, **kwargs)

    @property
    def note_moyenne(self):
        # Calcule la note globale de la vendeuse pour inspirer confiance
        avis = self.avis_recus.all()
        if avis.exists():
            return round(sum([a.note for a in avis]) / avis.count(), 1)
        return 0.0


# ==========================================
# 3. CATÉGORIES
# ==========================================
class Categorie(models.Model):
    """
    Arbre à 2 niveaux : les catégories principales (parent=None, ce que la
    vendeuse choisit en premier) et leurs sous-catégories (parent=la
    catégorie principale, ce qu'elle choisit ensuite — c'est cette
    sous-catégorie précise qui est enregistrée sur Produit.categorie).

    "Occasions spéciales" et "Bonnes affaires" ne sont PAS choisies
    manuellement : ce sont des vitrines automatiques calculées à partir des
    autres produits (cf. Categorie.tags_occasion et Produit.bonne_affaire).
    """
    nom = models.CharField(max_length=80)
    slug = models.SlugField(max_length=90, unique=True, blank=True)
    emoji = models.CharField(max_length=8, blank=True, help_text="Uniquement pour les catégories principales.")
    image = models.ImageField(upload_to='categories/', null=True, blank=True,
                               help_text="Visuel affiché sur la carte catégorie (accueil/boutique).")
    ordre = models.PositiveSmallIntegerField(default=0, help_text="Ordre d'affichage (0 = premier).")

    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='sous_categories')
    # Regroupement purement visuel des sous-catégories dans le menu déroulant
    # (ex: "Grossesse", "Allaitement") — n'est pas un niveau sélectionnable.
    groupe = models.CharField(max_length=80, blank=True)
    # Occasion(s) spéciale(s) où cette sous-catégorie doit apparaître
    # automatiquement (ex: "naissance", "fetes_religieuses") — vide si non
    # concernée. Plusieurs valeurs séparées par une virgule si besoin.
    tags_occasion = models.CharField(max_length=120, blank=True)

    class Meta:
        verbose_name_plural = "Catégories"
        ordering = ['ordre', 'nom']

    def __str__(self):
        return f"{self.parent.nom} > {self.nom}" if self.parent_id else self.nom

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(f"{self.parent.slug}-{self.nom}" if self.parent_id else self.nom)
            slug = base
            i = 1
            while Categorie.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f"{base}-{i}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def categorie_racine(self):
        """Remonte à la catégorie principale (utile quand self est une
        sous-catégorie, pour le regroupement par grande famille)."""
        return self.parent if self.parent_id else self


# ==========================================
# 4. PRODUITS (VENTE & LOCATION)
# ==========================================
class Produit(models.Model):
    TYPE_OFFRE_CHOICES = (
        ('vente', 'À Vendre'),
        ('location', 'À Louer'),
    )
    ETAT_CHOICES = (
        ('neuf', 'Neuf avec étiquette'),
        ('excellent', 'Excellent état'),
        ('bon', 'Bon état'),
    )
    boutique = models.ForeignKey(Boutique, on_delete=models.CASCADE, related_name='produits')
    categorie = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True, blank=True, related_name='produits')
    titre = models.CharField(max_length=200)
    description = models.TextField()
    type_offre = models.CharField(max_length=10, choices=TYPE_OFFRE_CHOICES)
    etat = models.CharField(max_length=10, choices=ETAT_CHOICES, default='bon')

    # Prix de base défini par la vendeuse
    prix_vendeur = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="Prix vendeuse (FCFA)")

    # Spécifique à la location : caution rendue à la fin (cf. PDF feedback, page produit location)
    caution = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True,
                                   verbose_name="Caution (FCFA)")

    disponible = models.BooleanField(default=True)
    quantite_disponible = models.PositiveIntegerField(
        default=1,
        verbose_name="Quantité disponible",
        help_text="La plupart des articles de seconde main sont uniques (1). Augmentez si vous avez plusieurs exemplaires identiques.",
    )
    image_principale = models.ImageField(upload_to='produits/', null=True, blank=True)
    date_ajout = models.DateTimeField(auto_now_add=True)

    TAILLE_COLIS_CHOICES = (
        ('s_m', 'S / M — jusqu\'à 2kg (1 500 FCFA)'),
        ('l_xl', 'L / XL — 2 à 3kg (2 000 FCFA)'),
        ('xxl', 'XXL — plus de 3kg (devis, ~3 000 FCFA)'),
    )
    taille_colis = models.CharField(
        max_length=10, choices=TAILLE_COLIS_CHOICES, default='s_m',
        verbose_name="Taille du colis (pour le calcul des frais de livraison)",
    )
    nb_vues = models.PositiveIntegerField(default=0)
    # Case à cocher indépendante de la catégorie — un article de n'importe
    # quelle catégorie peut apparaître dans la vitrine automatique "Bonnes
    # affaires" si la vendeuse le signale ainsi.
    bonne_affaire = models.BooleanField(default=False, verbose_name="Afficher dans Bonnes affaires")
    taille = models.CharField(
        max_length=30, blank=True,
        verbose_name="Taille / pointure / tranche d'âge",
        help_text="Ex: M, 38, 6-9 mois, Non précisé...",
    )

    # Tarif de lancement (5% au lieu de 10%) : réservé au TOUT PREMIER
    # article publié par une boutique qui fait elle-même partie des 100
    # premières boutiques créées. Calculé une seule fois à la création de
    # l'article, jamais recalculé — supprimer puis republier un article ne
    # permet donc pas de "réutiliser" l'offre plusieurs fois.
    est_article_lancement = models.BooleanField(
        default=False,
        verbose_name="Premier article d'une boutique de lancement (commission 5%)",
    )

    def __str__(self):
        return f"{self.titre} ({self.get_type_offre_display()})"

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.est_article_lancement = (
                self.boutique.beneficiaire_lancement
                and not Produit.objects.filter(boutique=self.boutique).exists()
            )
        super().save(*args, **kwargs)

    @property
    def taux_commission(self):
        """5% uniquement pour le premier article d'une boutique de lancement,
        10% dans tous les autres cas — cf. réponse cliente du 12/07/2026 :
        l'offre à 5% ne couvre QUE les 100 premières boutiques ET QUE leur
        tout premier article, pas les suivants ni les autres vendeuses."""
        from django.conf import settings
        if self.est_article_lancement:
            return settings.COMMISSION_LANCEMENT_PERCENT / 100
        return settings.COMMISSION_STANDARD_PERCENT / 100

    @property
    def prix_final_public(self):
        """Calcule le prix TTC affiché aux acheteuses, commission Yaay Vidé incluse."""
        prix_vendeur_float = float(self.prix_vendeur)
        return round(prix_vendeur_float * (1 + self.taux_commission))


class ImageProduit(models.Model):
    """
    Galerie de photos d'un produit (jusqu'à 5, cf. AjouterProduit.jsx côté front).
    image_principale sur Produit reste la couverture ; les photos supplémentaires
    vivent ici pour ne pas casser l'existant.
    """
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='produits/galerie/')
    ordre = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['ordre', 'id']

    def __str__(self):
        return f"Photo #{self.ordre} — {self.produit.titre}"


# ==========================================
# 4. COMMANDES & RESERVATIONS
# ==========================================
class Commande(models.Model):
    # Plus de paiement en ligne : la vendeuse a 24h pour confirmer que
    # l'article est toujours disponible AVANT toute livraison — ça évite
    # le scénario "payé en ligne puis plus disponible" qu'on avait avec
    # InTouch. Le paiement se fait ensuite en espèces ou mobile money
    # directement au livreur, à la remise.
    STATUT_CHOICES = (
        ('en_attente_confirmation', 'En attente de confirmation vendeuse'),
        # Location : la vendeuse propose d'autres dates, la locataire accepte ou refuse
        ('contre_proposition', 'Nouvelles dates proposées par la vendeuse'),
        ('confirme', 'Confirmé par la vendeuse'),
        ('indisponible', 'Indisponible (annulé par la vendeuse)'),
        ('en_cours_livraison', 'En cours de livraison'),
        ('livre', 'Livré'),
        # Location : retour organisé par Yaay Vidé (livreur -> dépôt -> contrôle)
        ('retour_a_collecter', 'Location : retour à récupérer'),
        ('retour_en_cours', 'Location : article récupéré, en route vers Yaay Vidé'),
        ('retour_controle', 'Location : contrôle de l\'article chez Yaay Vidé'),
        ('terminee', 'Location terminée (article rendu)'),
        ('annule', 'Annulé'),
    )
    STATUT_PAIEMENT_CHOICES = (
        ('a_la_livraison', 'À payer à la livraison'),
        ('paye', 'Payé à la livraison'),
        ('annule', 'Annulé'),
    )
    MODE_PAIEMENT_CHOICES = (
        ('wave', 'Wave'),
        ('orange_money', 'Orange Money'),
        # Mixx by Yas : ex-« Free Money » (Free Sénégal est devenu Yas)
        ('mixx', 'Mixx by Yas'),
        ('especes', 'Espèces'),
    )
    acheteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achats')
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT)
    livreur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role': 'livreur'}, related_name='livraisons')

    quantite = models.PositiveSmallIntegerField(default=1)
    adresse_livraison = models.TextField(blank=True)
    zone_livraison = models.CharField(max_length=10, choices=ZONES_LIVRAISON_CHOICES, blank=True)
    complement_adresse = models.CharField(max_length=255, blank=True)

    # Choisi par l'acheteuse à la commande, encaissé réellement par le
    # livreur à la remise (peut différer si elle change d'avis sur place).
    mode_paiement_choisi = models.CharField(max_length=20, choices=MODE_PAIEMENT_CHOICES, blank=True)

    statut = models.CharField(max_length=25, choices=STATUT_CHOICES, default='en_attente_confirmation')
    date_limite_confirmation = models.DateTimeField(
        null=True, blank=True,
        help_text="Calculée automatiquement : date_commande + 24h",
    )
    prix_total_paye = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="Prix total à payer (FCFA)")
    frais_livraison = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="Frais de livraison estimés (FCFA)")
    date_commande = models.DateTimeField(auto_now_add=True)

    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAIEMENT_CHOICES, default='a_la_livraison')
    date_paiement = models.DateTimeField(null=True, blank=True)
    # Référence InTouch de la transaction déclenchée AU MOMENT DE LA
    # LIVRAISON (pas à la commande) — vide pour un paiement encaissé en
    # espèces, puisqu'aucun appel InTouch n'a alors lieu.
    reference_paiement = models.CharField(max_length=120, blank=True, verbose_name="Référence transaction InTouch")

    # Répartition de la commission, calculée à la LIVRAISON (le stock n'est
    # décrémenté qu'à ce moment-là — jamais à la simple création de la
    # commande, pour ne jamais bloquer un article pour une commande qui ne
    # sera peut-être jamais confirmée).
    commission_plateforme = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    montant_net_vendeuse = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    # Sur les frais de livraison : 75% pour le livreur, 25% pour Yaay Vidé
    # (logistique, assurance des litiges...) — calculé à la livraison, comme
    # commission_plateforme/montant_net_vendeuse ci-dessus.
    part_livreur = models.DecimalField(max_digits=10, decimal_places=0, default=0)

    # --- Location uniquement (type_offre='location' sur le produit) ---
    # La location se commande maintenant directement sur le site, comme un
    # achat — plus de négociation par WhatsApp. Un changement de durée
    # (prolongation/écourtement) est géré manuellement par l'admin, pas en
    # libre-service.
    date_debut_location = models.DateField(null=True, blank=True)
    date_fin_location = models.DateField(null=True, blank=True)
    caution_demandee = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    caution_remboursee = models.BooleanField(default=False)
    # Contre-proposition de dates par la vendeuse (statut 'contre_proposition')
    date_debut_proposee = models.DateField(null=True, blank=True)
    date_fin_proposee = models.DateField(null=True, blank=True)
    # Prolongation demandée par la locataire pendant la location
    PROLONGATION_CHOICES = (
        ('', 'Aucune'),
        ('demandee', 'Demandée'),
        ('acceptee', 'Acceptée'),
        ('refusee', 'Refusée'),
    )
    prolongation_statut = models.CharField(max_length=10, choices=PROLONGATION_CHOICES, blank=True, default='')
    prolongation_date_fin = models.DateField(null=True, blank=True)
    jours_prolongation = models.PositiveSmallIntegerField(default=0)
    # Montant des jours ajoutés, encaissé par le livreur lors du retour
    supplement_prolongation = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    supplement_paye = models.BooleanField(default=False)
    # Retour : livreur qui récupère l'article chez la locataire
    livreur_retour = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'livreur'}, related_name='retours_location',
    )
    # Caution : contrôlée et rendue par l'équipe (Wave / Orange Money / espèces)
    caution_retenue = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    motif_retenue = models.TextField(blank=True)
    caution_traitee_le = models.DateTimeField(null=True, blank=True)
    rappel_fin_envoye = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.pk is None and self.date_limite_confirmation is None:
            from django.utils import timezone
            from datetime import timedelta
            self.date_limite_confirmation = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Commande #{self.id} - {self.acheteur.username}"

    def confirmer_disponibilite(self):
        """La vendeuse confirme que l'article est toujours disponible."""
        if self.statut != 'en_attente_confirmation':
            return
        self.statut = 'confirme'
        self.save(update_fields=['statut'])

    def marquer_indisponible(self):
        """La vendeuse indique que l'article n'est plus disponible — la
        commande est annulée, rien n'a jamais été payé ni décrémenté."""
        if self.statut != 'en_attente_confirmation':
            return
        self.statut = 'indisponible'
        self.statut_paiement = 'annule'
        self.save(update_fields=['statut', 'statut_paiement'])

    def marquer_livree(self, mode_paiement_reel=None, reference_paiement=''):
        """
        À appeler par le livreur une fois l'article remis ET le paiement
        (espèces, ou InTouch pour Wave/Orange Money/Mixx by Yas) réellement encaissé.
        C'est SEULEMENT à ce moment que le stock est décrémenté et que la
        commission est calculée — jamais avant, puisqu'il n'y a pas de
        paiement en ligne au moment de la commande elle-même.
        """
        from django.utils import timezone

        if self.statut_paiement == 'paye':
            return  # déjà traité, on ne décrémente pas deux fois

        if self.date_debut_location and self.date_fin_location:
            # Location : le prix de base couvre toute la durée, pas un seul jour.
            nb_jours = max(1, (self.date_fin_location - self.date_debut_location).days)
            prix_base = self.produit.prix_vendeur * nb_jours
        else:
            prix_base = self.produit.prix_vendeur * self.quantite
        self.commission_plateforme = round(prix_base * Decimal(str(self.produit.taux_commission)))
        self.montant_net_vendeuse = prix_base - self.commission_plateforme
        self.part_livreur = round(self.frais_livraison * Decimal('0.75'))

        self.statut = 'livre'
        self.statut_paiement = 'paye'
        if mode_paiement_reel:
            self.mode_paiement_choisi = mode_paiement_reel
        if reference_paiement:
            self.reference_paiement = reference_paiement
        self.date_paiement = timezone.now()
        self.save()

        # Une location ne retire pas l'article du catalogue : il revient après
        # le retour, et ses dates déjà réservées sont bloquées par ailleurs.
        if self.date_debut_location and self.date_fin_location:
            return
        produit = self.produit
        produit.quantite_disponible = max(0, produit.quantite_disponible - self.quantite)
        if produit.quantite_disponible == 0:
            produit.disponible = False
        produit.save()

    @property
    def nb_jours_location(self):
        if self.date_debut_location and self.date_fin_location:
            return max(1, (self.date_fin_location - self.date_debut_location).days)
        return None

    def terminer_location(self, caution_remboursee=True):
        """L'article loué est rendu et inspecté — à appeler par l'admin une
        fois le retour effectué. Un changement de durée (prolongation ou
        écourtement) se fait manuellement par l'admin en modifiant
        date_debut_location/date_fin_location directement, pas ici."""
        self.statut = 'terminee'
        self.caution_remboursee = caution_remboursee
        self.save(update_fields=['statut', 'caution_remboursee'])


# ==========================================
# 6. E-BOOK — produit numérique vendu par Yaay Vidé elle-même (pas une
# vendeuse), donc un circuit d'achat séparé de Commande qui suppose
# toujours un produit/boutique. Le PDF complet n'est jamais exposé
# publiquement — seul un PDF d'aperçu (3-4 premières pages, préparé à part)
# est accessible sans achat. Le PDF complet n'est servi qu'après
# confirmation du paiement, via TelechargerEbookView qui vérifie le statut
# de l'achat côté serveur (jamais un simple blocage côté interface, qui
# serait trivialement contournable depuis les outils développeur).
# ==========================================
class Ebook(models.Model):
    titre = models.CharField(max_length=200)
    # Facultative : si elle est vide, la page e-book affiche un texte par défaut.
    description = models.TextField(blank=True)
    prix = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="Prix (FCFA)")
    couverture = models.ImageField(upload_to='ebook/couverture/', null=True, blank=True)
    fichier_apercu = models.FileField(
        upload_to='ebook/apercu/', null=True, blank=True,
        verbose_name="PDF d'aperçu (3-4 pages, public)",
    )
    fichier_complet = models.FileField(
        upload_to='ebook/complet/', null=True, blank=True,
        verbose_name="PDF complet (protégé, jamais servi publiquement)",
    )
    nb_pages = models.PositiveSmallIntegerField(null=True, blank=True)
    actif = models.BooleanField(default=True, verbose_name="Visible et en vente sur le site")
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titre


class AchatEbook(models.Model):
    STATUT_PAIEMENT_CHOICES = (
        ('en_attente', 'En attente de paiement'),
        ('paye', 'Payé'),
        ('echoue', 'Paiement échoué'),
    )
    MODE_PAIEMENT_CHOICES = Commande.MODE_PAIEMENT_CHOICES

    ebook = models.ForeignKey(Ebook, on_delete=models.PROTECT, related_name='achats')
    # Pas de compte requis pour acheter un e-book — juste un contact pour
    # pouvoir envoyer le lien de téléchargement.
    email = models.EmailField()
    telephone = models.CharField(max_length=20, blank=True)
    mode_paiement = models.CharField(max_length=20, choices=MODE_PAIEMENT_CHOICES, blank=True)

    prix_paye = models.DecimalField(max_digits=10, decimal_places=0)
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAIEMENT_CHOICES, default='en_attente')
    reference_paiement = models.CharField(max_length=120, blank=True)
    date_paiement = models.DateTimeField(null=True, blank=True)

    # Jeton unique donnant accès au téléchargement une fois payé — envoyé
    # par email/affiché après paiement, pas besoin de compte pour l'utiliser.
    token_telechargement = models.CharField(max_length=64, unique=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Achat e-book #{self.id} - {self.email}"

    def confirmer_paiement(self, reference_paiement):
        from django.utils import timezone
        if self.statut_paiement == 'paye':
            return
        self.statut_paiement = 'paye'
        self.reference_paiement = reference_paiement
        self.date_paiement = timezone.now()
        self.save()


# ==========================================
# 9. CENTRE DE PLAINTE — remplace le circuit de retour/remboursement produit
# (décision du 25/07/2026 : les ventes sont fermes et définitives). Une
# plainte ne déclenche jamais automatiquement de remboursement — elle sert
# à signaler un problème pour que Yaay Vidé puisse enquêter et, si besoin,
# sanctionner une vendeuse peu fiable.
# ==========================================
class Plainte(models.Model):
    STATUT_CHOICES = (
        ('nouvelle', 'Nouvelle'),
        ('en_cours', 'En cours de traitement'),
        ('resolue', 'Résolue'),
        ('rejetee', 'Rejetée'),
    )
    acheteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plaintes')
    commande = models.ForeignKey(Commande, on_delete=models.SET_NULL, null=True, blank=True, related_name='plaintes')
    sujet = models.CharField(max_length=200)
    description = models.TextField()
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='nouvelle')
    reponse_admin = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_reponse = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Plainte #{self.id} - {self.sujet}"


# ==========================================
# 8. FAVORIS (WISHLIST) — pour qu'une acheteuse puisse mettre un article de
# côté et l'acheter plus tard, retrouvable depuis n'importe quel appareil
# une fois connectée (contrairement à un simple stockage local navigateur).
# ==========================================
class Favori(models.Model):
    acheteur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favoris')
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='favorise_par')
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('acheteur', 'produit')

    def __str__(self):
        return f"{self.acheteur.username} ♥ {self.produit.titre}"


# ==========================================
# 7. AVIS CENTRÉS SUR LE VENDEUR
# ==========================================
class AvisVendeur(models.Model):
    auteur = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'acheteur'})
    boutique = models.ForeignKey(Boutique, on_delete=models.CASCADE, related_name='avis_recus')
    note = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    commentaire = models.TextField(blank=True, verbose_name="Avis sur la vendeuse")
    date_creation = models.DateTimeField(auto_now_add=True)

    reponse_vendeuse = models.TextField(blank=True)
    date_reponse = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Avis Vendeurs"
        unique_together = ('auteur', 'boutique')

    def __str__(self):
        return f"Avis {self.note}/5 pour {self.boutique.nom_boutique}"

# ==========================================
# ESPACE « UNE QUESTION ? » (utilisatrice <-> équipe Yaay Vidé)
# ==========================================
class FilSupport(models.Model):
    """
    Un seul fil de discussion par utilisatrice, avec l'équipe Yaay Vidé
    (aucun échange direct entre acheteuses et vendeuses).
    """
    utilisateur = models.OneToOneField(User, on_delete=models.CASCADE, related_name='fil_support')
    cree_le = models.DateTimeField(auto_now_add=True)
    dernier_message_le = models.DateTimeField(auto_now_add=True, db_index=True)
    # Vrai tant que le dernier message vient de l'utilisatrice (sans réponse)
    en_attente_equipe = models.BooleanField(default=False, db_index=True)
    # Anti-spam des e-mails « l'équipe vous a répondu »
    dernier_email_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Fil « Une question ? »"
        verbose_name_plural = "Fils « Une question ? »"
        ordering = ['-en_attente_equipe', '-dernier_message_le']

    def __str__(self):
        return f"Questions de {self.utilisateur}"


class MessageSupport(models.Model):
    fil = models.ForeignKey(FilSupport, on_delete=models.CASCADE, related_name='messages')
    auteur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages_support')
    de_l_equipe = models.BooleanField(default=False)
    texte = models.TextField(max_length=2000)
    # Élément joint pour donner le contexte de la question
    produit = models.ForeignKey(Produit, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    commande = models.ForeignKey(Commande, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    envoye_le = models.DateTimeField(auto_now_add=True, db_index=True)
    # Lu par l'autre côté (l'équipe pour un message de l'utilisatrice, et inversement)
    lu_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['envoye_le', 'id']

    def __str__(self):
        return f"{'Équipe' if self.de_l_equipe else self.auteur} : {self.texte[:40]}"
