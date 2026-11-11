from rest_framework import serializers
from .models import User, Boutique, Produit, Categorie, ImageProduit, AvisVendeur, Commande, Ebook, AchatEbook, ZONES_LIVRAISON_CHOICES, Favori, Plainte


class SousCategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'slug', 'groupe', 'tags_occasion']


class CategorieSerializer(serializers.ModelSerializer):
    sous_categories = SousCategorieSerializer(many=True, read_only=True)
    categorie_parente = serializers.CharField(source='parent.nom', read_only=True, default=None)

    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'slug', 'emoji', 'image', 'ordre', 'groupe', 'tags_occasion', 'categorie_parente', 'sous_categories']


class InscriptionVendeurSerializer(serializers.ModelSerializer):
    nom_boutique = serializers.CharField(write_only=True, required=False, allow_blank=True)
    zone_boutique = serializers.ChoiceField(choices=ZONES_LIVRAISON_CHOICES, write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=['acheteuse', 'vendeuse'], write_only=True, default='acheteuse')
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    notification_preference = serializers.ChoiceField(choices=User.NOTIFICATION_CHOICES, required=False, default='email')

    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number', 'password', 'nom_boutique', 'zone_boutique', 'role', 'first_name', 'last_name', 'notification_preference']

    def validate_phone_number(self, value):
        # S'assurer que le numéro commence bien par +
        if not value.startswith('+'):
            raise serializers.ValidationError("Le numéro de téléphone doit être au format international (ex: +221...).")
        return value

    def validate(self, data):
        if data.get('role') == 'vendeuse' and not data.get('nom_boutique'):
            raise serializers.ValidationError({"nom_boutique": "Le nom de la boutique est requis pour une vendeuse."})
        return data

    def create(self, validated_data):
        nom_boutique = validated_data.pop('nom_boutique', '')
        zone_boutique = validated_data.pop('zone_boutique', '')
        password = validated_data.pop('password')
        role_front = validated_data.pop('role', 'acheteuse')
        est_vendeuse = role_front == 'vendeuse'

        # Une vendeuse doit valider son WhatsApp avant de pouvoir se connecter ;
        # une acheteuse peut se connecter immédiatement. first_name/last_name
        # servent ensuite à préremplir l'adresse de livraison au checkout.
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            phone_number=validated_data['phone_number'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='vendeur' if est_vendeuse else 'acheteur',
            is_whatsapp_verified=not est_vendeuse,
            notification_preference=validated_data.get('notification_preference', 'email'),
        )
        user.set_password(password)
        user.save()

        if est_vendeuse:
            Boutique.objects.create(vendeur=user, nom_boutique=nom_boutique, zone=zone_boutique)

        return user


class ImageProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageProduit
        fields = ['id', 'image', 'ordre']


