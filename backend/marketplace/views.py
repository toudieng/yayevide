from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import User, Produit, Categorie, Commande, Boutique, AvisVendeur, Favori, Plainte, ZONES_LIVRAISON, ZONES_LIVRAISON_CHOICES, calculer_frais_livraison
from .services.notifications import notifier_nouvelle_commande
from rest_framework.permissions import IsAuthenticated
from .serializers import (
    InscriptionVendeurSerializer,
    ProduitSerializer,
    ProduitDetailSerializer,
    CategorieSerializer,
    BoutiquePubliqueSerializer,
    MaBoutiqueSerializer,
    AvisVendeurSerializer,
    CommandeSerializer,
    FavoriSerializer,
    PlainteSerializer,
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


class BoutiquePubliqueView(APIView):
    """Page publique d'une boutique : yaayvide.com/boutique/<slug>."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        boutique = get_object_or_404(Boutique, slug=slug)
        serializer = BoutiquePubliqueSerializer(boutique, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class LaisserAvisView(APIView):
    """Permet à une acheteuse connectée de laisser/mettre à jour un avis sur une boutique."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        boutique = get_object_or_404(Boutique, slug=slug)
        note = request.data.get('note')
        commentaire = request.data.get('commentaire', '')

        try:
            note = int(note)
            assert 1 <= note <= 5
        except (TypeError, ValueError, AssertionError):
            return Response({"note": "La note doit être un nombre entre 1 et 5."}, status=status.HTTP_400_BAD_REQUEST)

        avis, _ = AvisVendeur.objects.update_or_create(
            auteur=request.user,
            boutique=boutique,
            defaults={"note": note, "commentaire": commentaire},
        )
        return Response(AvisVendeurSerializer(avis).data, status=status.HTTP_201_CREATED)


class MoiView(APIView):
    """Renvoie les infos de la personne actuellement connectée (session active)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        boutique = getattr(user, 'boutique', None)
        eligible_lancement = False
        if boutique:
            eligible_lancement = boutique.beneficiaire_lancement and not boutique.produits.exists()
        return Response({
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
            "date_joined": user.date_joined,
            "nom_boutique": boutique.nom_boutique if boutique else None,
            "boutique_slug": boutique.slug if boutique else None,
            "eligible_lancement": eligible_lancement,
            "adresse_sauvegardee": user.adresse_sauvegardee,
            "complement_adresse_sauvegarde": user.complement_adresse_sauvegarde,
            "zone_sauvegardee": user.zone_sauvegardee,
            "zone_livreur": user.zone_livreur,
            "notification_preference": user.notification_preference,
            "type_vehicule": user.type_vehicule,
            "marque_modele_vehicule": user.marque_modele_vehicule,
            "immatriculation": user.immatriculation,
            "piece_identite": request.build_absolute_uri(user.piece_identite.url) if user.piece_identite else None,
            "piece_identite_verifiee": user.piece_identite_verifiee,
            "permis_conduire": request.build_absolute_uri(user.permis_conduire.url) if user.permis_conduire else None,
            "permis_conduire_verifie": user.permis_conduire_verifie,
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        if user.role == 'livreur' and 'zone_livreur' in request.data:
            zones_valides = dict(ZONES_LIVRAISON_CHOICES)
            valeur = request.data.get('zone_livreur') or ''
            if valeur and valeur not in zones_valides:
                return Response({'zone_livreur': ['Zone invalide.']}, status=status.HTTP_400_BAD_REQUEST)
            user.zone_livreur = valeur
            user.save(update_fields=['zone_livreur'])
        if user.role == 'livreur':
            champs_vehicule = ['type_vehicule', 'marque_modele_vehicule', 'immatriculation']
            a_modifier = [c for c in champs_vehicule if c in request.data]
            if a_modifier:
                for champ in a_modifier:
                    setattr(user, champ, request.data.get(champ) or '')
                user.save(update_fields=a_modifier)
        return Response({'zone_livreur': user.zone_livreur}, status=status.HTTP_200_OK)


class LivreurDocumentsView(APIView):
    """Upload des documents d'un livreur (pièce d'identité, permis de
    conduire) — chaque nouvel envoi remet le document en attente de
    vérification par l'équipe Yaay Vidé."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        user = request.user
        if user.role != 'livreur':
            return Response({"general": "Réservé aux livreurs."}, status=status.HTTP_403_FORBIDDEN)

        if 'piece_identite' in request.FILES:
            user.piece_identite = request.FILES['piece_identite']
            user.piece_identite_verifiee = False
            user.save(update_fields=['piece_identite', 'piece_identite_verifiee'])
        if 'permis_conduire' in request.FILES:
            user.permis_conduire = request.FILES['permis_conduire']
            user.permis_conduire_verifie = False
            user.save(update_fields=['permis_conduire', 'permis_conduire_verifie'])

        return Response({
            "piece_identite": request.build_absolute_uri(user.piece_identite.url) if user.piece_identite else None,
            "piece_identite_verifiee": user.piece_identite_verifiee,
            "permis_conduire": request.build_absolute_uri(user.permis_conduire.url) if user.permis_conduire else None,
            "permis_conduire_verifie": user.permis_conduire_verifie,
        }, status=status.HTTP_200_OK)


