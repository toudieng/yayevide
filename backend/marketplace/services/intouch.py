"""
marketplace/services/intouch.py

Abstraction du paiement en ligne (vente uniquement — la location reste sur
WhatsApp, cf. ProduitDetail côté frontend).

⚠️ ÉTAT ACTUEL : tant que INTOUCH_TOKEN n'est pas renseigné dans
l'environnement, ce service fonctionne en MODE SIMULATION : aucun appel
réseau réel n'est fait, le paiement est considéré comme réussi
immédiatement. Cela permet de tester tout le parcours panier -> paiement ->
décrémentation du stock sans attendre l'intégration réelle.

Les identifiants confirmés (visibles dans le connecteur WooCommerce
"TouchPay" déjà utilisé sur yaayvide.com) sont : Token, Domain Name (Nom de
domaine, ex: "yaay.vide") et Agency Code. Ce sont les seuls champs dont le
NOM est confirmé — l'URL exacte de l'endpoint, la méthode HTTP, le format
du payload JSON et le mécanisme de vérification de signature du webhook
restent à confirmer via la documentation technique InTouch (portail
touchdeveloppers-sandbox.appspot.com, accès authentifié) avant de pouvoir
compléter initier_paiement() et verifier_signature_webhook() ci-dessous.
Ne PAS deviner ce format pour un vrai paiement — mieux vaut rester en
simulation le temps d'avoir la doc exacte.
"""
import uuid
from django.conf import settings


class IntouchPaymentService:

    @property
    def mode_simulation(self):
        return not settings.INTOUCH_TOKEN

    def initier_paiement(self, commandes, montant_total, numero_acheteuse=None):
        """
        Démarre une transaction de paiement pour un groupe de commandes
        (un panier peut contenir des articles de plusieurs boutiques —
        InTouch facture en une seule transaction, la répartition entre
        vendeuses se fait ensuite côté Yaay Vidé).

        Retourne un dict : { reference, payment_url, simulation }
        """
        reference = f"YV-{uuid.uuid4().hex[:10].upper()}"

        if self.mode_simulation:
            # Aucun vrai appel réseau — on renvoie directement une référence
            # utilisable par /api/paiement/simuler-confirmation/ (DEBUG uniquement).
            return {"reference": reference, "payment_url": None, "simulation": True}

        # --- À COMPLÉTER avec la vraie intégration InTouch/TouchPay ---
        # Les 3 identifiants confirmés sont déjà exposés ci-dessous ; il
        # manque uniquement l'URL d'endpoint et la forme exacte du payload,
        # à récupérer depuis la documentation technique InTouch avant de
        # remplacer ce bloc :
        #
        # import requests
        # response = requests.post(
        #     "https://<URL_A_CONFIRMER>",
        #     json={
        #         "token": settings.INTOUCH_TOKEN,
        #         "domainName": settings.INTOUCH_DOMAIN_NAME,
        #         "agencyCode": settings.INTOUCH_AGENCY_CODE,
        #         "amount": int(montant_total),
        #         "reference": reference,
        #         "successUrl": f"{settings.FRONTEND_URL}/checkout/retour?statut=succes",
        #         "failUrl": f"{settings.FRONTEND_URL}/checkout/retour?statut=echec",
        #     },
        # )
        # data = response.json()
        # return {"reference": reference, "payment_url": data["payment_url"], "simulation": False}
        raise NotImplementedError(
            "INTOUCH_TOKEN est renseigné mais l'appel réel n'est pas encore implémenté "
            "— il manque l'URL d'endpoint exacte, à récupérer depuis la documentation "
            "technique InTouch avant de compléter initier_paiement()."
        )

    def initier_paiement_livraison(self, commande, mode_paiement):
        """
        Déclenche le paiement InTouch AU MOMENT DE LA LIVRAISON — le
        livreur confirme la remise de l'article, ce qui envoie une demande
        de paiement (Wave ou Orange Money) au numéro de l'acheteuse.
        Ne s'applique jamais aux espèces (rien à faire passer par InTouch).

        Retourne un dict : { reference, simulation, succes }
        """
        reference = f"YV-LIV-{uuid.uuid4().hex[:10].upper()}"

        if self.mode_simulation:
            # Simulation : la demande est considérée acceptée immédiatement.
            return {"reference": reference, "simulation": True, "succes": True}

        # --- À COMPLÉTER avec la vraie intégration InTouch/TouchPay ---
        # Même remarque que pour initier_paiement() : il manque l'URL
        # d'endpoint exacte et le format du payload, à confirmer via la
        # documentation technique InTouch avant de remplacer ce bloc.
        raise NotImplementedError(
            "INTOUCH_TOKEN est renseigné mais l'appel réel n'est pas encore implémenté "
            "— il manque l'URL d'endpoint exacte, à récupérer depuis la documentation "
            "technique InTouch avant de compléter initier_paiement_livraison()."
        )

    def verifier_signature_webhook(self, request):
        """
        Vérifie qu'un webhook reçu provient bien d'InTouch (et non d'un tiers
        malveillant qui simulerait un paiement réussi). Mécanisme exact à
        confirmer via la documentation technique InTouch (probablement une
        signature HMAC dans un header, mais à vérifier).
        """
        if self.mode_simulation:
            return True
        raise NotImplementedError("Vérification de signature InTouch non encore implémentée.")


intouch_service = IntouchPaymentService()