class ProduitSerializer(serializers.ModelSerializer):
    prix_final_public = serializers.ReadOnlyField()
    categorie_nom = serializers.SerializerMethodField()
    categorie_slug = serializers.SerializerMethodField()
    categorie_racine_nom = serializers.SerializerMethodField()
    categorie_racine_slug = serializers.SerializerMethodField()
    categorie_tags_occasion = serializers.SerializerMethodField()
    boutique_zone_nom = serializers.SerializerMethodField()
    boutique_verifiee = serializers.SerializerMethodField()
    images = ImageProduitSerializer(many=True, read_only=True)
    nb_ventes = serializers.SerializerMethodField()

    class Meta:
        model = Produit
        fields = [
            'id',
            'titre',
            'description',
            'categorie',
            'categorie_nom',
            'categorie_slug',
            'categorie_racine_nom',
            'categorie_racine_slug',
            'categorie_tags_occasion',
            'type_offre',
            'etat',
            'prix_vendeur',
            'caution',
            'prix_final_public',
            'quantite_disponible',
            'image_principale',
            'images',
            'disponible',
            'nb_ventes',
            'est_article_lancement',
            'nb_vues',
            'date_ajout',
            'taille_colis',
            'taille',
            'bonne_affaire',
            'boutique_zone_nom',
            'boutique_verifiee',
        ]

    def get_boutique_zone_nom(self, obj):
        if not obj.boutique or not obj.boutique.zone:
            return None
        return dict(ZONES_LIVRAISON_CHOICES).get(obj.boutique.zone)

    def get_boutique_verifiee(self, obj):
        return bool(obj.boutique and obj.boutique.vendeur.is_whatsapp_verified)

    def get_categorie_nom(self, obj):
        return obj.categorie.nom if obj.categorie else None

    def get_categorie_racine_nom(self, obj):
        return obj.categorie.categorie_racine.nom if obj.categorie else None

    def get_categorie_racine_slug(self, obj):
        return obj.categorie.categorie_racine.slug if obj.categorie else None

    def get_categorie_tags_occasion(self, obj):
        return obj.categorie.tags_occasion if obj.categorie else ''

    def validate_categorie(self, value):
        if value and value.parent_id is None:
            raise serializers.ValidationError(
                "Choisissez une sous-catégorie précise, pas seulement la catégorie principale."
            )
        return value

    def get_categorie_slug(self, obj):
        return obj.categorie.slug if obj.categorie else None

    def get_nb_ventes(self, obj):
        # Seule ProduitListView (tri=tendance) annote ce champ — on évite
        # sciemment de faire une requête par produit ici (N+1) pour les
        # listes non triées par tendance, qui n'en ont pas besoin.
        return getattr(obj, '_nb_ventes_annotees', None)

    def create(self, validated_data):
        # On extrait l'utilisateur connecté depuis le contexte de la requête API
        request = self.context['request']
        user = request.user
        # On associe automatiquement le produit à la boutique de cet utilisateur
        validated_data['boutique'] = user.boutique
        # "Publier l'annonce" doit rendre l'article visible immédiatement.
        # (DRF traite un BooleanField absent d'un formulaire multipart comme
        # False plutôt que d'utiliser le défaut du modèle — on le force ici.)
        validated_data['disponible'] = True

        # La première photo envoyée devient la couverture (image_principale),
        # les suivantes alimentent la galerie (ImageProduit).
        fichiers = request.FILES.getlist('images')
        if fichiers and not validated_data.get('image_principale'):
            validated_data['image_principale'] = fichiers[0]

        produit = super().create(validated_data)

        for index, fichier in enumerate(fichiers[1:]):
            ImageProduit.objects.create(produit=produit, image=fichier, ordre=index)

        return produit


