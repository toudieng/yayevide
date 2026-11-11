"""
marketplace/admin_api.py

API du dashboard admin (distinct de /django-admin/ qui reste l'outil
technique). Toutes les vues sont réservées aux comptes role='admin' (ou
superuser) via la permission EstAdmin.
"""
from datetime import timedelta
from django.conf import settings
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import User, Boutique, Produit, Categorie, Commande, Ebook, AchatEbook, Plainte
from .permissions import EstAdmin
from .serializers import (
    UtilisateurAdminSerializer,
    LivreurSerializer,
    PlainteSerializer,
    VendeuseAdminSerializer,
    ProduitAdminSerializer,
    CommandeAdminSerializer,
    CategorieAdminSerializer,
    EbookAdminSerializer,
    AchatEbookSerializer,
)


class StatsAdminView(APIView):
    """Vue d'ensemble du dashboard admin : santé de la marketplace en un
    coup d'œil (GMV, commissions, activité du mois, boutiques en attente)."""
    permission_classes = [EstAdmin]

    def get(self, request):
        maintenant = timezone.now()
        payees = Commande.objects.filter(statut_paiement='paye')
        payees_mois = payees.filter(date_paiement__year=maintenant.year, date_paiement__month=maintenant.month)

        stats = {
            "gmv_total": payees.aggregate(t=Sum('prix_total_paye'))['t'] or 0,
            "commission_totale": payees.aggregate(t=Sum('commission_plateforme'))['t'] or 0,
            "gmv_mois": payees_mois.aggregate(t=Sum('prix_total_paye'))['t'] or 0,
            "commission_mois": payees_mois.aggregate(t=Sum('commission_plateforme'))['t'] or 0,
            "nb_commandes_total": payees.count(),
            "nb_commandes_mois": payees_mois.count(),
            "nb_commandes_en_attente": Commande.objects.filter(statut='en_attente_confirmation').count(),
            "nb_boutiques": Boutique.objects.count(),
            "nb_boutiques_a_valider": User.objects.filter(role='vendeur', is_whatsapp_verified=False).count(),
            "nb_produits_en_ligne": Produit.objects.filter(disponible=True).count(),
            "nb_acheteurs": User.objects.filter(role='acheteur').count(),
            "nb_livreurs": User.objects.filter(role='livreur').count(),
            # Actions prioritaires — tout ce qui attend une décision humaine.
            "nb_plaintes_nouvelles": Plainte.objects.filter(statut='nouvelle').count(),
            "nb_commandes_expirant_bientot": Commande.objects.filter(
                statut='en_attente_confirmation',
                date_limite_confirmation__lte=maintenant + timedelta(hours=2),
                date_limite_confirmation__gt=maintenant,
            ).count(),
            "nb_commandes_expirees": Commande.objects.filter(
                statut='en_attente_confirmation',
                date_limite_confirmation__lte=maintenant,
            ).count(),
            "nb_livraisons_non_assignees": Commande.objects.filter(statut='confirme', livreur__isnull=True).count(),
        }
        return Response(stats, status=status.HTTP_200_OK)


