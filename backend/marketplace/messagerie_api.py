"""
Messagerie entre acheteuses et vendeuses.

Points d'accès (tous réservés aux personnes connectées) :
  GET  /api/messagerie/conversations/                 liste de mes conversations
  POST /api/messagerie/conversations/                 ouvrir (ou retrouver) une conversation
                                                      { produit_id } ou { utilisateur_id }
  GET  /api/messagerie/conversations/<id>/            messages (?apres=<id> : seulement les nouveaux)
                                                      et marque comme lus ceux de l'interlocuteur
  POST /api/messagerie/conversations/<id>/            envoyer { texte, produit_id? }
  GET  /api/messagerie/non-lus/                       nombre total de messages non lus (badge)

Une personne ne peut lire et écrire que dans les conversations dont elle
fait partie ; les autres renvoient 404 (on ne révèle pas leur existence).
"""
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message, Produit, User

LONGUEUR_MAX = 2000
NB_MESSAGES_MAX = 200


def nom_affiche(user):
    """Nom montré dans la messagerie : nom de la boutique pour une vendeuse."""
    if user.role == 'vendeur' and hasattr(user, 'boutique'):
        return user.boutique.nom_boutique
    complet = f"{user.first_name} {user.last_name[:1] + '.' if user.last_name else ''}".strip()
    return complet or user.username


def personne(user):
    boutique = getattr(user, 'boutique', None) if user.role == 'vendeur' else None
    return {
        'id': user.pk,
        'nom': nom_affiche(user),
        'role': user.role,
        'boutique_slug': boutique.slug if boutique else None,
    }


def produit_resume(produit, request):
    if produit is None:
        return None
    image = None
    if produit.image_principale:
        image = request.build_absolute_uri(produit.image_principale.url)
    return {
        'id': produit.pk,
        'titre': produit.titre,
        'prix': produit.prix_final_public,
        'type_offre': produit.type_offre,
        'image': image,
        'disponible': produit.disponible,
    }


def message_json(message, user, request):
    de_moi = message.auteur_id == user.pk
    return {
        'id': message.pk,
        'texte': message.texte,
        'de_moi': de_moi,
        'envoye_le': message.envoye_le,
        # « Vu » n'a de sens que pour mes propres messages
        'lu': bool(message.lu_le) if de_moi else None,
        'produit': produit_resume(message.produit, request),
    }


def conversation_json(conversation, user, request, non_lus=0):
    dernier = conversation.messages.order_by('-envoye_le', '-id').select_related('produit').first()
    return {
        'id': conversation.pk,
        'interlocuteur': personne(conversation.interlocuteur_de(user)),
        'dernier_message': message_json(dernier, user, request) if dernier else None,
        'dernier_message_le': conversation.dernier_message_le,
        'non_lus': non_lus,
    }


def mes_conversations(user):
    return Conversation.objects.filter(Q(participant_1=user) | Q(participant_2=user))


class ConversationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = (
            mes_conversations(request.user)
            .select_related('participant_1__boutique', 'participant_2__boutique')
            .annotate(
                nb_messages=Count('messages'),
                nb_non_lus=Count(
                    'messages',
                    filter=Q(messages__lu_le__isnull=True) & ~Q(messages__auteur=request.user),
                ),
            )
            .filter(nb_messages__gt=0)
            .order_by('-dernier_message_le')[:100]
        )
        return Response(
            [conversation_json(c, request.user, request, c.nb_non_lus) for c in conversations],
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        produit = None
        produit_id = request.data.get('produit_id')
        utilisateur_id = request.data.get('utilisateur_id')

        if produit_id:
            produit = Produit.objects.select_related('boutique__vendeur').filter(pk=produit_id).first()
            if produit is None:
                return Response({"general": "Article introuvable."}, status=status.HTTP_404_NOT_FOUND)
            interlocuteur = produit.boutique.vendeur
        elif utilisateur_id:
            interlocuteur = User.objects.filter(pk=utilisateur_id, is_active=True).first()
            if interlocuteur is None:
                return Response({"general": "Destinataire introuvable."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"general": "Indiquez un article ou un destinataire."}, status=status.HTTP_400_BAD_REQUEST)

        if interlocuteur.pk == request.user.pk:
            return Response(
                {"general": "C'est votre propre article : vous ne pouvez pas vous écrire à vous-même."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation = Conversation.entre(request.user, interlocuteur)
        donnees = conversation_json(conversation, request.user, request)
        donnees['produit'] = produit_resume(produit, request)
        return Response(donnees, status=status.HTTP_200_OK)


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get_conversation(self, request, pk):
        return get_object_or_404(
            mes_conversations(request.user).select_related('participant_1__boutique', 'participant_2__boutique'),
            pk=pk,
        )

    def get(self, request, pk):
        conversation = self.get_conversation(request, pk)
        messages = conversation.messages.select_related('produit')
        apres = request.query_params.get('apres')
        if apres and str(apres).isdigit():
            messages = messages.filter(pk__gt=int(apres))
        else:
            # les NB_MESSAGES_MAX plus récents, remis dans l'ordre chronologique
            derniers_ids = list(
                conversation.messages.order_by('-envoye_le', '-id').values_list('pk', flat=True)[:NB_MESSAGES_MAX]
            )
            messages = messages.filter(pk__in=derniers_ids)

        # Ouvrir la conversation = lire les messages reçus
        conversation.messages.filter(lu_le__isnull=True).exclude(auteur=request.user).update(lu_le=timezone.now())

        return Response(
            {
                'conversation': conversation_json(conversation, request.user, request),
                'messages': [message_json(m, request.user, request) for m in messages],
                # pour mettre à jour « Vu » sur mes messages déjà affichés
                'mes_messages_lus': list(
                    conversation.messages.filter(auteur=request.user, lu_le__isnull=False).values_list('pk', flat=True)
                ),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, pk):
        conversation = self.get_conversation(request, pk)
        texte = (request.data.get('texte') or '').strip()
        if not texte:
            return Response({"texte": "Écrivez un message avant d'envoyer."}, status=status.HTTP_400_BAD_REQUEST)
        if len(texte) > LONGUEUR_MAX:
            return Response(
                {"texte": f"Votre message est trop long ({LONGUEUR_MAX} caractères maximum)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        produit = None
        produit_id = request.data.get('produit_id')
        if produit_id:
            produit = Produit.objects.filter(pk=produit_id).first()

        message = Message.objects.create(
            conversation=conversation, auteur=request.user, texte=texte, produit=produit,
        )
        conversation.dernier_message_le = message.envoye_le
        conversation.save(update_fields=['dernier_message_le'])
        return Response(message_json(message, request.user, request), status=status.HTTP_201_CREATED)


class MessagesNonLusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = (
            Message.objects.filter(
                Q(conversation__participant_1=request.user) | Q(conversation__participant_2=request.user),
                lu_le__isnull=True,
            )
            .exclude(auteur=request.user)
            .count()
        )
        return Response({'total': total}, status=status.HTTP_200_OK)
