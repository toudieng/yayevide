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