class PerformanceAdminView(APIView):
    """Analyse de performance : vision 360° (GMV, commissions, activité,
    engagement) sur une période filtrable avec comparaison à la période
    précédente, puis top vendeuses, répartition par catégorie, évolution
    du GMV sur les 6 derniers mois."""
    permission_classes = [EstAdmin]

    PERIODES = {
        '7j': 7,
        '30j': 30,
        '90j': 90,
    }

    def get(self, request):
        maintenant = timezone.now()
        payees = Commande.objects.filter(statut_paiement='paye')

        periode = request.query_params.get('periode', '30j')
        nb_jours = self.PERIODES.get(periode, 30)
        debut_periode = maintenant - timedelta(days=nb_jours)
        debut_periode_precedente = debut_periode - timedelta(days=nb_jours)

        def variation(valeur_actuelle, valeur_precedente):
            if not valeur_precedente:
                return None
            return round((valeur_actuelle - valeur_precedente) / valeur_precedente * 100, 1)

        def bloc_periode(depuis, jusqua):
            cmds = payees.filter(date_paiement__gte=depuis, date_paiement__lt=jusqua)
            toutes_cmds = Commande.objects.filter(date_commande__gte=depuis, date_commande__lt=jusqua)
            return {
                "gmv": cmds.aggregate(t=Sum('prix_total_paye'))['t'] or 0,
                "gmv_ventes": cmds.filter(produit__type_offre='vente').aggregate(t=Sum('prix_total_paye'))['t'] or 0,
                "gmv_locations": cmds.filter(produit__type_offre='location').aggregate(t=Sum('prix_total_paye'))['t'] or 0,
                "commission": cmds.aggregate(t=Sum('commission_plateforme'))['t'] or 0,
                "nb_commandes": toutes_cmds.count(),
                "ventes_finalisees": toutes_cmds.filter(produit__type_offre='vente', statut='livre').count(),
                "locations_en_cours": toutes_cmds.filter(produit__type_offre='location', statut__in=['confirme', 'en_cours_livraison', 'livre']).count(),
                "locations_terminees": toutes_cmds.filter(produit__type_offre='location', statut='terminee').count(),
                "nb_finalisees": toutes_cmds.filter(statut__in=['livre', 'terminee']).count(),
                "nouveaux_produits": Produit.objects.filter(date_ajout__gte=depuis, date_ajout__lt=jusqua).count(),
                "nb_nouvelles_boutiques": Boutique.objects.filter(date_creation__gte=depuis, date_creation__lt=jusqua).count(),
                "nb_nouveaux_acheteurs": User.objects.filter(role='acheteur', date_joined__gte=depuis, date_joined__lt=jusqua).count(),
                "nb_nouveaux_utilisateurs": User.objects.filter(date_joined__gte=depuis, date_joined__lt=jusqua).count(),
            }

        actuelle = bloc_periode(debut_periode, maintenant)
        precedente = bloc_periode(debut_periode_precedente, debut_periode)

        taux_finalise_actuel = round(actuelle["nb_finalisees"] / actuelle["nb_commandes"] * 100, 1) if actuelle["nb_commandes"] else 0
        taux_finalise_precedent = round(precedente["nb_finalisees"] / precedente["nb_commandes"] * 100, 1) if precedente["nb_commandes"] else 0

        vision_360 = {
            "periode": periode,
            "gmv": actuelle["gmv"],
            "gmv_variation": variation(actuelle["gmv"], precedente["gmv"]),
            "commission": actuelle["commission"],
            "commission_variation": variation(actuelle["commission"], precedente["commission"]),
            "commission_taux_standard": settings.COMMISSION_STANDARD_PERCENT,
            "nb_commandes": actuelle["nb_commandes"],
            "nb_commandes_variation": variation(actuelle["nb_commandes"], precedente["nb_commandes"]),
            "nb_nouvelles_boutiques": actuelle["nb_nouvelles_boutiques"],
            "nb_nouveaux_acheteurs": actuelle["nb_nouveaux_acheteurs"],
            "engagement_variation": variation(
                actuelle["nb_nouvelles_boutiques"] + actuelle["nb_nouveaux_acheteurs"],
                precedente["nb_nouvelles_boutiques"] + precedente["nb_nouveaux_acheteurs"],
            ),
        }

        repartition = {
            "ventes": {
                "montant": actuelle["gmv_ventes"],
                "variation": variation(actuelle["gmv_ventes"], precedente["gmv_ventes"]),
                "pct_total": round(actuelle["gmv_ventes"] / actuelle["gmv"] * 100, 1) if actuelle["gmv"] else 0,
            },
            "locations": {
                "montant": actuelle["gmv_locations"],
                "variation": variation(actuelle["gmv_locations"], precedente["gmv_locations"]),
                "pct_total": round(actuelle["gmv_locations"] / actuelle["gmv"] * 100, 1) if actuelle["gmv"] else 0,
            },
        }

        activite_plateforme = {
            "nb_commandes": actuelle["nb_commandes"],
            "nb_commandes_variation": variation(actuelle["nb_commandes"], precedente["nb_commandes"]),
            "ventes_finalisees": actuelle["ventes_finalisees"],
            "ventes_finalisees_variation": variation(actuelle["ventes_finalisees"], precedente["ventes_finalisees"]),
            "locations_en_cours": actuelle["locations_en_cours"],
            "locations_en_cours_variation": variation(actuelle["locations_en_cours"], precedente["locations_en_cours"]),
            "locations_terminees": actuelle["locations_terminees"],
            "locations_terminees_variation": variation(actuelle["locations_terminees"], precedente["locations_terminees"]),
            "taux_finalise": taux_finalise_actuel,
            "taux_finalise_variation": (
                round(taux_finalise_actuel - taux_finalise_precedent, 1) if precedente["nb_commandes"] else None
            ),
            "produits_actifs": Produit.objects.filter(disponible=True).count(),
            "nouveaux_produits": actuelle["nouveaux_produits"],
            "nouveaux_produits_variation": variation(actuelle["nouveaux_produits"], precedente["nouveaux_produits"]),
        }

        communaute = {
            "utilisateurs_inscrits": User.objects.count(),
            "nouveaux_utilisateurs": actuelle["nb_nouveaux_utilisateurs"],
            "nouveaux_utilisateurs_variation": variation(actuelle["nb_nouveaux_utilisateurs"], precedente["nb_nouveaux_utilisateurs"]),
            "vendeuses_actives": User.objects.filter(role='vendeur', is_active=True).count(),
            "livreurs_actifs": User.objects.filter(role='livreur', is_active=True).count(),
        }

        tous_produits = Produit.objects.all()
        nb_vues_total = tous_produits.aggregate(t=Sum('nb_vues'))['t'] or 0
        nb_commandes_total = Commande.objects.count()
        categorie_top = (
            tous_produits.exclude(categorie__isnull=True)
            .values('categorie__nom')
            .annotate(vues=Sum('nb_vues'))
            .order_by('-vues')
            .first()
        )

        engagement_detail = {
            "nb_vues_total": nb_vues_total,
            "taux_conversion": round(nb_commandes_total / nb_vues_total * 100, 2) if nb_vues_total else 0,
            "ratio_commandes_vues": round(nb_vues_total / nb_commandes_total) if nb_commandes_total else None,
            "categorie_plus_consultee": (
                {"nom": categorie_top['categorie__nom'], "nb_vues": categorie_top['vues']} if categorie_top else None
            ),
        }

        produits_vedettes = (
            tous_produits.filter(nb_vues__gt=0)
            .select_related('boutique')
            .order_by('-nb_vues')[:3]
        )
        produits_vedettes_data = []
        for p in produits_vedettes:
            nb_transactions = Commande.objects.filter(produit=p, statut_paiement='paye').count()
            produits_vedettes_data.append({
                "titre": p.titre,
                "image": request.build_absolute_uri(p.image_principale.url) if p.image_principale else None,
                "type_offre": p.type_offre,
                "nb_vues": p.nb_vues,
                "nb_transactions": nb_transactions,
            })

        top_vendeuses = (
            Boutique.objects
            .annotate(
                revenu_net=Sum('produits__commande__montant_net_vendeuse', filter=Q(produits__commande__statut_paiement='paye')),
                nb_ventes=Count('produits__commande', filter=Q(produits__commande__statut_paiement='paye')),
            )
            .filter(nb_ventes__gt=0)
            .order_by('-revenu_net')[:5]
            .values('id', 'nom_boutique', 'slug', 'revenu_net', 'nb_ventes')
        )

        ventes_par_categorie = (
            payees
            .values('produit__categorie__nom')
            .annotate(total=Sum('prix_total_paye'), nb=Count('id'))
            .order_by('-total')
        )

        evolution = []
        for i in range(5, -1, -1):
            mois_ref = maintenant - timedelta(days=30 * i)
            montant = payees.filter(
                date_paiement__year=mois_ref.year, date_paiement__month=mois_ref.month,
            ).aggregate(t=Sum('prix_total_paye'))['t'] or 0
            evolution.append({
                "mois": mois_ref.strftime('%b %Y'),
                "montant": montant,
            })

        return Response({
            "vision_360": vision_360,
            "repartition": repartition,
            "activite_plateforme": activite_plateforme,
            "communaute": communaute,
            "engagement_detail": engagement_detail,
            "produits_vedettes": produits_vedettes_data,
            "top_vendeuses": list(top_vendeuses),
            "ventes_par_categorie": list(ventes_par_categorie),
            "evolution_gmv": evolution,
        }, status=status.HTTP_200_OK)