class MonAdresseView(APIView):
    """Met à jour l'adresse de livraison enregistrée sur le compte —
    utilisée pour pré-remplir le checkout et évitable de la retaper à
    chaque commande."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        if 'notification_preference' in request.data and request.data['notification_preference'] not in dict(User.NOTIFICATION_CHOICES):
            return Response({"notification_preference": "Valeur invalide."}, status=status.HTTP_400_BAD_REQUEST)
        for champ_requete, champ_modele in [
            ('prenom', 'first_name'),
            ('nom', 'last_name'),
            ('adresse', 'adresse_sauvegardee'),
            ('complement_adresse', 'complement_adresse_sauvegarde'),
            ('zone', 'zone_sauvegardee'),
            ('notification_preference', 'notification_preference'),
        ]:
            if champ_requete in request.data:
                setattr(user, champ_modele, request.data[champ_requete])
        user.save()
        return Response({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "adresse_sauvegardee": user.adresse_sauvegardee,
            "complement_adresse_sauvegarde": user.complement_adresse_sauvegarde,
            "zone_sauvegardee": user.zone_sauvegardee,
            "notification_preference": user.notification_preference,
        }, status=status.HTTP_200_OK)


class DeconnexionView(APIView):
    """Termine la session en cours."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "Déconnexion réussie."}, status=status.HTTP_200_OK)


