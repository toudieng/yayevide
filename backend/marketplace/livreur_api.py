"""
marketplace/livreur_api.py

API du dashboard livreur : ses livraisons en cours, son historique, et la
mise à jour de statut d'une livraison qui lui est assignée.
"""
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Commande
from .permissions import EstLivreur
from .serializers import CommandeAdminSerializer
from .services.intouch import intouch_service

# Une livraison "active" est une commande confirmée par la vendeuse,
# assignée à ce livreur, pas encore livrée ni annulée.
STATUTS_ACTIFS = ['confirme', 'en_cours_livraison']


class MesLivraisonsView(APIView):
    """Livraisons assignées au livreur connecté — par défaut seulement les
    actives (à récupérer / en cours), mais ?statut=livre|annule|tous permet
    de voir aussi les livraisons terminées ou annulées. Filtrable en plus
    par ?zone= et ?date=AAAA-MM-JJ."""
    permission_classes = [EstLivreur]

    def get(self, request):
        commandes = (
            Commande.objects
            .filter(livreur=request.user)
            .select_related('produit', 'produit__boutique', 'acheteur')
            .order_by('date_commande')
        )

        statut = request.query_params.get('statut', 'actives')
        if statut == 'actives':
            commandes = commandes.filter(statut__in=STATUTS_ACTIFS)
        elif statut == 'livre':
            commandes = commandes.filter(statut='livre')
        elif statut == 'annule':
            commandes = commandes.filter(statut__in=['annule', 'indisponible'])
        elif statut != 'tous':
            commandes = commandes.filter(statut=statut)

        zone = request.query_params.get('zone')
        if zone:
            commandes = commandes.filter(zone_livraison=zone)

        date = request.query_params.get('date')
        if date:
            commandes = commandes.filter(date_commande__date=date)

        return Response(CommandeAdminSerializer(commandes, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


class LivraisonsDisponiblesView(APIView):
    """Commandes confirmées par la vendeuse, pas encore assignées à un
    livreur, dans la zone couverte par le livreur connecté — permet aux
    livreurs de récupérer eux-mêmes des livraisons plutôt que d'attendre
    une assignation manuelle par l'admin."""
    permission_classes = [EstLivreur]

    def get(self, request):
        if not request.user.zone_livreur:
            return Response([], status=status.HTTP_200_OK)
        commandes = (
            Commande.objects
            .filter(statut='confirme', livreur__isnull=True, zone_livraison=request.user.zone_livreur)
            .select_related('produit', 'produit__boutique', 'acheteur')
            .order_by('date_commande')
        )
        return Response(CommandeAdminSerializer(commandes, many=True, context={'request': request}).data, status=status.HTTP_200_OK)


class PrendreEnChargeLivraisonView(APIView):
    """Le livreur s'auto-assigne une livraison disponible dans sa zone."""
    permission_classes = [EstLivreur]

    def patch(self, request, pk):
        commande = get_object_or_404(
            Commande, pk=pk, statut='confirme', livreur__isnull=True, zone_livraison=request.user.zone_livreur,
        )
        commande.livreur = request.user
        commande.save(update_fields=['livreur'])
        return Response(CommandeAdminSerializer(commande, context={'request': request}).data, status=status.HTTP_200_OK)


class LivreurStatsJourView(APIView):
    """Nombre de livraisons effectuées aujourd'hui par le livreur connecté —
    alimente la carte "Livrées aujourd'hui" du tableau de bord."""
    permission_classes = [EstLivreur]

    def get(self, request):
        debut_jour = timezone.localtime().replace(hour=0, minute=0, second=0, microsecond=0)
        du_jour = Commande.objects.filter(
            livreur=request.user, statut='livre', date_paiement__gte=debut_jour,
        )
        nb = du_jour.count()
        revenus = du_jour.aggregate(t=Sum('part_livreur'))['t'] or 0
        return Response({'livrees_aujourdhui': nb, 'revenus_aujourdhui': revenus}, status=status.HTTP_200_OK)


class HistoriqueLivraisonsView(APIView):
    """Livraisons déjà effectuées par le livreur connecté."""
    permission_classes = [EstLivreur]

    def get(self, request):
        commandes = (
            Commande.objects
            .filter(livreur=request.user, statut='livre')
            .select_related('produit', 'produit__boutique', 'acheteur')
            .order_by('-date_commande')
        )
        stats = {
            "nb_livraisons_total": commandes.count(),
            "nb_livraisons_mois": commandes.filter(
                date_commande__year=timezone.now().year,
                date_commande__month=timezone.now().month,
            ).count(),
        }
        return Response({
            "commandes": CommandeAdminSerializer(commandes, many=True, context={'request': request}).data,
            "stats": stats,
        }, status=status.HTTP_200_OK)


class LivraisonStatutView(APIView):
    """Le livreur fait progresser SA livraison : confirmé -> en cours ->
    livré. On vérifie systématiquement que la commande lui est bien
    assignée pour qu'un livreur ne puisse pas modifier les livraisons d'un
    collègue. Passer à 'livre' déclenche l'encaissement réel (espèces,
    Wave, Orange Money ou Mixx by Yas selon ce que l'acheteuse a réellement donné sur
    place — peut différer du mode choisi à la commande)."""
    permission_classes = [EstLivreur]

    TRANSITIONS_AUTORISEES = {
        'confirme': ['en_cours_livraison'],
        'en_cours_livraison': ['livre'],
    }

    def patch(self, request, pk):
        commande = get_object_or_404(Commande, pk=pk, livreur=request.user)
        nouveau_statut = request.data.get('statut')

        transitions_possibles = self.TRANSITIONS_AUTORISEES.get(commande.statut, [])
        if nouveau_statut not in transitions_possibles:
            return Response(
                {"statut": f"Impossible de passer de '{commande.statut}' à '{nouveau_statut}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if nouveau_statut == 'livre':
            mode_reel = request.data.get('mode_paiement_reel') or commande.mode_paiement_choisi

            if mode_reel in ('wave', 'orange_money', 'mixx'):
                # Le paiement passe par InTouch UNIQUEMENT à cet instant —
                # jamais avant, la commande elle-même ne déclenche aucun
                # paiement en ligne (cf. Commande.STATUT_CHOICES).
                resultat = intouch_service.initier_paiement_livraison(commande, mode_reel)
                if not resultat.get('succes'):
                    return Response(
                        {"general": "Le paiement InTouch a échoué — la livraison n'est pas confirmée tant que le paiement n'est pas passé."},
                        status=status.HTTP_402_PAYMENT_REQUIRED,
                    )
                commande.marquer_livree(mode_paiement_reel=mode_reel, reference_paiement=resultat['reference'])
            else:
                # Espèces : rien à faire passer par InTouch, l'argent est
                # déjà dans la main du livreur.
                commande.marquer_livree(mode_paiement_reel=mode_reel)
        else:
            commande.statut = nouveau_statut
            commande.save(update_fields=['statut'])

        return Response(CommandeAdminSerializer(commande, context={'request': request}).data, status=status.HTTP_200_OK)


class MesRevenusLivreurView(APIView):
    """Revenus du livreur — 75% des frais de livraison de chaque commande
    qu'il a effectivement livrée lui reviennent (les 25% restants vont à
    Yaay Vidé : logistique, assurance des litiges...)."""
    permission_classes = [EstLivreur]

    def get(self, request):
        maintenant = timezone.now()
        livrees = (
            Commande.objects
            .filter(livreur=request.user, statut='livre')
            .select_related('produit', 'produit__boutique')
            .order_by('-date_paiement')
        )
        livrees_mois = livrees.filter(date_paiement__year=maintenant.year, date_paiement__month=maintenant.month)
        livrees_jour = livrees.filter(date_paiement__date=maintenant.date())

        from django.db.models import Sum
        stats = {
            "revenu_total": livrees.aggregate(t=Sum('part_livreur'))['t'] or 0,
            "revenu_mois": livrees_mois.aggregate(t=Sum('part_livreur'))['t'] or 0,
            "revenu_jour": livrees_jour.aggregate(t=Sum('part_livreur'))['t'] or 0,
            "nb_livraisons_total": livrees.count(),
            "nb_livraisons_mois": livrees_mois.count(),
        }
        return Response({
            "stats": stats,
            "livraisons": CommandeAdminSerializer(livrees[:30], many=True, context={'request': request}).data,
        }, status=status.HTTP_200_OK)


class NotificationsLivreurView(APIView):
    """Pas un vrai système de notifications push (cf. même avertissement
    que pour les vendeuses) — juste un fil chronologique des livraisons
    récemment assignées ou terminées, pour qu'il y ait quelque chose à
    consulter ici en attendant une vraie intégration push/SMS."""
    permission_classes = [EstLivreur]

    def get(self, request):
        recentes = (
            Commande.objects
            .filter(livreur=request.user)
            .select_related('produit')
            .order_by('-date_commande')[:20]
        )
        evenements = []
        for c in recentes:
            evenements.append({
                "texte": f"Livraison assignée : {c.produit.titre}",
                "date": c.date_commande,
                "type": "assignation",
            })
            if c.statut == 'livre' and c.date_paiement:
                evenements.append({
                    "texte": f"Livraison terminée : {c.produit.titre} (+{c.part_livreur} FCFA)",
                    "date": c.date_paiement,
                    "type": "livraison",
                })
        evenements.sort(key=lambda e: e['date'], reverse=True)
        return Response(evenements[:25], status=status.HTTP_200_OK)
