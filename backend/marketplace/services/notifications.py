"""
marketplace/services/notifications.py

Prévient la vendeuse dès qu'une nouvelle commande arrive, selon la
préférence choisie à l'inscription (User.notification_preference).

⚠️ ÉTAT ACTUEL, comme pour intouch.py :
- Email : FONCTIONNEL dès maintenant via send_mail (utilise EMAIL_BACKEND
  configuré dans settings.py — en dev, la config par défaut de Django
  affiche l'email dans la console au lieu de l'envoyer réellement ; il
  suffit de renseigner un vrai backend SMTP en production pour que ça
  parte pour de vrai, aucun changement de code nécessaire).
- WhatsApp : PAS ENCORE BRANCHÉ. Envoyer un message WhatsApp sortant (pas
  juste un lien wa.me cliquable par la personne elle-même) nécessite une
  intégration payante (WhatsApp Business API via Meta, ou un fournisseur
  comme Twilio) avec des identifiants qu'on n'a pas encore. En attendant,
  la fonction ci-dessous journalise simplement l'intention d'envoi.
"""
from django.core.mail import send_mail
from django.conf import settings


def notifier_nouvelle_commande(commande):
    """Prévient la vendeuse propriétaire du produit qu'une commande vient
    d'arriver — appelée juste après la création de la Commande."""
    vendeuse = commande.produit.boutique.vendeur

    if vendeuse.notification_preference == 'whatsapp':
        _notifier_whatsapp(vendeuse, commande)
    else:
        _notifier_email(vendeuse, commande)


def _notifier_email(vendeuse, commande):
    if not vendeuse.email:
        return
    try:
        send_mail(
            subject=f"Nouvelle commande — {commande.produit.titre}",
            message=(
                f"Bonjour {vendeuse.first_name or vendeuse.username},\n\n"
                f"Vous avez reçu une nouvelle demande d'achat pour \"{commande.produit.titre}\" "
                f"({commande.prix_total_paye} FCFA).\n\n"
                f"Vous avez 24 heures pour confirmer sa disponibilité depuis votre tableau de bord :\n"
                f"{settings.FRONTEND_URL}/vendeuse/commandes\n\n"
                f"— Yaay Vidé"
            ),
            from_email=None,
            recipient_list=[vendeuse.email],
            fail_silently=True,
        )
    except Exception:
        pass


def _notifier_whatsapp(vendeuse, commande):
    """Pas encore de véritable envoi — voir l'avertissement en tête de
    fichier. On journalise pour qu'on puisse vérifier, une fois l'API
    branchée, que le déclenchement se fait bien au bon moment."""
    import logging
    logger = logging.getLogger('marketplace.notifications')
    logger.info(
        "[SIMULATION WhatsApp] Message non envoye (API non branchee) a %s : "
        "nouvelle commande #%s pour %s.",
        vendeuse.phone_number, commande.id, commande.produit.titre,
    )
