"""
Espace « Une question ? » : chaque utilisatrice (acheteuse ou vendeuse)
discute avec l'équipe Yaay Vidé, jamais avec une autre utilisatrice.

Côté utilisatrice (connexion requise) :
  GET  /api/support/                       mon fil (?apres=<id> : nouveaux messages seulement)
                                           + marque comme lues les réponses de l'équipe
  POST /api/support/                       écrire { texte, produit_id?, commande_id? }
  GET  /api/support/non-lus/               réponses de l'équipe non lues (badge)
  GET  /api/support/elements-joignables/   mes commandes / articles récents à joindre

Côté équipe (role admin) :
  GET  /api/admin/support/                 tous les fils (sans réponse en premier)
  GET  /api/admin/support/<id>/            un fil (+ marque lus les messages de l'utilisatrice)
  POST /api/admin/support/<id>/            répondre { texte } (+ e-mail de notification)
  GET  /api/admin/support/en-attente/      nombre de fils sans réponse (badge)
"""
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Commande, FilSupport, MessageSupport, Produit
from .permissions import EstAdmin

LONGUEUR_MAX = 2000
NB_MESSAGES_MAX = 200
# Pas plus d'un e-mail « l'équipe vous a répondu » par tranche de 15 minutes
DELAI_ENTRE_EMAILS = timedelta(minutes=15)


def nom_utilisatrice(user):
    if user.role == 'vendeur' and hasattr(user, 'boutique'):
        return user.boutique.nom_boutique
    complet = f"{user.first_name} {user.last_name}".strip()
    return complet or user.username


def produit_resume(produit, request):
    if produit is None:
        return None
    return {
        'id': produit.pk,
        'titre': produit.titre,
        'prix': produit.prix_final_public,
        'type_offre': produit.type_offre,
        'image': request.build_absolute_uri(produit.image_principale.url) if produit.image_principale else None,
    }


def commande_resume(commande, request):
    if commande is None:
        return None
    return {
        'id': commande.pk,
        'statut': commande.get_statut_display(),
        'produit_titre': commande.produit.titre if commande.produit_id else '',
        'image': (
            request.build_absolute_uri(commande.produit.image_principale.url)
            if commande.produit_id and commande.produit.image_principale else None
        ),
    }


def message_json(message, request, point_de_vue_equipe=False):
    # « de_moi » : du point de vue de la personne qui regarde
    de_moi = message.de_l_equipe if point_de_vue_equipe else not message.de_l_equipe
    return {
        'id': message.pk,
        'texte': message.texte,
        'de_moi': de_moi,
        'de_l_equipe': message.de_l_equipe,
        'auteur': (message.auteur.first_name or message.auteur.username) if message.de_l_equipe and message.auteur else None,
        'envoye_le': message.envoye_le,
        'lu': bool(message.lu_le) if de_moi else None,
        'produit': produit_resume(message.produit, request),
        'commande': commande_resume(message.commande, request),
    }


def lire_fil(fil, request, point_de_vue_equipe):
    """Messages du fil (tous les récents, ou seulement après ?apres=<id>)."""
    messages = fil.messages.select_related('produit', 'commande__produit', 'auteur')
    apres = request.query_params.get('apres')
    if apres and str(apres).isdigit():
        messages = messages.filter(pk__gt=int(apres))
    else:
        ids = list(fil.messages.order_by('-envoye_le', '-id').values_list('pk', flat=True)[:NB_MESSAGES_MAX])
        messages = messages.filter(pk__in=ids)
    # Ouvrir le fil = lire les messages venant de l'autre côté
    fil.messages.filter(lu_le__isnull=True, de_l_equipe=not point_de_vue_equipe).update(lu_le=timezone.now())
    return {
        'messages': [message_json(m, request, point_de_vue_equipe) for m in messages],
        'mes_messages_lus': list(
            fil.messages.filter(de_l_equipe=point_de_vue_equipe, lu_le__isnull=False).values_list('pk', flat=True)
        ),
    }


