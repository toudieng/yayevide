"""
marketplace/ebook_api.py

Vente de l'e-book Yaay Vidé — un produit numérique vendu par la plateforme
elle-même (pas une vendeuse), donc un circuit séparé de Commande/PasserCommandeView.
Aucun compte requis pour acheter : juste un email pour recevoir le lien de
téléchargement.

Sécurité du téléchargement : le PDF complet n'est JAMAIS exposé tant que
statut_paiement != 'paye'. On ne se contente pas de cacher un bouton côté
interface — TelechargerEbookView vérifie le statut en base à chaque requête.
"""
import logging
import secrets
from django.core.mail import send_mail
from django.http import FileResponse, Http404
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import Ebook, AchatEbook, User
from .permissions import EstAdmin
from .serializers import EbookPublicSerializer, AchatEbookSerializer


class EbookDetailView(APIView):
    """L'e-book actif à afficher sur /ebook — aperçu public uniquement."""
    permission_classes = [AllowAny]

    def get(self, request):
        ebook = Ebook.objects.filter(actif=True).order_by('-date_creation').first()
        if not ebook:
            return Response({"general": "Aucun e-book disponible pour le moment."}, status=status.HTTP_404_NOT_FOUND)
        data = EbookPublicSerializer(ebook, context={'request': request}).data
        # Numéros marchands affichés à l'acheteuse (paiement manuel)
        data['numeros_paiement'] = settings.NUMEROS_PAIEMENT_EBOOK
        return Response(data, status=status.HTTP_200_OK)


logger = logging.getLogger(__name__)

LIBELLES_PAIEMENT = {'wave': 'Wave', 'orange_money': 'Orange Money', 'mixx': 'Mixx by Yas'}


def formater_fcfa(montant):
    return f"{int(montant):,}".replace(',', ' ') + " FCFA"


def lien_telechargement(achat):
    return f"{settings.FRONTEND_URL}/api/ebook/telecharger/{achat.token_telechargement}/"


def envoyer(sujet, texte, destinataires):
    destinataires = [d for d in destinataires if d]
    if not destinataires:
        return
    try:
        send_mail(sujet, texte, settings.DEFAULT_FROM_EMAIL, destinataires, fail_silently=False)
    except Exception:  # un e-mail raté ne doit jamais bloquer l'achat
        logger.exception("Envoi d'e-mail e-book impossible : %s", sujet)