class ProduitDetailSerializer(ProduitSerializer):
    """
    Utilisé uniquement par la fiche produit (GET /api/produits/<id>/) :
    ajoute les informations de la boutique nécessaires (nom, note, contact
    WhatsApp pour la location) sans alourdir la liste de la boutique.
    """
    boutique_id = serializers.IntegerField(source='boutique.id', read_only=True)
    boutique_nom = serializers.CharField(source='boutique.nom_boutique', read_only=True)
    boutique_slug = serializers.CharField(source='boutique.slug', read_only=True)
    boutique_description = serializers.CharField(source='boutique.description', read_only=True)
    boutique_note_moyenne = serializers.FloatField(source='boutique.note_moyenne', read_only=True)
    boutique_telephone = serializers.CharField(source='boutique.vendeur.phone_number', read_only=True)
    boutique_nb_avis = serializers.SerializerMethodField()
    boutique_nb_ventes = serializers.SerializerMethodField()
    boutique_zone_nom = serializers.SerializerMethodField()
    est_favori = serializers.SerializerMethodField()

    class Meta(ProduitSerializer.Meta):
        fields = ProduitSerializer.Meta.fields + [
            'boutique_id',
            'boutique_nom',
            'boutique_slug',
            'boutique_description',
            'boutique_note_moyenne',
            'boutique_telephone',
            'boutique_nb_avis',
            'boutique_nb_ventes',
            'boutique_zone_nom',
            'est_favori',
        ]

    def get_boutique_zone_nom(self, obj):
        return dict(ZONES_LIVRAISON_CHOICES).get(obj.boutique.zone)

    def get_boutique_nb_avis(self, obj):
        return obj.boutique.avis_recus.count()

    def get_boutique_nb_ventes(self, obj):
        return Commande.objects.filter(produit__boutique=obj.boutique, statut_paiement='paye').count()

    def get_est_favori(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.favorise_par.filter(acheteur=request.user).exists()

class PlainteSerializer(serializers.ModelSerializer):
    acheteur_username = serializers.CharField(source='acheteur.username', read_only=True)
    commande_produit_titre = serializers.CharField(source='commande.produit.titre', read_only=True, default=None)

    class Meta:
        model = Plainte
        fields = [
            'id', 'acheteur', 'acheteur_username', 'commande', 'commande_produit_titre',
            'sujet', 'description', 'statut', 'reponse_admin', 'date_creation', 'date_reponse',
        ]
        read_only_fields = ['id', 'acheteur', 'acheteur_username', 'commande_produit_titre', 'statut', 'reponse_admin', 'date_creation', 'date_reponse']


class FavoriSerializer(serializers.ModelSerializer):
    produit_detail = ProduitSerializer(source='produit', read_only=True)

    class Meta:
        model = Favori
        fields = ['id', 'produit', 'produit_detail', 'date_ajout']
        read_only_fields = ['id', 'produit_detail', 'date_ajout']


class AvisVendeurSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source='auteur.username', read_only=True)

    class Meta:
        model = AvisVendeur
        fields = ['id', 'boutique', 'auteur_nom', 'note', 'commentaire', 'date_creation', 'reponse_vendeuse', 'date_reponse']
        read_only_fields = ['id', 'boutique', 'auteur_nom', 'note', 'commentaire', 'date_creation', 'date_reponse']


class MaBoutiqueSerializer(serializers.ModelSerializer):
    """Pour la page 'Ma boutique' — la vendeuse gère elle-même son profil
    public (bio, bannière, zone, visibilité), contrairement à
    BoutiquePubliqueSerializer qui est en lecture seule pour les visiteuses."""
    zone_nom = serializers.SerializerMethodField()

    class Meta:
        model = Boutique
        fields = ['id', 'nom_boutique', 'slug', 'description', 'zone', 'zone_nom', 'banniere', 'visible', 'locations_activees']
        read_only_fields = ['id', 'slug']

    def get_zone_nom(self, obj):
        return dict(ZONES_LIVRAISON_CHOICES).get(obj.zone)


class BoutiquePubliqueSerializer(serializers.ModelSerializer):
    """Profil public d'une boutique — pas d'adresse ni de téléphone (cf. retour client)."""
    note_moyenne = serializers.ReadOnlyField()
    nb_avis = serializers.SerializerMethodField()
    nb_ventes = serializers.SerializerMethodField()
    zone_nom = serializers.SerializerMethodField()
    avis = AvisVendeurSerializer(source='avis_recus', many=True, read_only=True)
    produits = serializers.SerializerMethodField()

    class Meta:
        model = Boutique
        fields = ['id', 'nom_boutique', 'slug', 'description', 'date_creation', 'note_moyenne', 'nb_avis', 'nb_ventes', 'zone_nom', 'avis', 'produits']

    def get_nb_avis(self, obj):
        return obj.avis_recus.count()

    def get_nb_ventes(self, obj):
        return Commande.objects.filter(produit__boutique=obj, statut_paiement='paye').count()

    def get_zone_nom(self, obj):
        return dict(ZONES_LIVRAISON_CHOICES).get(obj.zone)

    def get_produits(self, obj):
        produits = obj.produits.filter(disponible=True)
        return ProduitSerializer(produits, many=True, context=self.context).data