class ActivitesAdminView(APIView):
    """Fil d'activité unifié de toute la plateforme — pas un vrai système
    de journalisation dédié, juste une lecture chronologique fusionnée de
    ce qui existe déjà (inscriptions, commandes, plaintes, produits)."""
    permission_classes = [EstAdmin]

    def get(self, request):
        evenements = []

        for b in Boutique.objects.select_related('vendeur').order_by('-date_creation')[:15]:
            evenements.append({
                "type": "inscription_vendeuse",
                "date": b.date_creation,
                "texte": f"Nouvelle boutique : {b.nom_boutique}",
            })

        for c in Commande.objects.select_related('produit', 'acheteur').order_by('-date_commande')[:15]:
            evenements.append({
                "type": "commande",
                "date": c.date_commande,
                "texte": f"Commande de {c.acheteur.username} — {c.produit.titre}",
            })

        for p in Plainte.objects.select_related('acheteur').order_by('-date_creation')[:15]:
            evenements.append({
                "type": "plainte",
                "date": p.date_creation,
                "texte": f"Plainte de {p.acheteur.username} — {p.sujet}",
            })

        for prod in Produit.objects.select_related('boutique').order_by('-date_ajout')[:15]:
            evenements.append({
                "type": "produit",
                "date": prod.date_ajout,
                "texte": f"{prod.boutique.nom_boutique} a publié \"{prod.titre}\"",
            })

        evenements.sort(key=lambda e: e['date'], reverse=True)
        return Response(evenements[:40], status=status.HTTP_200_OK)


