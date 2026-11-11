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


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class SupportTests(TestCase):
    def setUp(self):
        from .models import Boutique, Commande, Produit
        self.vendeuse = User.objects.create_user(
            username='fatou', password='Mdp!Vendeuse2026', phone_number='770000010', role='vendeur',
            is_whatsapp_verified=True, email='fatou@example.com',
        )
        boutique = Boutique.objects.create(vendeur=self.vendeuse, nom_boutique='Chez Fatou')
        self.produit = Produit.objects.create(
            boutique=boutique, titre='Poussette', description='Très bon état', type_offre='vente', prix_vendeur=15000,
        )
        self.acheteuse = User.objects.create_user(
            username='awa', password='Mdp!Acheteuse2026', phone_number='770000011', email='awa@example.com',
        )
        self.autre = User.objects.create_user(username='kine', password='Mdp!Autre2026', phone_number='770000012')
        self.equipe = User.objects.create_user(
            username='equipe', password='Mdp!Equipe2026', phone_number='770000013', role='admin',
        )
        self.commande = Commande.objects.create(acheteur=self.acheteuse, produit=self.produit, prix_total_paye=15750)
        self.client = APIClient()

    def test_anonyme_refuse(self):
        self.assertIn(self.client.get('/api/support/').status_code, (401, 403))

    def test_question_puis_reponse_de_l_equipe(self):
        self.client.force_authenticate(self.acheteuse)
        self.assertEqual(self.client.get('/api/support/').data['messages'], [])
        envoi = self.client.post(
            '/api/support/', {'texte': 'Où en est ma commande ?', 'commande_id': self.commande.pk}, format='json',
        )
        self.assertEqual(envoi.status_code, 201)
        self.assertEqual(envoi.data['commande']['id'], self.commande.pk)

        # L'équipe voit le fil en attente, l'ouvre et répond
        self.client.force_authenticate(self.equipe)
        self.assertEqual(self.client.get('/api/admin/support/en-attente/').data['total'], 1)
        fils = self.client.get('/api/admin/support/').data
        self.assertTrue(fils[0]['en_attente'])
        self.assertEqual(fils[0]['non_lus'], 1)
        fil_id = fils[0]['id']
        self.client.get(f'/api/admin/support/{fil_id}/')
        reponse = self.client.post(f'/api/admin/support/{fil_id}/', {'texte': 'Elle part demain matin !'}, format='json')
        self.assertEqual(reponse.status_code, 201)
        self.assertEqual(self.client.get('/api/admin/support/en-attente/').data['total'], 0)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['awa@example.com'])

        # Deuxième réponse rapprochée : pas de deuxième e-mail
        self.client.post(f'/api/admin/support/{fil_id}/', {'texte': 'Livraison avant midi.'}, format='json')
        self.assertEqual(len(mail.outbox), 1)

        # L'acheteuse voit 2 non lus, son message marqué « Vu », puis 0
        self.client.force_authenticate(self.acheteuse)
        self.assertEqual(self.client.get('/api/support/non-lus/').data['total'], 2)
        fil = self.client.get('/api/support/').data
        self.assertEqual(len(fil['messages']), 3)
        self.assertTrue(fil['messages'][0]['lu'])
        self.assertTrue(fil['messages'][1]['de_l_equipe'])
        self.assertEqual(self.client.get('/api/support/non-lus/').data['total'], 0)

    def test_on_ne_joint_pas_la_commande_d_une_autre(self):
        self.client.force_authenticate(self.autre)
        envoi = self.client.post('/api/support/', {'texte': 'Bonjour', 'commande_id': self.commande.pk}, format='json')
        self.assertEqual(envoi.status_code, 201)
        self.assertIsNone(envoi.data['commande'])

    def test_la_vendeuse_peut_joindre_sa_vente_et_ses_articles(self):
        self.client.force_authenticate(self.vendeuse)
        joignables = self.client.get('/api/support/elements-joignables/').data
        self.assertEqual([c['id'] for c in joignables['commandes']], [self.commande.pk])
        self.assertEqual([p['id'] for p in joignables['produits']], [self.produit.pk])

    def test_seule_l_equipe_accede_aux_fils(self):
        self.client.force_authenticate(self.acheteuse)
        self.client.post('/api/support/', {'texte': 'Bonjour'}, format='json')
        for user in (self.acheteuse, self.vendeuse):
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get('/api/admin/support/').status_code, 403)

    def test_message_vide_ou_trop_long_refuse(self):
        self.client.force_authenticate(self.acheteuse)
        self.assertEqual(self.client.post('/api/support/', {'texte': ' '}, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/support/', {'texte': 'a' * 2001}, format='json').status_code, 400)