class CommandeSerializer(serializers.ModelSerializer):
    produit_titre = serializers.CharField(source='produit.titre', read_only=True)
    produit_image = serializers.ImageField(source='produit.image_principale', read_only=True)
    produit_type_offre = serializers.CharField(source='produit.type_offre', read_only=True)
    boutique_nom = serializers.CharField(source='produit.boutique.nom_boutique', read_only=True)
    acheteur_nom = serializers.CharField(source='acheteur.username', read_only=True)
    zone_livraison_nom = serializers.SerializerMethodField()
    nb_jours_location = serializers.ReadOnlyField()
    produit_prix_jour = serializers.IntegerField(source='produit.prix_final_public', read_only=True)
    produit_taille = serializers.CharField(source='produit.taille', read_only=True)

    class Meta:
        model = Commande
        fields = [
            'id', 'produit', 'produit_titre', 'produit_image', 'produit_type_offre', 'boutique_nom',
            'acheteur_nom', 'quantite', 'adresse_livraison', 'zone_livraison', 'zone_livraison_nom', 'complement_adresse',
            'mode_paiement_choisi', 'frais_livraison',
            'statut', 'date_limite_confirmation', 'statut_paiement', 'date_paiement', 'reference_paiement',
            'prix_total_paye', 'commission_plateforme', 'montant_net_vendeuse', 'part_livreur',
            'date_debut_location', 'date_fin_location', 'nb_jours_location', 'caution_demandee', 'caution_remboursee',
            'date_debut_proposee', 'date_fin_proposee', 'prolongation_statut', 'prolongation_date_fin',
            'jours_prolongation', 'supplement_prolongation', 'supplement_paye', 'livreur_retour',
            'caution_retenue', 'motif_retenue', 'caution_traitee_le', 'produit_prix_jour', 'produit_taille',
            'date_commande',
        ]
        read_only_fields = fields

    def get_zone_livraison_nom(self, obj):
        return dict(ZONES_LIVRAISON_CHOICES).get(obj.zone_livraison)


# ==========================================
# ADMINISTRATION
# ==========================================
class UtilisateurAdminSerializer(serializers.ModelSerializer):
    nom_boutique = serializers.SerializerMethodField()
    boutique_slug = serializers.SerializerMethodField()
    note_moyenne = serializers.SerializerMethodField()
    nb_produits = serializers.SerializerMethodField()
    nb_ventes = serializers.SerializerMethodField()
    nb_commandes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone_number', 'role',
            'is_active', 'is_whatsapp_verified', 'date_joined', 'nom_boutique',
            'boutique_slug', 'note_moyenne', 'nb_produits', 'nb_ventes', 'nb_commandes',
        ]

    def get_nom_boutique(self, obj):
        boutique = getattr(obj, 'boutique', None)
        return boutique.nom_boutique if boutique else None

    def get_boutique_slug(self, obj):
        boutique = getattr(obj, 'boutique', None)
        return boutique.slug if boutique else None

    def get_note_moyenne(self, obj):
        boutique = getattr(obj, 'boutique', None)
        return boutique.note_moyenne if boutique else None

    def get_nb_produits(self, obj):
        boutique = getattr(obj, 'boutique', None)
        return boutique.produits.count() if boutique else None

    def get_nb_ventes(self, obj):
        boutique = getattr(obj, 'boutique', None)
        if not boutique:
            return None
        return Commande.objects.filter(produit__boutique=boutique, statut_paiement='paye').count()

    def get_nb_commandes(self, obj):
        if obj.role != 'acheteur':
            return None
        return obj.achats.count()


class LivreurSerializer(serializers.ModelSerializer):
    zone_nom = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'phone_number', 'zone_livreur', 'zone_nom']

    def get_zone_nom(self, obj):
        return dict(ZONES_LIVRAISON_CHOICES).get(obj.zone_livreur) if obj.zone_livreur else None