class AcheterEbookView(APIView):
    """Achat de l'e-book par paiement manuel (mobile money), sans compte.

    L'acheteuse envoie le montant sur le numéro marchand du moyen choisi, puis
    soumet ici son e-mail, son numéro et la référence de la transaction.
    L'achat passe « à vérifier » : l'équipe contrôle son relevé et confirme
    dans l'admin (ConfirmerAchatEbookView), ce qui envoie le lien par e-mail.
    Le jeton de téléchargement n'est jamais renvoyé ici.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        ebook_id = request.data.get('ebook_id')
        email = (request.data.get('email') or '').strip()
        telephone = (request.data.get('telephone') or '').strip()
        mode_paiement = request.data.get('mode_paiement', '')
        reference = (request.data.get('reference_client') or '').strip()

        erreurs = {}
        if not email:
            erreurs['email'] = "L'adresse e-mail est requise pour recevoir le lien de téléchargement."
        if mode_paiement not in settings.NUMEROS_PAIEMENT_EBOOK:
            erreurs['mode_paiement'] = "Choisissez Wave, Orange Money ou Mixx by Yas."
        if len(''.join(c for c in telephone if c.isdigit())) < 9:
            erreurs['telephone'] = "Indiquez le numéro qui a envoyé le paiement."
        if len(reference) < 4:
            erreurs['reference_client'] = "Indiquez la référence de la transaction reçue par SMS."
        elif AchatEbook.objects.filter(reference_client__iexact=reference, statut_paiement__in=['a_verifier', 'paye']).exists():
            erreurs['reference_client'] = "Cette référence a déjà été envoyée. Si c'est une erreur, écrivez-nous depuis « Une question ? »."
        if erreurs:
            return Response(erreurs, status=status.HTTP_400_BAD_REQUEST)

        try:
            ebook = Ebook.objects.get(pk=ebook_id, actif=True)
        except (Ebook.DoesNotExist, ValueError, TypeError):
            return Response({"general": "E-book introuvable."}, status=status.HTTP_404_NOT_FOUND)

        achat = AchatEbook.objects.create(
            ebook=ebook,
            email=email,
            telephone=telephone,
            mode_paiement=mode_paiement,
            prix_paye=ebook.prix,
            statut_paiement='a_verifier',
            reference_client=reference[:60],
            token_telechargement=secrets.token_urlsafe(32),
        )

        mode = LIBELLES_PAIEMENT[mode_paiement]
        envoyer(
            "Yaay Vidé — nous vérifions votre paiement",
            f"Bonjour,\n\nMerci pour votre achat du guide « {ebook.titre} » ({formater_fcfa(ebook.prix)}, {mode}).\n"
            f"Nous vérifions votre paiement (référence {achat.reference_client}). Vous recevrez le lien de "
            f"téléchargement par e-mail dès qu'il est confirmé, en général sous 24 h.\n\nL'équipe Yaay Vidé",
            [email],
        )
        equipe = list(User.objects.filter(role='admin', is_active=True).exclude(email='').values_list('email', flat=True))
        envoyer(
            f"E-book : paiement {mode} à vérifier ({formater_fcfa(ebook.prix)})",
            f"Nouvel achat de l'e-book à vérifier.\n\nMoyen : {mode} (numéro {settings.NUMEROS_PAIEMENT_EBOOK[mode_paiement]})\n"
            f"Montant attendu : {formater_fcfa(ebook.prix)}\nRéférence donnée : {achat.reference_client}\n"
            f"Numéro de l'acheteuse : {telephone}\nE-mail : {email}\n\n"
            f"Confirmer ou refuser : {settings.FRONTEND_URL}/admin/ebook",
            equipe,
        )

        return Response({
            "id": achat.id,
            "statut_paiement": achat.statut_paiement,
            "email": achat.email,
            "prix_paye": achat.prix_paye,
        }, status=status.HTTP_201_CREATED)


class ConfirmerAchatEbookView(APIView):
    """L'équipe a retrouvé le paiement sur son relevé : l'achat passe payé et
    le lien de téléchargement part par e-mail."""
    permission_classes = [EstAdmin]

    def post(self, request, pk):
        achat = get_object_or_404(AchatEbook.objects.select_related('ebook'), pk=pk)
        if achat.statut_paiement == 'paye':
            return Response({"general": "Cet achat est déjà confirmé."}, status=status.HTTP_400_BAD_REQUEST)
        achat.confirmer_paiement(reference_paiement=achat.reference_client or f"MANUEL-{achat.pk}")
        envoyer(
            "Yaay Vidé — votre e-book est prêt",
            f"Bonjour,\n\nVotre paiement est confirmé, merci ! Téléchargez le guide « {achat.ebook.titre} » ici :\n"
            f"{lien_telechargement(achat)}\n\nGardez ce lien : il reste valable pour retélécharger votre guide.\n\nL'équipe Yaay Vidé",
            [achat.email],
        )
        return Response(AchatEbookSerializer(achat, context={'request': request}).data, status=status.HTTP_200_OK)


class RefuserAchatEbookView(APIView):
    """Paiement introuvable : l'acheteuse est prévenue par e-mail."""
    permission_classes = [EstAdmin]

    def post(self, request, pk):
        achat = get_object_or_404(AchatEbook.objects.select_related('ebook'), pk=pk)
        if achat.statut_paiement == 'paye':
            return Response({"general": "Un achat confirmé ne peut plus être refusé."}, status=status.HTTP_400_BAD_REQUEST)
        achat.statut_paiement = 'echoue'
        achat.save(update_fields=['statut_paiement'])
        envoyer(
            "Yaay Vidé — paiement non retrouvé",
            f"Bonjour,\n\nNous n'avons pas retrouvé votre paiement pour le guide « {achat.ebook.titre} » "
            f"(référence {achat.reference_client or '—'}). Si vous avez bien payé, répondez-nous depuis "
            f"« Une question ? » sur {settings.FRONTEND_URL}/aide avec une capture du SMS de confirmation, "
            f"et nous régulariserons rapidement.\n\nL'équipe Yaay Vidé",
            [achat.email],
        )
        return Response(AchatEbookSerializer(achat, context={'request': request}).data, status=status.HTTP_200_OK)


class SimulerPaiementEbookView(APIView):
    """Équivalent de SimulerPaiementView mais pour l'e-book — DEBUG uniquement."""
    permission_classes = [AllowAny]

    def post(self, request):
        if not settings.DEBUG:
            return Response({"general": "Indisponible en production."}, status=status.HTTP_403_FORBIDDEN)

        reference = request.data.get('reference_paiement')
        try:
            achat = AchatEbook.objects.get(reference_paiement=reference)
        except AchatEbook.DoesNotExist:
            return Response({"general": "Achat introuvable."}, status=status.HTTP_404_NOT_FOUND)

        achat.confirmer_paiement(reference_paiement=reference)
        return Response(AchatEbookSerializer(achat, context={'request': request}).data, status=status.HTTP_200_OK)


class TelechargerEbookView(APIView):
    """
    Sert le PDF complet — UNIQUEMENT si l'achat associé à ce token est payé.
    Le token est imprévisible (secrets.token_urlsafe) donc inutile de deviner ;
    mais même en le devinant, sans paiement confirmé en base, rien n'est servi.
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            achat = AchatEbook.objects.select_related('ebook').get(token_telechargement=token)
        except AchatEbook.DoesNotExist:
            raise Http404

        if achat.statut_paiement != 'paye':
            return Response({"general": "Paiement non confirmé pour ce lien de téléchargement."}, status=status.HTTP_403_FORBIDDEN)

        if not achat.ebook.fichier_complet:
            return Response({"general": "Le fichier n'est pas encore disponible, contactez le support."}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(
            achat.ebook.fichier_complet.open('rb'),
            as_attachment=True,
            filename=f"{achat.ebook.titre}.pdf",
        )