def texte_valide(request):
    texte = (request.data.get('texte') or '').strip()
    if not texte:
        return None, Response({"texte": "Écrivez votre message avant d'envoyer."}, status=status.HTTP_400_BAD_REQUEST)
    if len(texte) > LONGUEUR_MAX:
        return None, Response(
            {"texte": f"Votre message est trop long ({LONGUEUR_MAX} caractères maximum)."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return texte, None


def commandes_de(user):
    """Commandes qu'une utilisatrice peut évoquer : ses achats, ou ses ventes."""
    return Commande.objects.filter(Q(acheteur=user) | Q(produit__boutique__vendeur=user))


# ---------------------------------------------------------------- utilisatrice
class MonFilSupportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fil = FilSupport.objects.filter(utilisateur=request.user).first()
        if fil is None:
            return Response({'messages': [], 'mes_messages_lus': []}, status=status.HTTP_200_OK)
        return Response(lire_fil(fil, request, point_de_vue_equipe=False), status=status.HTTP_200_OK)

    def post(self, request):
        texte, erreur = texte_valide(request)
        if erreur:
            return erreur

        produit = None
        if request.data.get('produit_id'):
            produit = Produit.objects.filter(pk=request.data.get('produit_id')).first()
        commande = None
        if request.data.get('commande_id'):
            # On ne peut joindre que ses propres commandes (achats ou ventes)
            commande = commandes_de(request.user).filter(pk=request.data.get('commande_id')).first()

        fil, _ = FilSupport.objects.get_or_create(utilisateur=request.user)
        message = MessageSupport.objects.create(
            fil=fil, auteur=request.user, de_l_equipe=False, texte=texte, produit=produit, commande=commande,
        )
        fil.dernier_message_le = message.envoye_le
        fil.en_attente_equipe = True
        fil.save(update_fields=['dernier_message_le', 'en_attente_equipe'])
        return Response(message_json(message, request), status=status.HTTP_201_CREATED)


class SupportNonLusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = MessageSupport.objects.filter(
            fil__utilisateur=request.user, de_l_equipe=True, lu_le__isnull=True,
        ).count()
        return Response({'total': total}, status=status.HTTP_200_OK)


class ElementsJoignablesView(APIView):
    """Commandes (achats et ventes) et articles récents, pour le bouton « Joindre »."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        commandes = commandes_de(request.user).select_related('produit').order_by('-date_commande')[:15]
        produits = []
        if hasattr(request.user, 'boutique'):
            produits = request.user.boutique.produits.order_by('-date_ajout')[:15]
        return Response(
            {
                'commandes': [commande_resume(c, request) for c in commandes],
                'produits': [produit_resume(p, request) for p in produits],
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------- équipe
class SupportAdminListeView(APIView):
    permission_classes = [EstAdmin]

    def get(self, request):
        fils = (
            FilSupport.objects.select_related('utilisateur__boutique')
            .annotate(
                nb_non_lus=Count('messages', filter=Q(messages__de_l_equipe=False, messages__lu_le__isnull=True)),
            )
            .order_by('-en_attente_equipe', '-dernier_message_le')[:200]
        )
        resultat = []
        for fil in fils:
            dernier = fil.messages.order_by('-envoye_le', '-id').first()
            user = fil.utilisateur
            resultat.append({
                'id': fil.pk,
                'utilisateur': {
                    'id': user.pk,
                    'nom': nom_utilisatrice(user),
                    'role': user.role,
                    'username': user.username,
                    'telephone': user.phone_number,
                    'email': user.email,
                },
                'en_attente': fil.en_attente_equipe,
                'non_lus': fil.nb_non_lus,
                'dernier_message': message_json(dernier, request, point_de_vue_equipe=True) if dernier else None,
                'dernier_message_le': fil.dernier_message_le,
            })
        return Response(resultat, status=status.HTTP_200_OK)


class SupportAdminEnAttenteView(APIView):
    permission_classes = [EstAdmin]

    def get(self, request):
        return Response({'total': FilSupport.objects.filter(en_attente_equipe=True).count()}, status=status.HTTP_200_OK)


class SupportAdminFilView(APIView):
    permission_classes = [EstAdmin]

    def get(self, request, pk):
        fil = get_object_or_404(FilSupport.objects.select_related('utilisateur__boutique'), pk=pk)
        donnees = lire_fil(fil, request, point_de_vue_equipe=True)
        user = fil.utilisateur
        donnees['utilisateur'] = {
            'id': user.pk, 'nom': nom_utilisatrice(user), 'role': user.role, 'username': user.username,
            'telephone': user.phone_number, 'email': user.email,
        }
        donnees['en_attente'] = fil.en_attente_equipe
        return Response(donnees, status=status.HTTP_200_OK)

    def post(self, request, pk):
        fil = get_object_or_404(FilSupport.objects.select_related('utilisateur'), pk=pk)
        texte, erreur = texte_valide(request)
        if erreur:
            return erreur

        message = MessageSupport.objects.create(fil=fil, auteur=request.user, de_l_equipe=True, texte=texte)
        fil.dernier_message_le = message.envoye_le
        fil.en_attente_equipe = False

        # E-mail « l'équipe vous a répondu » (au plus un toutes les 15 minutes)
        champs = ['dernier_message_le', 'en_attente_equipe']
        maintenant = timezone.now()
        destinataire = fil.utilisateur.email
        if destinataire and (fil.dernier_email_le is None or maintenant - fil.dernier_email_le > DELAI_ENTRE_EMAILS):
            send_mail(
                subject="L'équipe Yaay Vidé vous a répondu",
                message=(
                    "Bonjour,\n\n"
                    "Vous avez une nouvelle réponse de l'équipe Yaay Vidé à votre question.\n"
                    f"Lisez-la ici : {settings.FRONTEND_URL}/aide\n\n"
                    "À très vite sur Yaay Vidé !"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[destinataire],
                fail_silently=True,
            )
            fil.dernier_email_le = maintenant
            champs.append('dernier_email_le')
        fil.save(update_fields=champs)
        return Response(message_json(message, request, point_de_vue_equipe=True), status=status.HTTP_201_CREATED)