class VendeuseAdminSerializer(serializers.ModelSerializer):
    """Vue d'ensemble d'une boutique côté admin : identité de la vendeuse,
    statut de vérification, et quelques compteurs pour prioriser les
    validations et repérer les boutiques à surveiller."""
    vendeur_id = serializers.IntegerField(source='vendeur.id', read_only=True)
    username = serializers.CharField(source='vendeur.username', read_only=True)
    email = serializers.CharField(source='vendeur.email', read_only=True)
    phone_number = serializers.CharField(source='vendeur.phone_number', read_only=True)
    is_whatsapp_verified = serializers.BooleanField(source='vendeur.is_whatsapp_verified', read_only=True)
    is_active = serializers.BooleanField(source='vendeur.is_active', read_only=True)
    date_inscription = serializers.DateTimeField(source='vendeur.date_joined', read_only=True)
    nb_produits = serializers.SerializerMethodField()
    nb_ventes = serializers.SerializerMethodField()

    class Meta:
        model = Boutique
        fields = [
            'id', 'vendeur_id', 'nom_boutique', 'slug', 'description',
            'username', 'email', 'phone_number', 'is_whatsapp_verified', 'is_active',
            'date_inscription', 'note_moyenne', 'nb_produits', 'nb_ventes',
        ]

    def get_nb_produits(self, obj):
        return obj.produits.count()

    def get_nb_ventes(self, obj):
        return Commande.objects.filter(produit__boutique=obj, statut_paiement='paye').count()


class ProduitAdminSerializer(ProduitSerializer):
    boutique_nom = serializers.CharField(source='boutique.nom_boutique', read_only=True)

    class Meta(ProduitSerializer.Meta):
        fields = ProduitSerializer.Meta.fields + ['boutique_nom']


class CommandeAdminSerializer(CommandeSerializer):
    acheteur_username = serializers.CharField(source='acheteur.username', read_only=True)
    acheteur_telephone = serializers.CharField(source='acheteur.phone_number', read_only=True)
    livreur_nom = serializers.CharField(source='livreur.username', read_only=True)
    livreur_retour_nom = serializers.CharField(source='livreur_retour.username', read_only=True)
    boutique_telephone = serializers.CharField(source='produit.boutique.vendeur.phone_number', read_only=True)

    class Meta(CommandeSerializer.Meta):
        fields = CommandeSerializer.Meta.fields + ['acheteur_username', 'acheteur_telephone', 'livreur', 'livreur_nom', 'livreur_retour_nom', 'boutique_telephone']
        read_only_fields = [f for f in fields if f != 'livreur']


class EbookPublicSerializer(serializers.ModelSerializer):
    """Ne renvoie JAMAIS fichier_complet — seulement l'aperçu public."""

    class Meta:
        model = Ebook
        fields = ['id', 'titre', 'description', 'prix', 'couverture', 'fichier_apercu', 'nb_pages']


class AchatEbookSerializer(serializers.ModelSerializer):
    ebook_titre = serializers.CharField(source='ebook.titre', read_only=True)

    class Meta:
        model = AchatEbook
        fields = [
            'id', 'ebook', 'ebook_titre', 'email', 'telephone', 'mode_paiement',
            'prix_paye', 'statut_paiement', 'reference_paiement', 'date_paiement',
            'token_telechargement', 'date_creation',
        ]
        read_only_fields = fields


class EbookAdminSerializer(serializers.ModelSerializer):
    """CRUD complet pour l'admin, y compris l'upload du PDF protégé."""

    class Meta:
        model = Ebook
        fields = ['id', 'titre', 'description', 'prix', 'couverture', 'fichier_apercu', 'fichier_complet', 'nb_pages', 'actif', 'date_creation']


class CategorieAdminSerializer(serializers.ModelSerializer):
    """Comme CategorieSerializer mais accepte la création/édition (image
    incluse) pour l'écran de gestion des catégories de l'admin."""

    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'slug', 'image', 'ordre']
        read_only_fields = ['slug']
