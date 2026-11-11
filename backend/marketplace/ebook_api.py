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
import secrets
from django.http import FileResponse, Http404
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import Ebook, AchatEbook
from .serializers import EbookPublicSerializer, AchatEbookSerializer
from .services.intouch import intouch_service


class EbookDetailView(APIView):
    """L'e-book actif à afficher sur /ebook — aperçu public uniquement."""
    permission_classes = [AllowAny]

    def get(self, request):
        ebook = Ebook.objects.filter(actif=True).order_by('-date_creation').first()
        if not ebook:
            return Response({"general": "Aucun e-book disponible pour le moment."}, status=status.HTTP_404_NOT_FOUND)
        return Response(EbookPublicSerializer(ebook, context={'request': request}).data, status=status.HTTP_200_OK)


class AcheterEbookView(APIView):
    """Démarre un achat — pas de compte requis, juste email + moyen de paiement."""
    permission_classes = [AllowAny]

    def post(self, request):
        ebook_id = request.data.get('ebook_id')
        email = (request.data.get('email') or '').strip()
        telephone = (request.data.get('telephone') or '').strip()
        mode_paiement = request.data.get('mode_paiement', '')

        if not email:
            return Response({"email": "L'adresse email est requise pour recevoir le lien de téléchargement."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ebook = Ebook.objects.get(pk=ebook_id, actif=True)
        except Ebook.DoesNotExist:
            return Response({"general": "E-book introuvable."}, status=status.HTTP_404_NOT_FOUND)

        achat = AchatEbook.objects.create(
            ebook=ebook,
            email=email,
            telephone=telephone,
            mode_paiement=mode_paiement,
            prix_paye=ebook.prix,
            token_telechargement=secrets.token_urlsafe(32),
        )

        resultat = intouch_service.initier_paiement([achat], float(ebook.prix))
        achat.reference_paiement = resultat['reference']
        achat.save(update_fields=['reference_paiement'])

        return Response({
            "achat": AchatEbookSerializer(achat, context={'request': request}).data,
            "payment_url": resultat['payment_url'],
            "simulation": resultat['simulation'],
        }, status=status.HTTP_201_CREATED)


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