class VendeusesAdminView(APIView):
    """Liste des boutiques — filtrable par ?statut=a_valider pour prioriser
    les nouvelles inscriptions à traiter."""
    permission_classes = [EstAdmin]

    def get(self, request):
        boutiques = Boutique.objects.select_related('vendeur').order_by('-vendeur__date_joined')
        if request.query_params.get('statut') == 'a_valider':
            boutiques = boutiques.filter(vendeur__is_whatsapp_verified=False)
        serializer = VendeuseAdminSerializer(boutiques, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class VendeuseValiderView(APIView):
    """Valide manuellement une boutique (au cas où le SMS/email WhatsApp
    n'est jamais arrivé — l'admin débloque la vendeuse à la main)."""
    permission_classes = [EstAdmin]

    def patch(self, request, pk):
        boutique = get_object_or_404(Boutique.objects.select_related('vendeur'), pk=pk)
        boutique.vendeur.is_whatsapp_verified = True
        boutique.vendeur.save(update_fields=['is_whatsapp_verified'])
        return Response(VendeuseAdminSerializer(boutique, context={'request': request}).data, status=status.HTTP_200_OK)


class VendeuseSuspendreView(APIView):
    """Suspend / réactive le compte d'une vendeuse (fraude, litige grave...).
    Un compte suspendu ne peut plus se connecter (is_active=False)."""
    permission_classes = [EstAdmin]

    def patch(self, request, pk):
        boutique = get_object_or_404(Boutique.objects.select_related('vendeur'), pk=pk)
        boutique.vendeur.is_active = bool(request.data.get('is_active'))
        boutique.vendeur.save(update_fields=['is_active'])
        return Response(VendeuseAdminSerializer(boutique, context={'request': request}).data, status=status.HTTP_200_OK)


class UtilisateursAdminView(APIView):
    """Liste de tous les comptes — filtrable par ?role=acheteur|vendeur|livreur|admin,
    ?q=<recherche libre sur nom/email/téléphone/boutique>, ?statut=actif|suspendu,
    ?verification=verifie|non_verifie."""
    permission_classes = [EstAdmin]

    def get(self, request):
        utilisateurs = User.objects.select_related('boutique').order_by('-date_joined')

        role = request.query_params.get('role')
        if role:
            utilisateurs = utilisateurs.filter(role=role)

        statut = request.query_params.get('statut')
        if statut == 'actif':
            utilisateurs = utilisateurs.filter(is_active=True)
        elif statut == 'suspendu':
            utilisateurs = utilisateurs.filter(is_active=False)

        verification = request.query_params.get('verification')
        if verification == 'verifie':
            utilisateurs = utilisateurs.filter(is_whatsapp_verified=True)
        elif verification == 'non_verifie':
            utilisateurs = utilisateurs.filter(is_whatsapp_verified=False)

        q = request.query_params.get('q')
        if q:
            utilisateurs = utilisateurs.filter(
                Q(username__icontains=q) | Q(email__icontains=q) | Q(phone_number__icontains=q)
                | Q(boutique__nom_boutique__icontains=q)
            )

        serializer = UtilisateurAdminSerializer(utilisateurs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UtilisateurSuspendreView(APIView):
    """Suspend / réactive n'importe quel compte (acheteuse, vendeuse,
    livreur ou admin) — un compte suspendu ne peut plus se connecter."""
    permission_classes = [EstAdmin]

    def patch(self, request, pk):
        utilisateur = get_object_or_404(User, pk=pk)
        utilisateur.is_active = bool(request.data.get('is_active'))
        utilisateur.save(update_fields=['is_active'])
        return Response(UtilisateurAdminSerializer(utilisateur).data, status=status.HTTP_200_OK)


class LivreursListView(APIView):
    """Liste courte des livreurs — alimente le menu déroulant d'assignation
    sur une commande."""
    permission_classes = [EstAdmin]

    def get(self, request):
        livreurs = User.objects.filter(role='livreur', is_active=True)
        return Response(LivreurSerializer(livreurs, many=True).data, status=status.HTTP_200_OK)


class ProduitsAdminView(APIView):
    """Modération des annonces — liste complète, filtrable par ?q= (titre)."""
    permission_classes = [EstAdmin]

    def get(self, request):
        produits = Produit.objects.select_related('boutique', 'categorie').order_by('-date_ajout')
        q = request.query_params.get('q')
        if q:
            produits = produits.filter(titre__icontains=q)
        serializer = ProduitAdminSerializer(produits, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProduitAdminDetailView(APIView):
    """Retrait d'une annonce par la modération (contenu inapproprié,
    signalement...) et bascule disponible/loué — utile pour la location :
    une fois l'entente conclue via WhatsApp et la remise effectuée, l'admin
    (ou la vendeuse depuis son propre tableau de bord) peut marquer
    l'article comme loué. Contrairement à la vendeuse, l'admin peut
    supprimer même si des commandes existent — Commande.produit utilise
    PROTECT, donc on masque plutôt que casser l'intégrité si une vente est
    liée."""
    permission_classes = [EstAdmin]

    def patch(self, request, pk):
        produit = get_object_or_404(Produit, pk=pk)
        if 'disponible' in request.data:
            produit.disponible = bool(request.data.get('disponible'))
            produit.save(update_fields=['disponible'])
        return Response(ProduitAdminSerializer(produit, context={'request': request}).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        produit = get_object_or_404(Produit, pk=pk)
        if Commande.objects.filter(produit=produit).exclude(statut='annule').exists():
            produit.disponible = False
            produit.save(update_fields=['disponible'])
            return Response(
                {"message": "Cet article a des commandes associées : il a été masqué plutôt que supprimé."},
                status=status.HTTP_200_OK,
            )
        produit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommandesAdminView(APIView):
    """Toutes les commandes de la marketplace — filtrable par ?statut=,
    ?type=vente|location, ?periode=7j|30j, ?q=<recherche libre>."""
    permission_classes = [EstAdmin]

    def get(self, request):
        commandes = Commande.objects.select_related('produit', 'produit__boutique', 'acheteur', 'livreur').order_by('-date_commande')

        statut = request.query_params.get('statut')
        if statut:
            commandes = commandes.filter(statut=statut)

        type_offre = request.query_params.get('type')
        if type_offre in ('vente', 'location'):
            commandes = commandes.filter(produit__type_offre=type_offre)

        periode = request.query_params.get('periode')
        if periode in ('7j', '30j'):
            nb_jours = 7 if periode == '7j' else 30
            commandes = commandes.filter(date_commande__gte=timezone.now() - timedelta(days=nb_jours))

        q = request.query_params.get('q')
        if q:
            commandes = commandes.filter(
                Q(produit__titre__icontains=q) | Q(acheteur__username__icontains=q)
                | Q(produit__boutique__nom_boutique__icontains=q) | Q(id__icontains=q)
            )

        serializer = CommandeAdminSerializer(commandes, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CommandeAdminDetailView(APIView):
    """Mise à jour manuelle d'une commande : changer son statut, lui
    assigner un livreur, et — pour une location — ajuster manuellement la
    durée (prolongation/écourtement) ou traiter le remboursement de caution."""
    permission_classes = [EstAdmin]

    def patch(self, request, pk):
        commande = get_object_or_404(Commande, pk=pk)

        statut = request.data.get('statut')
        if statut is not None:
            if statut not in dict(Commande.STATUT_CHOICES):
                return Response({"statut": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)
            commande.statut = statut

        if 'livreur_id' in request.data:
            livreur_id = request.data.get('livreur_id')
            if livreur_id in (None, '', 'null'):
                commande.livreur = None
            else:
                livreur = get_object_or_404(User, pk=livreur_id, role='livreur')
                commande.livreur = livreur

        # Ajustement manuel de la durée de location — l'admin est seul
        # décisionnaire d'une prolongation ou d'un écourtement, pas de
        # recalcul automatique du prix ici (à ajuster à la main si besoin).
        if 'date_debut_location' in request.data:
            commande.date_debut_location = parse_date(request.data.get('date_debut_location') or '') or None
        if 'date_fin_location' in request.data:
            commande.date_fin_location = parse_date(request.data.get('date_fin_location') or '') or None
        if 'caution_remboursee' in request.data:
            commande.caution_remboursee = str(request.data.get('caution_remboursee')).lower() in ('true', '1')

        commande.save()
        return Response(CommandeAdminSerializer(commande, context={'request': request}).data, status=status.HTTP_200_OK)


class CategoriesAdminView(APIView):
    """Liste + création de catégories (avec upload d'image)."""
    permission_classes = [EstAdmin]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        categories = Categorie.objects.all()
        return Response(CategorieAdminSerializer(categories, many=True, context={'request': request}).data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CategorieAdminSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategorieAdminDetailView(APIView):
    """Édition / suppression d'une catégorie existante."""
    permission_classes = [EstAdmin]
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request, pk):
        categorie = get_object_or_404(Categorie, pk=pk)
        serializer = CategorieAdminSerializer(categorie, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        categorie = get_object_or_404(Categorie, pk=pk)
        if categorie.produits.exists():
            return Response(
                {"general": "Cette catégorie contient des articles, vous ne pouvez pas la supprimer."},
                status=status.HTTP_409_CONFLICT,
            )
        categorie.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# E-BOOK
# ==========================================
class EbookAdminView(APIView):
    """Liste + création — upload de la couverture, de l'aperçu et du PDF
    complet en une seule requête (multipart)."""
    permission_classes = [EstAdmin]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        ebooks = Ebook.objects.order_by('-date_creation')
        return Response(EbookAdminSerializer(ebooks, many=True, context={'request': request}).data, status=status.HTTP_200_OK)

    def post(self, request):
        # ATTENTION : ne jamais appeler request.data.copy() sur une requête
        # multipart — Django tente un deepcopy des fichiers uploadés, qui ne
        # sont pas copiables (TypeError: cannot pickle 'BufferedRandom').
        serializer = EbookAdminSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # DRF traite un booléen absent du multipart comme False, pas
            # comme le défaut du modèle — un nouvel e-book doit démarrer
            # actif tant que la vendeuse n'a pas explicitement décoché la case.
            if 'actif' in request.data:
                actif = str(request.data.get('actif')).lower() in ('true', '1', 'on')
            else:
                actif = True
            serializer.save(actif=actif)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EbookAdminDetailView(APIView):
    """Édition (peut inclure le remplacement d'un seul fichier à la fois,
    les autres champs restent inchangés grâce à partial=True) et suppression."""
    permission_classes = [EstAdmin]
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request, pk):
        ebook = get_object_or_404(Ebook, pk=pk)
        serializer = EbookAdminSerializer(ebook, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        ebook = get_object_or_404(Ebook, pk=pk)
        if ebook.achats.filter(statut_paiement='paye').exists():
            return Response(
                {"general": "Des achats payés sont liés à cet e-book, vous ne pouvez pas le supprimer. Désactivez-le plutôt."},
                status=status.HTTP_409_CONFLICT,
            )
        ebook.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AchatsEbookAdminView(APIView):
    """Liste des achats (pour suivre les ventes / renvoyer un lien en cas de souci)."""
    permission_classes = [EstAdmin]

    def get(self, request):
        achats = AchatEbook.objects.select_related('ebook').order_by('-date_creation')
        return Response(AchatEbookSerializer(achats, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


# ==========================================
# CENTRE DE PLAINTE — CÔTÉ ADMIN
# ==========================================
class PlaintesAdminView(APIView):
    """Liste de toutes les plaintes, filtrable par ?statut=."""
    permission_classes = [EstAdmin]

    def get(self, request):
        plaintes = Plainte.objects.select_related('acheteur', 'commande__produit').order_by('-date_creation')
        statut = request.query_params.get('statut')
        if statut:
            plaintes = plaintes.filter(statut=statut)
        return Response(PlainteSerializer(plaintes, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


class PlainteAdminDetailView(APIView):
    """Traiter une plainte : changer son statut et/ou y répondre."""
    permission_classes = [EstAdmin]

    def patch(self, request, pk):
        plainte = get_object_or_404(Plainte, pk=pk)
        nouveau_statut = request.data.get('statut')
        reponse = request.data.get('reponse_admin')

        if nouveau_statut and nouveau_statut not in dict(Plainte.STATUT_CHOICES):
            return Response({"statut": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if nouveau_statut:
            plainte.statut = nouveau_statut
        if reponse is not None:
            plainte.reponse_admin = reponse
            from django.utils import timezone
            plainte.date_reponse = timezone.now()
        plainte.save()
        return Response(PlainteSerializer(plainte, context={'request': request}).data, status=status.HTTP_200_OK)
