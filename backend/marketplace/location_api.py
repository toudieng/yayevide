"""
Parcours complet de la location, entièrement sur le site.

1. Réservation   : la locataire choisit ses dates ; celles déjà prises sont
                   bloquées (GET /api/produits/<id>/reservations/ + contrôle
                   au moment de la commande, cf. PasserCommandeView).
2. Confirmation  : la vendeuse accepte, refuse, ou PROPOSE D'AUTRES DATES ;
                   la locataire accepte (la location est confirmée aux
                   nouvelles dates) ou refuse (annulée, dates libérées).
3. Livraison     : comme une vente (livreur, encaissement à la remise).
4. Pendant       : la locataire peut demander une prolongation, que la
                   vendeuse accepte ou refuse ; les jours ajoutés sont
                   encaissés par le livreur au moment du retour.
5. Retour        : à la date de fin, un livreur récupère l'article chez la
                   locataire et le dépose chez Yaay Vidé.
6. Caution       : l'équipe contrôle l'article et rend la caution, en
                   totalité ou en partie (retenue + motif visible).

Les e-mails de suivi partent à chaque étape (fail_silently : un souci
d'e-mail ne bloque jamais l'action).
"""
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Commande, Produit, User
from .permissions import EstAdmin, EstLivreur
from .serializers import CommandeAdminSerializer, CommandeSerializer

# Statuts pendant lesquels les dates d'une location sont « prises »
STATUTS_OCCUPANT = [
    'en_attente_confirmation', 'contre_proposition', 'confirme', 'en_cours_livraison',
    'livre', 'retour_a_collecter', 'retour_en_cours', 'retour_controle',
]


# ------------------------------------------------------------------ outils
def formater(d):
    return d.strftime('%d/%m/%Y') if d else ''