class MesProduitsView(APIView):
    """Les articles de la boutique de la vendeuse connectée (tableau de bord)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'boutique'):
            return Response([], status=status.HTTP_200_OK)
        produits = Produit.objects.filter(boutique=request.user.boutique).select_related('categorie').order_by('-date_ajout')
        serializer = ProduitSerializer(produits, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CategorieListView(APIView):
    """Catégories principales (avec leurs sous-catégories imbriquées) —
    alimente l'accueil, le filtre boutique et le formulaire d'ajout de
    produit. "Occasions spéciales" et "Bonnes affaires" n'apparaissent pas
    ici : ce sont des vitrines automatiques, pas des catégories choisies."""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Categorie.objects.filter(parent__isnull=True).prefetch_related('sous_categories')
        serializer = CategorieSerializer(categories, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProduitListView(APIView):
    """Liste des produits disponibles, filtrable par ?categorie=<slug>.

    ?tri=tendance renvoie les articles les plus vendus (paiements confirmés)
    en premier — utilisé pour le bloc "Tendances du moment" de la boutique.
    Combiné à ?limit=N pour ne récupérer qu'un aperçu.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        produits = Produit.objects.filter(disponible=True).select_related('categorie', 'categorie__parent', 'boutique')
        slug = request.query_params.get('categorie')
        if slug:
            # Matche soit la sous-catégorie exacte (ex: "bebe-tire-laits"),
            # soit n'importe quelle sous-catégorie de la famille principale
            # (ex: "bebe" -> tous les articles Bébé, toutes sous-catégories confondues).
            produits = produits.filter(Q(categorie__slug=slug) | Q(categorie__parent__slug=slug))

        occasion = request.query_params.get('occasion')
        if occasion:
            # Vitrine automatique "Occasions spéciales" — regroupe des
            # sous-catégories venant de familles différentes selon leur tag.
            produits = produits.filter(categorie__tags_occasion__icontains=occasion)

        if request.query_params.get('bonne_affaire') == 'true':
            produits = produits.filter(bonne_affaire=True)

        if request.query_params.get('tri') == 'tendance':
            produits = produits.annotate(
                _nb_ventes_annotees=Count('commande', filter=Q(commande__statut_paiement='paye'))
            ).order_by('-_nb_ventes_annotees', '-date_ajout')

        limit = request.query_params.get('limit')
        if limit and limit.isdigit():
            produits = produits[: int(limit)]

        serializer = ProduitSerializer(produits, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProduitDetailView(APIView):
    """Fiche produit — inclut les infos de la boutique (note, WhatsApp...)."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        produit = get_object_or_404(
            Produit.objects.select_related('categorie', 'boutique', 'boutique__vendeur'), pk=pk
        )
        # Une vue par session (pas par chargement de page) — on garde la
        # liste des produits déjà vus dans la session Django, qui expire
        # avec elle. Simple, pas besoin de compte, mais ne compte plus 50
        # fois la même personne qui rafraîchit la page.
        vus = request.session.get('produits_vus', [])
        if pk not in vus:
            Produit.objects.filter(pk=pk).update(nb_vues=produit.nb_vues + 1)
            produit.nb_vues += 1
            vus.append(pk)
            request.session['produits_vus'] = vus[-200:]  # borne la taille de la session

        serializer = ProduitDetailSerializer(produit, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class PasserCommandeView(APIView):
    """
    Transforme le contenu du panier (géré côté frontend) en une ou plusieurs
    Commande. Une ligne de panier = une Commande (le modèle ne lie qu'un seul
    produit par commande), elles partagent la même adresse/zone/mode de
    paiement. Plus de paiement en ligne : chaque commande part au statut
    'en_attente_confirmation', la vendeuse a 24h pour confirmer la
    disponibilité avant toute livraison — voir Commande.confirmer_disponibilite.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        items = request.data.get('items', [])
        adresse = request.data.get('adresse_livraison', '').strip()
        zone = request.data.get('zone_livraison', '')
        complement = request.data.get('complement_adresse', '').strip()
        mode_paiement = request.data.get('mode_paiement_choisi', '')

        if not items:
            return Response({"general": "Votre panier est vide."}, status=status.HTTP_400_BAD_REQUEST)
        if not adresse:
            return Response({"adresse_livraison": "L'adresse de livraison est requise."}, status=status.HTTP_400_BAD_REQUEST)
        if zone not in dict(ZONES_LIVRAISON_CHOICES_DICT):
            return Response({"zone_livraison": "Choisissez une zone de livraison valide."}, status=status.HTTP_400_BAD_REQUEST)
        if mode_paiement not in dict(Commande.MODE_PAIEMENT_CHOICES):
            return Response({"mode_paiement_choisi": "Choisissez un mode de paiement valide."}, status=status.HTTP_400_BAD_REQUEST)

        commandes_creees = []
        for item in items:
            try:
                produit = Produit.objects.get(pk=item.get('produit_id'), disponible=True)
            except Produit.DoesNotExist:
                continue

            frais_livraison = calculer_frais_livraison(produit.taille_colis, zone)

            if produit.type_offre == 'location':
                date_debut = parse_date(item.get('date_debut') or '')
                date_fin = parse_date(item.get('date_fin') or '')
                if not date_debut or not date_fin or date_fin <= date_debut:
                    continue  # dates invalides, on ignore cette ligne plutôt que de planter toute la commande
                nb_jours = (date_fin - date_debut).days
                commande = Commande.objects.create(
                    acheteur=request.user,
                    produit=produit,
                    quantite=1,
                    adresse_livraison=adresse,
                    zone_livraison=zone,
                    complement_adresse=complement,
                    mode_paiement_choisi=mode_paiement,
                    prix_total_paye=produit.prix_final_public * nb_jours + produit.caution,
                    frais_livraison=frais_livraison,
                    date_debut_location=date_debut,
                    date_fin_location=date_fin,
                    caution_demandee=produit.caution,
                )
            else:
                quantite = max(1, int(item.get('quantite', 1)))
                commande = Commande.objects.create(
                    acheteur=request.user,
                    produit=produit,
                    quantite=quantite,
                    adresse_livraison=adresse,
                    zone_livraison=zone,
                    complement_adresse=complement,
                    mode_paiement_choisi=mode_paiement,
                    prix_total_paye=produit.prix_final_public * quantite,
                    frais_livraison=frais_livraison,
                )
            commandes_creees.append(commande)

        if not commandes_creees:
            return Response({"general": "Aucun des articles du panier n'est plus disponible."}, status=status.HTTP_400_BAD_REQUEST)

        for commande in commandes_creees:
            notifier_nouvelle_commande(commande)

        total_produits = sum(c.prix_total_paye for c in commandes_creees)
        total_livraison = sum(c.frais_livraison for c in commandes_creees)

        # On retient cette adresse pour la prochaine commande — évite de la
        # retaper à chaque fois (cf. "adresse complétée automatiquement").
        request.user.adresse_sauvegardee = adresse
        request.user.complement_adresse_sauvegarde = complement
        request.user.zone_sauvegardee = zone
        request.user.save(update_fields=['adresse_sauvegardee', 'complement_adresse_sauvegarde', 'zone_sauvegardee'])

        return Response({
            "message": "Commande envoyée aux vendeuses pour confirmation.",
            "commandes": CommandeSerializer(commandes_creees, many=True, context={'request': request}).data,
            "total_produits": total_produits,
            "total_livraison": total_livraison,
            "total_general": total_produits + total_livraison,
        }, status=status.HTTP_201_CREATED)


ZONES_LIVRAISON_CHOICES_DICT = {z["code"]: z["nom"] for z in ZONES_LIVRAISON}


class EstimerLivraisonView(APIView):
    """Estime les frais de livraison pour un panier + une zone, AVANT de
    passer la commande — réutilise exactement la même fonction que le
    calcul final pour ne jamais afficher un chiffre différent de ce qui
    sera réellement facturé."""
    permission_classes = [AllowAny]

    def post(self, request):
        items = request.data.get('items', [])
        zone = request.data.get('zone_livraison', '')

        total = 0
        for item in items:
            try:
                produit = Produit.objects.get(pk=item.get('produit_id'))
            except Produit.DoesNotExist:
                continue
            total += calculer_frais_livraison(produit.taille_colis, zone)

        return Response({"frais_livraison_estimes": total}, status=status.HTTP_200_OK)


class ZonesLivraisonView(APIView):
    """Liste des zones de livraison (nom + localités) — alimente le
    sélecteur d'adresse au checkout."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(ZONES_LIVRAISON, status=status.HTTP_200_OK)


class MesCommandesVendeuseView(APIView):
    """Commandes en attente de confirmation pour les produits de la
    boutique connectée — alimente la notification "Nouvelle demande d'achat"
    côté vendeuse."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'boutique'):
            return Response([], status=status.HTTP_200_OK)
        commandes = (
            Commande.objects
            .filter(produit__boutique=request.user.boutique, statut='en_attente_confirmation')
            .select_related('produit', 'acheteur')
            .order_by('date_commande')
        )
        return Response(CommandeSerializer(commandes, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


class MesCommandesAcheteurView(APIView):
    """Historique complet des commandes de l'acheteuse connectée, pour la
    page "Mon compte" — tous statuts confondus, la plus récente d'abord."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        commandes = (
            Commande.objects
            .filter(acheteur=request.user)
            .select_related('produit', 'produit__boutique')
            .order_by('-date_commande')
        )
        return Response(CommandeSerializer(commandes, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


class ConfirmerDisponibiliteView(APIView):
    """La vendeuse confirme ou infirme la disponibilité d'un article
    commandé — sous 6h, avant toute livraison. Aucun paiement en jeu ici,
    juste une confirmation de stock réel."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            commande = Commande.objects.select_related('produit__boutique').get(
                pk=pk, produit__boutique=request.user.boutique,
            )
        except (Commande.DoesNotExist, AttributeError):
            return Response({"general": "Commande introuvable."}, status=status.HTTP_404_NOT_FOUND)

        disponible = request.data.get('disponible')
        if disponible is True:
            commande.confirmer_disponibilite()
        elif disponible is False:
            commande.marquer_indisponible()
        else:
            return Response({"disponible": "Ce champ doit être true ou false."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(CommandeSerializer(commande, context={'request': request}).data, status=status.HTTP_200_OK)


class MarquerLocationRetourneeView(APIView):
    """La vendeuse marque un article loué comme rendu — clôture la
    location (utilisé sur la page Locations de l'espace vendeuse)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            commande = Commande.objects.select_related('produit__boutique').get(
                pk=pk, produit__boutique=request.user.boutique, produit__type_offre='location',
            )
        except (Commande.DoesNotExist, AttributeError):
            return Response({"general": "Location introuvable."}, status=status.HTTP_404_NOT_FOUND)

        commande.statut = 'terminee'
        commande.save(update_fields=['statut'])
        return Response(CommandeSerializer(commande, context={'request': request}).data, status=status.HTTP_200_OK)


def envoyer_email_verification(user):
    """Envoie (ou réenvoie) le lien de confirmation par email à une vendeuse."""
    lien = f"{settings.FRONTEND_URL}/verifier-email/{user.username}/{user.whatsapp_verification_token}"
    send_mail(
        subject="Confirmez votre boutique Yaay Vidé",
        message=(
            f"Bonjour,\n\n"
            f"Votre code de vérification est : {user.whatsapp_verification_token}\n\n"
            f"Cliquez sur ce lien pour activer votre boutique :\n{lien}\n\n"
            f"À très vite sur Yaay Vidé !"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


class VerifierEmailView(APIView):
    """
    Confirmation automatique via le lien reçu par email — alternative à la
    vérification WhatsApp (manuelle) demandée par la cliente.
    """
    permission_classes = [AllowAny]

    def get(self, request, username, token):
        try:
            user = User.objects.get(username=username, role='vendeur')
        except User.DoesNotExist:
            return Response({"general": "Compte introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if user.is_whatsapp_verified:
            return Response({"message": "Ce compte est déjà vérifié."}, status=status.HTTP_200_OK)

        if user.whatsapp_verification_token != token:
            return Response({"general": "Lien de vérification invalide."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_whatsapp_verified = True
        user.save()
        return Response({"message": "Compte vérifié avec succès. Vous pouvez vous connecter."}, status=status.HTTP_200_OK)


class RenvoyerEmailVerificationView(APIView):
    """Permet de redemander l'email de vérification si la vendeuse ne l'a pas reçu."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        try:
            user = User.objects.get(username=username, role='vendeur')
        except User.DoesNotExist:
            return Response({"general": "Compte introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if user.is_whatsapp_verified:
            return Response({"message": "Ce compte est déjà vérifié."}, status=status.HTTP_200_OK)

        envoyer_email_verification(user)
        return Response({"message": f"Email envoyé à {user.email}."}, status=status.HTTP_200_OK)
    

class ModifierProduitView(APIView):
    """
    Édition d'un article existant depuis "Mes articles" (bouton Modifier).
    Mise à jour partielle des champs texte/tarifs — ne touche pas aux
    photos existantes pour l'instant (ajout/suppression de photos non
    couvert par cette première version).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            produit = Produit.objects.get(pk=pk, boutique=request.user.boutique)
        except (Produit.DoesNotExist, AttributeError):
            return Response({"general": "Article introuvable."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProduitSerializer(produit, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProduitDisponibiliteView(APIView):
    """
    Bouton "Marquer comme loué / disponible" du dashboard vendeuse — c'est
    elle qui gère ce statut au cas par cas après sa discussion WhatsApp avec
    l'acheteuse, pas l'admin (qui n'a pas la visibilité sur la remise réelle).
    Sert aussi de point d'entrée pour supprimer un article (DELETE), avec la
    même vérification de propriété (la vendeuse ne peut agir que sur ses
    propres articles).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            produit = Produit.objects.get(pk=pk, boutique=request.user.boutique)
        except (Produit.DoesNotExist, AttributeError):
            return Response({"general": "Article introuvable."}, status=status.HTTP_404_NOT_FOUND)

        produit.disponible = bool(request.data.get('disponible'))
        produit.save(update_fields=['disponible'])
        return Response(ProduitSerializer(produit, context={'request': request}).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            produit = Produit.objects.get(pk=pk, boutique=request.user.boutique)
        except (Produit.DoesNotExist, AttributeError):
            return Response({"general": "Article introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Une commande en cours pointe vers ce produit avec on_delete=PROTECT :
        # on empêche donc la suppression tant qu'une vente n'est pas soldée,
        # pour ne jamais perdre l'historique d'une transaction réelle.
        if Commande.objects.filter(produit=produit).exclude(statut='annule').exists():
            return Response(
                {"general": "Cet article a des commandes associées, vous ne pouvez pas le supprimer. Masquez-le plutôt."},
                status=status.HTTP_409_CONFLICT,
            )

        produit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MesVentesView(APIView):
    """
    Historique des ventes de la boutique de la vendeuse connectée, avec un
    résumé chiffré (bilan net, bilan du mois en cours) pour l'onglet "Ventes"
    du tableau de bord — cf. maquette "Mes Statistiques".
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'boutique'):
            return Response({"commandes": [], "stats": {}}, status=status.HTTP_200_OK)

        from django.utils import timezone
        from django.db.models import Sum

        commandes = (
            Commande.objects
            .filter(produit__boutique=request.user.boutique)
            .select_related('produit', 'produit__boutique')
            .order_by('-date_commande')
        )
        payees = commandes.filter(statut_paiement='paye')

        maintenant = timezone.now()
        payees_du_mois = payees.filter(date_paiement__year=maintenant.year, date_paiement__month=maintenant.month)

        stats = {
            "revenu_net_total": payees.aggregate(t=Sum('montant_net_vendeuse'))['t'] or 0,
            "revenu_net_mois": payees_du_mois.aggregate(t=Sum('montant_net_vendeuse'))['t'] or 0,
            "nb_ventes_total": payees.count(),
            "nb_ventes_mois": payees_du_mois.count(),
            "nb_commandes_en_attente": commandes.filter(statut_paiement='a_la_livraison').count(),
        }

        return Response({
            "commandes": CommandeSerializer(commandes, many=True, context={'request': request}).data,
            "stats": stats,
        }, status=status.HTTP_200_OK)


class InscriptionVendeurView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = InscriptionVendeurSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            if user.role == 'vendeur':
                message = "Compte créé. Veuillez valider votre boutique (WhatsApp ou email)."
                envoyer_email_verification(user)
            else:
                message = "Compte créé. Vous pouvez vous connecter dès maintenant."

            return Response({
                "message": message,
                "username": user.username,
                "whatsapp_token": user.whatsapp_verification_token,
                "phone_number": user.phone_number,
                "role": user.role,
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifierStatutBoutiqueView(APIView):
    def get(self, request, username):
        try:
            user = User.objects.get(username=username, role='vendeur')
            return Response({
                "username": user.username,
                "is_whatsapp_verified": user.is_whatsapp_verified
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"general": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        

class ConnexionView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"general": "Veuillez fournir un identifiant et un mot de passe."}, status=status.HTTP_400_BAD_REQUEST)

        # Authentification native de Django
        user = authenticate(username=username, password=password)

        if user is not None:
            # Sécurité : Si c'est une vendeuse mais qu'elle n'a pas encore validé son WhatsApp
            if user.role == 'vendeur' and not user.is_whatsapp_verified:
                return Response({
                    "general": "Votre compte boutique n'est pas encore validé. Veuillez d'abord le confirmer via WhatsApp."
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Connecter officiellement l'utilisateur et initialiser la session Django
            login(request, user)
            
            # On renvoie les infos essentielles au frontend React
            return Response({
                "message": "Connexion réussie",
                "username": user.username,
                "role": user.role,
                "nom_boutique": user.boutique.nom_boutique if hasattr(user, 'boutique') else None
            }, status=status.HTTP_200_OK)
        
        # Si l'identifiant ou le mot de passe est faux
        return Response({"general": "Identifiants invalides. Veuillez réessayer."}, status=status.HTTP_401_UNAUTHORIZED)
    
    
class AjouterProduitView(APIView):
    permission_classes = [IsAuthenticated]
    
    # Spécification explicite des parsers pour l'image
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = ProduitSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MesFavorisView(APIView):
    """Liste des articles mis de côté par l'acheteuse connectée."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favoris = Favori.objects.filter(acheteur=request.user).select_related(
            'produit', 'produit__categorie', 'produit__boutique'
        ).order_by('-date_ajout')
        return Response(FavoriSerializer(favoris, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


class FavoriToggleView(APIView):
    """Ajoute ou retire un produit des favoris — un seul endpoint, il
    bascule l'état plutôt que d'exiger de connaître l'état actuel côté
    frontend (évite un aller-retour en plus juste pour savoir quoi faire)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        produit = get_object_or_404(Produit, pk=pk)
        favori, cree = Favori.objects.get_or_create(acheteur=request.user, produit=produit)
        if not cree:
            favori.delete()
            return Response({"est_favori": False}, status=status.HTTP_200_OK)
        return Response({"est_favori": True}, status=status.HTTP_201_CREATED)


class AutresArticlesBoutiqueView(APIView):
    """Articles à découvrir de la même boutique, pour la fiche produit —
    exclut l'article actuellement consulté."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        produit = get_object_or_404(Produit, pk=pk)
        autres = (
            Produit.objects
            .filter(boutique=produit.boutique, disponible=True)
            .exclude(pk=pk)
            .select_related('categorie')
            .order_by('-date_ajout')[:4]
        )
        return Response(ProduitSerializer(autres, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


class MaBoutiqueView(APIView):
    """Page 'Ma boutique' — la vendeuse consulte et modifie son propre
    profil public (bio, bannière, zone, visibilité)."""
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        if not hasattr(request.user, 'boutique'):
            return Response({"general": "Aucune boutique associée à ce compte."}, status=status.HTTP_404_NOT_FOUND)
        return Response(MaBoutiqueSerializer(request.user.boutique, context={'request': request}).data, status=status.HTTP_200_OK)

    def patch(self, request):
        if not hasattr(request.user, 'boutique'):
            return Response({"general": "Aucune boutique associée à ce compte."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MaBoutiqueSerializer(request.user.boutique, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MesAvisVendeuseView(APIView):
    """Page 'Commentaires' — la vendeuse consulte les avis reçus sur sa
    boutique et peut y répondre (la réponse est publique, visible sur sa
    fiche boutique)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'boutique'):
            return Response([], status=status.HTTP_200_OK)
        avis = (
            AvisVendeur.objects
            .filter(boutique=request.user.boutique)
            .select_related('auteur')
            .order_by('-date_creation')
        )
        return Response(AvisVendeurSerializer(avis, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


class RepondreAvisView(APIView):
    """Enregistre (ou modifie) la réponse de la vendeuse à un avis précis —
    vérifie que l'avis appartient bien à sa propre boutique."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not hasattr(request.user, 'boutique'):
            return Response({"general": "Aucune boutique associée à ce compte."}, status=status.HTTP_404_NOT_FOUND)
        avis = get_object_or_404(AvisVendeur, pk=pk, boutique=request.user.boutique)
        reponse = request.data.get('reponse_vendeuse', '').strip()
        if not reponse:
            return Response({"reponse_vendeuse": "La réponse ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils import timezone
        avis.reponse_vendeuse = reponse
        avis.date_reponse = timezone.now()
        avis.save(update_fields=['reponse_vendeuse', 'date_reponse'])
        return Response(AvisVendeurSerializer(avis, context={'request': request}).data, status=status.HTTP_200_OK)


class MesPlaintesView(APIView):
    """Centre de plainte, côté acheteuse — remplace le circuit de retour
    produit. Une plainte n'entraîne jamais de remboursement automatique,
    elle est juste transmise à l'équipe Yaay Vidé pour examen."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plaintes = Plainte.objects.filter(acheteur=request.user).select_related('commande__produit').order_by('-date_creation')
        return Response(PlainteSerializer(plaintes, many=True, context={'request': request}).data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PlainteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            commande = serializer.validated_data.get('commande')
            if commande and commande.acheteur != request.user:
                return Response({"commande": "Cette commande ne vous appartient pas."}, status=status.HTTP_403_FORBIDDEN)
            serializer.save(acheteur=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)