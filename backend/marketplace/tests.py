from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from .models import User


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class MotDePasseOublieTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='awa', email='awa@example.com', password='AncienMdp!2024',
            phone_number='770000001',
        )

    def lien_valide(self):
        return {
            'uid': urlsafe_base64_encode(force_bytes(self.user.pk)),
            'token': default_token_generator.make_token(self.user),
        }

    def test_demande_par_email_envoie_un_lien(self):
        reponse = self.client.post('/api/mot-de-passe-oublie/', {'identifiant': 'AWA@example.com'}, format='json')
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('/reinitialiser-mot-de-passe/', mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ['awa@example.com'])

    def test_demande_par_numero_ou_identifiant(self):
        self.client.post('/api/mot-de-passe-oublie/', {'identifiant': '770000001'}, format='json')
        self.client.post('/api/mot-de-passe-oublie/', {'identifiant': 'awa'}, format='json')
        self.assertEqual(len(mail.outbox), 2)

    def test_compte_inconnu_meme_reponse_sans_email(self):
        reponse = self.client.post('/api/mot-de-passe-oublie/', {'identifiant': 'personne@example.com'}, format='json')
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_identifiant_vide_refuse(self):
        reponse = self.client.post('/api/mot-de-passe-oublie/', {'identifiant': ' '}, format='json')
        self.assertEqual(reponse.status_code, 400)

    def test_reinitialisation_change_le_mot_de_passe_et_lien_a_usage_unique(self):
        donnees = {**self.lien_valide(), 'mot_de_passe': 'NouveauMdp!2026'}
        reponse = self.client.post('/api/reinitialiser-mot-de-passe/', donnees, format='json')
        self.assertEqual(reponse.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NouveauMdp!2026'))
        # Le même lien ne fonctionne plus une seconde fois
        reponse = self.client.post('/api/reinitialiser-mot-de-passe/', {**donnees, 'mot_de_passe': 'Autre!Mdp2026'}, format='json')
        self.assertEqual(reponse.status_code, 400)

    def test_jeton_invalide_refuse(self):
        donnees = {'uid': self.lien_valide()['uid'], 'token': 'faux-jeton', 'mot_de_passe': 'NouveauMdp!2026'}
        reponse = self.client.post('/api/reinitialiser-mot-de-passe/', donnees, format='json')
        self.assertEqual(reponse.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('AncienMdp!2024'))

    def test_mot_de_passe_trop_faible_refuse_avec_message_francais(self):
        donnees = {**self.lien_valide(), 'mot_de_passe': '123'}
        reponse = self.client.post('/api/reinitialiser-mot-de-passe/', donnees, format='json')
        self.assertEqual(reponse.status_code, 400)
        self.assertTrue(any('court' in m for m in reponse.data['mot_de_passe']))


class MessagerieTests(TestCase):
    def setUp(self):
        from .models import Boutique, Produit
        self.vendeuse = User.objects.create_user(
            username='fatou', password='Mdp!Vendeuse2026', phone_number='770000010', role='vendeur',
            is_whatsapp_verified=True,
        )
        self.boutique = Boutique.objects.create(vendeur=self.vendeuse, nom_boutique='Chez Fatou')
        self.produit = Produit.objects.create(
            boutique=self.boutique, titre='Poussette', description='Très bon état',
            type_offre='vente', prix_vendeur=15000,
        )
        self.acheteuse = User.objects.create_user(
            username='awa', password='Mdp!Acheteuse2026', phone_number='770000011', first_name='Awa',
        )
        self.intruse = User.objects.create_user(
            username='kine', password='Mdp!Intruse2026', phone_number='770000012',
        )
        self.client = APIClient()

    def ouvrir_depuis_produit(self, user):
        self.client.force_authenticate(user)
        return self.client.post('/api/messagerie/conversations/', {'produit_id': self.produit.pk}, format='json')

    def test_anonyme_refuse(self):
        reponse = self.client.get('/api/messagerie/conversations/')
        self.assertIn(reponse.status_code, (401, 403))

    def test_ouvrir_depuis_un_produit_puis_echanger(self):
        reponse = self.ouvrir_depuis_produit(self.acheteuse)
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data['interlocuteur']['nom'], 'Chez Fatou')
        self.assertEqual(reponse.data['produit']['titre'], 'Poussette')
        conv_id = reponse.data['id']

        # Rouvrir depuis le même article retrouve la même conversation
        self.assertEqual(self.ouvrir_depuis_produit(self.acheteuse).data['id'], conv_id)

        # Une conversation vide n'apparaît pas encore dans la liste
        self.assertEqual(self.client.get('/api/messagerie/conversations/').data, [])

        envoi = self.client.post(
            f'/api/messagerie/conversations/{conv_id}/',
            {'texte': 'Bonjour, cet article m\'intéresse.', 'produit_id': self.produit.pk}, format='json',
        )
        self.assertEqual(envoi.status_code, 201)
        self.assertTrue(envoi.data['de_moi'])
        self.assertEqual(envoi.data['produit']['id'], self.produit.pk)

        # Côté vendeuse : 1 non lu, puis 0 après ouverture ; l'acheteuse voit « Vu »
        self.client.force_authenticate(self.vendeuse)
        self.assertEqual(self.client.get('/api/messagerie/non-lus/').data['total'], 1)
        liste = self.client.get('/api/messagerie/conversations/').data
        self.assertEqual(liste[0]['non_lus'], 1)
        self.assertEqual(liste[0]['interlocuteur']['nom'], 'Awa')
        fil = self.client.get(f'/api/messagerie/conversations/{conv_id}/').data
        self.assertFalse(fil['messages'][0]['de_moi'])
        self.assertEqual(self.client.get('/api/messagerie/non-lus/').data['total'], 0)
        self.client.post(f'/api/messagerie/conversations/{conv_id}/', {'texte': 'Oui, toujours disponible !'}, format='json')

        self.client.force_authenticate(self.acheteuse)
        fil = self.client.get(f'/api/messagerie/conversations/{conv_id}/').data
        self.assertEqual(len(fil['messages']), 2)
        self.assertTrue(fil['messages'][0]['lu'])
        premier_id = fil['messages'][0]['id']
        nouveaux = self.client.get(f'/api/messagerie/conversations/{conv_id}/?apres={premier_id}').data['messages']
        self.assertEqual([m['texte'] for m in nouveaux], ['Oui, toujours disponible !'])

    def test_on_ne_peut_pas_s_ecrire_a_soi_meme(self):
        reponse = self.ouvrir_depuis_produit(self.vendeuse)
        self.assertEqual(reponse.status_code, 400)

    def test_une_autre_personne_ne_voit_pas_la_conversation(self):
        conv_id = self.ouvrir_depuis_produit(self.acheteuse).data['id']
        self.client.force_authenticate(self.intruse)
        self.assertEqual(self.client.get(f'/api/messagerie/conversations/{conv_id}/').status_code, 404)
        envoi = self.client.post(f'/api/messagerie/conversations/{conv_id}/', {'texte': 'coucou'}, format='json')
        self.assertEqual(envoi.status_code, 404)

    def test_message_vide_ou_trop_long_refuse(self):
        conv_id = self.ouvrir_depuis_produit(self.acheteuse).data['id']
        url = f'/api/messagerie/conversations/{conv_id}/'
        self.assertEqual(self.client.post(url, {'texte': '   '}, format='json').status_code, 400)
        self.assertEqual(self.client.post(url, {'texte': 'a' * 2001}, format='json').status_code, 400)