def notifier(user, sujet, texte, lien='/mon-compte'):
    """E-mail de suivi de location (jamais bloquant)."""
    if not user or not user.email:
        return
    send_mail(
        subject=sujet,
        message=f"Bonjour,\n\n{texte}\n\nSuivre sur Yaay Vidé : {settings.FRONTEND_URL}{lien}\n\nL'équipe Yaay Vidé",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def periode_effective(commande):
    """Dates réellement bloquées par une location selon son statut."""
    if commande.statut == 'contre_proposition' and commande.date_debut_proposee:
        return commande.date_debut_proposee, commande.date_fin_proposee
    fin = commande.date_fin_location
    if commande.prolongation_statut == 'demandee' and commande.prolongation_date_fin:
        fin = max(fin, commande.prolongation_date_fin)
    return commande.date_debut_location, fin


def periodes_occupees(produit, exclure_id=None):
    commandes = Commande.objects.filter(
        produit=produit, statut__in=STATUTS_OCCUPANT, date_debut_location__isnull=False,
    )
    if exclure_id:
        commandes = commandes.exclude(pk=exclure_id)
    return [periode_effective(c) for c in commandes]


def chevauche(produit, debut, fin, exclure_id=None):
    """Vrai si [debut, fin] touche une location déjà prise (pas de passage
    de relais le même jour : l'article doit d'abord être contrôlé)."""
    return any(debut <= f and d <= fin for d, f in periodes_occupees(produit, exclure_id) if d and f)


def valider_dates(produit, debut, fin, exclure_id=None, depuis=None):
    """Renvoie un message d'erreur, ou None si les dates conviennent."""
    if not debut or not fin:
        return "Choisissez une date de début et une date de fin."
    if fin <= debut:
        return "La date de fin doit être après la date de début."
    if debut < (depuis or timezone.localdate()):
        return "Les dates doivent être dans le futur."
    if chevauche(produit, debut, fin, exclure_id):
        return "Ces dates sont déjà réservées pour cet article. Choisissez d'autres dates."
    return None


def location_de_la_vendeuse(request, pk):
    return get_object_or_404(
        Commande.objects.select_related('produit__boutique__vendeur', 'acheteur'),
        pk=pk, produit__boutique__vendeur=request.user, produit__type_offre='location',
    )


def location_de_la_locataire(request, pk):
    return get_object_or_404(
        Commande.objects.select_related('produit__boutique__vendeur', 'acheteur'),
        pk=pk, acheteur=request.user, produit__type_offre='location',
    )


def json_commande(commande, request, admin=False):
    serializer = CommandeAdminSerializer if admin else CommandeSerializer
    return serializer(commande, context={'request': request}).data


# --------------------------------------------------------- 1. réservation
class ReservationsProduitView(APIView):
    """Périodes déjà réservées d'un article à louer (sans aucune donnée
    personnelle), pour griser le calendrier."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        produit = get_object_or_404(Produit, pk=pk)
        periodes = [
            {'debut': d, 'fin': f}
            for d, f in periodes_occupees(produit)
            if d and f and f >= timezone.localdate()
        ]
        periodes.sort(key=lambda p: p['debut'])
        return Response(periodes, status=status.HTTP_200_OK)


# ------------------------------------------- 2. contre-proposition de dates
class ContrePropositionView(APIView):
    """La vendeuse propose d'autres dates à la place de celles demandées."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        commande = location_de_la_vendeuse(request, pk)
        if commande.statut != 'en_attente_confirmation':
            return Response({"general": "Cette demande n'attend plus de réponse."}, status=status.HTTP_400_BAD_REQUEST)
        debut = parse_date(request.data.get('date_debut') or '')
        fin = parse_date(request.data.get('date_fin') or '')
        erreur = valider_dates(commande.produit, debut, fin, exclure_id=commande.pk)
        if erreur:
            return Response({"dates": erreur}, status=status.HTTP_400_BAD_REQUEST)
        if debut == commande.date_debut_location and fin == commande.date_fin_location:
            return Response(
                {"dates": "Ce sont les dates demandées : acceptez simplement la demande."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        commande.date_debut_proposee, commande.date_fin_proposee = debut, fin
        commande.statut = 'contre_proposition'
        commande.save(update_fields=['date_debut_proposee', 'date_fin_proposee', 'statut'])
        jours = (fin - debut).days
        notifier(
            commande.acheteur,
            f"Nouvelles dates proposées pour « {commande.produit.titre} »",
            f"La vendeuse ne peut pas louer « {commande.produit.titre} » aux dates demandées "
            f"({formater(commande.date_debut_location)} → {formater(commande.date_fin_location)}).\n"
            f"Elle vous propose : du {formater(debut)} au {formater(fin)} ({jours} jour{'s' if jours > 1 else ''}).\n"
            f"Acceptez ou refusez cette proposition depuis votre compte, rubrique Locations.",
        )
        return Response(json_commande(commande, request), status=status.HTTP_200_OK)


class ReponsePropositionView(APIView):
    """La locataire accepte (location confirmée aux nouvelles dates) ou
    refuse (location annulée, dates à nouveau libres)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        commande = location_de_la_locataire(request, pk)
        if commande.statut != 'contre_proposition':
            return Response({"general": "Aucune proposition en attente pour cette location."}, status=status.HTTP_400_BAD_REQUEST)
        vendeuse = commande.produit.boutique.vendeur
        accepter = request.data.get('accepter') is True

        if accepter:
            debut, fin = commande.date_debut_proposee, commande.date_fin_proposee
            # Les dates ont pu être prises entre-temps, ou être déjà passées
            erreur = valider_dates(commande.produit, debut, fin, exclure_id=commande.pk)
            if erreur:
                return Response({"dates": erreur}, status=status.HTTP_400_BAD_REQUEST)
            jours = (fin - debut).days
            commande.date_debut_location, commande.date_fin_location = debut, fin
            commande.prix_total_paye = commande.produit.prix_final_public * jours + commande.caution_demandee
            commande.statut = 'confirme'
            commande.date_debut_proposee = commande.date_fin_proposee = None
            commande.save()
            notifier(
                vendeuse,
                f"Location acceptée : « {commande.produit.titre} »",
                f"La locataire a accepté vos dates : du {formater(debut)} au {formater(fin)}. "
                f"La location est confirmée et va être organisée par Yaay Vidé.",
                lien='/vendeuse/locations',
            )
        else:
            commande.statut = 'annule'
            commande.statut_paiement = 'annule'
            commande.save(update_fields=['statut', 'statut_paiement'])
            notifier(
                vendeuse,
                f"Proposition refusée : « {commande.produit.titre} »",
                "La locataire n'a pas accepté les dates proposées. La demande est annulée "
                "et l'article est de nouveau disponible à la location.",
                lien='/vendeuse/locations',
            )
        return Response(json_commande(commande, request), status=status.HTTP_200_OK)


class AnnulerDemandeLocationView(APIView):
    """La locataire retire sa demande tant qu'elle n'est pas confirmée."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        commande = location_de_la_locataire(request, pk)
        if commande.statut not in ('en_attente_confirmation', 'contre_proposition'):
            return Response({"general": "Cette location ne peut plus être annulée en ligne."}, status=status.HTTP_400_BAD_REQUEST)
        commande.statut = 'annule'
        commande.statut_paiement = 'annule'
        commande.save(update_fields=['statut', 'statut_paiement'])
        notifier(
            commande.produit.boutique.vendeur,
            f"Demande de location annulée : « {commande.produit.titre} »",
            "La locataire a retiré sa demande. L'article est de nouveau disponible.",
            lien='/vendeuse/locations',
        )
        return Response(json_commande(commande, request), status=status.HTTP_200_OK)


# ------------------------------------------------------- 4. prolongation
class DemanderProlongationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        commande = location_de_la_locataire(request, pk)
        if commande.statut != 'livre':
            return Response({"general": "Une prolongation se demande pendant la location."}, status=status.HTTP_400_BAD_REQUEST)
        if commande.prolongation_statut == 'demandee':
            return Response({"general": "Une demande de prolongation est déjà en attente."}, status=status.HTTP_400_BAD_REQUEST)
        nouvelle_fin = parse_date(request.data.get('date_fin') or '')
        if not nouvelle_fin or nouvelle_fin <= commande.date_fin_location:
            return Response({"date_fin": "Choisissez une date après la fin actuelle de la location."}, status=status.HTTP_400_BAD_REQUEST)
        # Les jours ajoutés ne doivent pas empiéter sur une autre réservation
        if chevauche(commande.produit, commande.date_fin_location + timedelta(days=1), nouvelle_fin, exclure_id=commande.pk):
            return Response({"date_fin": "L'article est déjà réservé sur cette période. Choisissez une date plus proche."}, status=status.HTTP_400_BAD_REQUEST)
        commande.prolongation_statut = 'demandee'
        commande.prolongation_date_fin = nouvelle_fin
        commande.save(update_fields=['prolongation_statut', 'prolongation_date_fin'])
        jours = (nouvelle_fin - commande.date_fin_location).days
        notifier(
            commande.produit.boutique.vendeur,
            f"Demande de prolongation : « {commande.produit.titre} »",
            f"La locataire souhaite garder l'article {jours} jour{'s' if jours > 1 else ''} de plus, "
            f"jusqu'au {formater(nouvelle_fin)}. Acceptez ou refusez depuis votre espace, rubrique Locations.",
            lien='/vendeuse/locations',
        )
        return Response(json_commande(commande, request), status=status.HTTP_200_OK)


class RepondreProlongationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        commande = location_de_la_vendeuse(request, pk)
        if commande.prolongation_statut != 'demandee':
            return Response({"general": "Aucune demande de prolongation en attente."}, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('accepter') is True:
            jours = (commande.prolongation_date_fin - commande.date_fin_location).days
            supplement = commande.produit.prix_final_public * jours
            commande.date_fin_location = commande.prolongation_date_fin
            commande.jours_prolongation += jours
            commande.supplement_prolongation += Decimal(supplement)
            commande.prix_total_paye += Decimal(supplement)
            commande.prolongation_statut = 'acceptee'
            commande.rappel_fin_envoye = False
            texte = (
                f"Bonne nouvelle : la vendeuse accepte la prolongation jusqu'au {formater(commande.date_fin_location)}. "
                f"Les {jours} jour{'s' if jours > 1 else ''} ajouté{'s' if jours > 1 else ''} ({int(supplement)} FCFA) "
                f"seront à régler au livreur au moment du retour."
            )
        else:
            commande.prolongation_statut = 'refusee'
            texte = (
                f"La vendeuse ne peut pas prolonger la location. L'article reste à rendre le "
                f"{formater(commande.date_fin_location)} : un livreur Yaay Vidé passera le récupérer."
            )
        commande.prolongation_date_fin = None
        commande.save()
        notifier(commande.acheteur, f"Prolongation de « {commande.produit.titre} »", texte)
        return Response(json_commande(commande, request), status=status.HTTP_200_OK)


# --------------------------------------------------------------- 5. retour
def passer_en_retour(commande, livreur=None):
    """Location arrivée à son terme : le retour est à récupérer."""
    commande.statut = 'retour_a_collecter'
    if livreur is not None:
        commande.livreur_retour = livreur
    commande.save(update_fields=['statut', 'livreur_retour'])
    notifier(
        commande.acheteur,
        f"Retour de « {commande.produit.titre} »",
        "Votre location est terminée : un livreur Yaay Vidé va passer récupérer l'article "
        "à votre adresse de livraison. Merci de le préparer, avec ses accessoires.",
    )


class RetoursLivreurView(APIView):
    """Retours de location : ceux qui me sont assignés + ceux à prendre dans ma zone."""
    permission_classes = [EstLivreur]

    def get(self, request):
        mes_retours = Commande.objects.filter(
            livreur_retour=request.user, statut__in=['retour_a_collecter', 'retour_en_cours'],
        )
        disponibles = Commande.objects.none()
        if request.user.zone_livreur:
            disponibles = Commande.objects.filter(
                statut='retour_a_collecter', livreur_retour__isnull=True, zone_livraison=request.user.zone_livreur,
            )
        relations = ('produit__boutique__vendeur', 'acheteur', 'livreur_retour')
        return Response(
            {
                'mes_retours': [json_commande(c, request, admin=True) for c in mes_retours.select_related(*relations)],
                'disponibles': [json_commande(c, request, admin=True) for c in disponibles.select_related(*relations)],
            },
            status=status.HTTP_200_OK,
        )


class RetourLivreurActionView(APIView):
    """prendre (s'assigner) -> recupere (chez la locataire) -> depose (chez Yaay Vidé)."""
    permission_classes = [EstLivreur]

    def patch(self, request, pk):
        action = request.data.get('action')
        with transaction.atomic():
            commande = get_object_or_404(Commande.objects.select_for_update(), pk=pk, date_debut_location__isnull=False)
            if action == 'prendre':
                if commande.statut != 'retour_a_collecter' or commande.livreur_retour_id:
                    return Response({"general": "Ce retour n'est plus disponible."}, status=status.HTTP_400_BAD_REQUEST)
                commande.livreur_retour = request.user
                commande.save(update_fields=['livreur_retour'])
            elif action in ('recupere', 'depose'):
                if commande.livreur_retour_id != request.user.pk:
                    return Response({"general": "Ce retour ne vous est pas assigné."}, status=status.HTTP_403_FORBIDDEN)
                if action == 'recupere':
                    if commande.statut != 'retour_a_collecter':
                        return Response({"general": "Étape déjà passée."}, status=status.HTTP_400_BAD_REQUEST)
                    commande.statut = 'retour_en_cours'
                    # Jours de prolongation encaissés maintenant : la commission
                    # Yaay Vidé et la part vendeuse sont complétées.
                    if commande.supplement_prolongation and not commande.supplement_paye:
                        base = commande.produit.prix_vendeur * commande.jours_prolongation
                        commission = round(base * Decimal(str(commande.produit.taux_commission)))
                        commande.commission_plateforme = (commande.commission_plateforme or 0) + commission
                        commande.montant_net_vendeuse = (commande.montant_net_vendeuse or 0) + base - commission
                        commande.supplement_paye = True
                    commande.save()
                else:
                    if commande.statut != 'retour_en_cours':
                        return Response({"general": "Récupérez d'abord l'article chez la locataire."}, status=status.HTTP_400_BAD_REQUEST)
                    commande.statut = 'retour_controle'
                    commande.save(update_fields=['statut'])
            else:
                return Response({"action": "Action inconnue."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(json_commande(commande, request, admin=True), status=status.HTTP_200_OK)


# ------------------------------------------------ côté équipe (admin)
class PlanifierRetourAdminView(APIView):
    """L'équipe lance le retour (sans attendre la date de fin) et peut
    l'assigner directement à un livreur."""
    permission_classes = [EstAdmin]

    def post(self, request, pk):
        commande = get_object_or_404(Commande, pk=pk, date_debut_location__isnull=False)
        if commande.statut not in ('livre', 'retour_a_collecter'):
            return Response({"general": "La location doit être en cours pour organiser le retour."}, status=status.HTTP_400_BAD_REQUEST)
        livreur = None
        if request.data.get('livreur_id'):
            livreur = get_object_or_404(User, pk=request.data.get('livreur_id'), role='livreur')
        if commande.statut == 'livre':
            passer_en_retour(commande, livreur)
        elif livreur is not None:
            commande.livreur_retour = livreur
            commande.save(update_fields=['livreur_retour'])
        return Response(json_commande(commande, request, admin=True), status=status.HTTP_200_OK)


class CloturerLocationAdminView(APIView):
    """Contrôle terminé : caution rendue en totalité, ou retenue en partie
    avec un motif que la locataire verra."""
    permission_classes = [EstAdmin]

    def post(self, request, pk):
        commande = get_object_or_404(Commande.objects.select_related('acheteur', 'produit'), pk=pk, date_debut_location__isnull=False)
        if commande.statut not in ('retour_controle', 'retour_en_cours'):
            return Response({"general": "L'article doit être revenu chez Yaay Vidé pour clôturer la location."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            retenue = Decimal(str(request.data.get('caution_retenue') or 0))
        except Exception:
            return Response({"caution_retenue": "Montant invalide."}, status=status.HTTP_400_BAD_REQUEST)
        motif = (request.data.get('motif_retenue') or '').strip()
        if retenue < 0 or retenue > commande.caution_demandee:
            return Response({"caution_retenue": "La retenue doit être comprise entre 0 et le montant de la caution."}, status=status.HTTP_400_BAD_REQUEST)
        if retenue > 0 and not motif:
            return Response({"motif_retenue": "Expliquez à la locataire pourquoi une partie de la caution est retenue."}, status=status.HTTP_400_BAD_REQUEST)

        commande.caution_retenue = retenue
        commande.motif_retenue = motif
        commande.caution_remboursee = True
        commande.caution_traitee_le = timezone.now()
        commande.statut = 'terminee'
        commande.save()

        rendu = commande.caution_demandee - retenue
        if retenue > 0:
            texte = (
                f"L'article « {commande.produit.titre} » a bien été contrôlé.\n"
                f"Caution : {int(commande.caution_demandee)} FCFA — retenue : {int(retenue)} FCFA — "
                f"rendue : {int(rendu)} FCFA.\nMotif de la retenue : {motif}\n"
                f"L'équipe vous rembourse par Wave, Orange Money, Mixx by Yas ou en espèces."
            )
        else:
            texte = (
                f"L'article « {commande.produit.titre} » a bien été contrôlé : tout est en ordre.\n"
                f"Votre caution de {int(rendu)} FCFA vous est rendue en totalité par l'équipe "
                f"(Wave, Orange Money, Mixx by Yas ou espèces). Merci pour votre location !"
            )
        notifier(commande.acheteur, f"Caution de « {commande.produit.titre} »", texte)
        return Response(json_commande(commande, request, admin=True), status=status.HTTP_200_OK)


# ------------------------------------------------ tâche quotidienne
def traitement_quotidien(aujourdhui=None):
    """À lancer chaque jour (commande `python manage.py locations_quotidien`) :
    rappel la veille de la fin, puis passage en « retour à récupérer » le
    jour de la fin. Renvoie (nb_rappels, nb_retours)."""
    aujourdhui = aujourdhui or timezone.localdate()
    demain = aujourdhui + timedelta(days=1)

    rappels = Commande.objects.filter(
        statut='livre', date_fin_location=demain, rappel_fin_envoye=False,
    ).select_related('acheteur', 'produit')
    nb_rappels = 0
    for commande in rappels:
        notifier(
            commande.acheteur,
            f"Votre location se termine demain : « {commande.produit.titre} »",
            f"Votre location se termine demain ({formater(commande.date_fin_location)}). "
            "Un livreur Yaay Vidé passera récupérer l'article. Besoin de le garder plus longtemps ? "
            "Demandez une prolongation depuis votre compte, rubrique Locations.",
        )
        commande.rappel_fin_envoye = True
        commande.save(update_fields=['rappel_fin_envoye'])
        nb_rappels += 1

    a_rendre = Commande.objects.filter(
        statut='livre', date_fin_location__lte=aujourdhui, date_debut_location__isnull=False,
    ).exclude(prolongation_statut='demandee').select_related('acheteur', 'produit')
    nb_retours = 0
    for commande in a_rendre:
        passer_en_retour(commande)
        nb_retours += 1
    return nb_rappels, nb_retours

