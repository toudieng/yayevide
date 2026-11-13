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


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class LocationTests(TestCase):
    """Parcours complet d'une location, sans WhatsApp."""

    def setUp(self):
        from datetime import timedelta
        from django.utils import timezone
        from .models import Boutique, Produit
        self.j = lambda n: (timezone.localdate() + timedelta(days=n)).isoformat()
        self.vendeuse = User.objects.create_user(
            username='fatou', password='Mdp!Vendeuse2026', phone_number='770000010', role='vendeur',
            is_whatsapp_verified=True, email='fatou@example.com',
        )
        boutique = Boutique.objects.create(vendeur=self.vendeuse, nom_boutique='Chez Fatou')
        # Caution laissée vide : ne doit plus faire planter la commande
        self.produit = Produit.objects.create(
            boutique=boutique, titre='Lit parapluie', description='Bon état', type_offre='location', prix_vendeur=1000,
        )
        self.locataire = User.objects.create_user(
            username='awa', password='Mdp!Locataire2026', phone_number='770000011', email='awa@example.com',
        )
        self.autre = User.objects.create_user(
            username='kine', password='Mdp!Autre2026', phone_number='770000012', email='kine@example.com',
        )
        self.livreur = User.objects.create_user(
            username='modou', password='Mdp!Livreur2026', phone_number='770000013', role='livreur', zone_livreur='zone1',
        )
        self.equipe = User.objects.create_user(
            username='equipe', password='Mdp!Equipe2026', phone_number='770000014', role='admin',
        )
        self.client = APIClient()

    def louer(self, user, debut, fin):
        self.client.force_authenticate(user)
        return self.client.post('/api/commandes/', {
            'items': [{'produit_id': self.produit.pk, 'date_debut': debut, 'date_fin': fin}],
            'adresse_livraison': 'Rue 10', 'zone_livraison': 'zone1', 'mode_paiement_choisi': 'wave',
        }, format='json')

    def test_reservation_sans_caution_et_dates_bloquees(self):
        reponse = self.louer(self.locataire, self.j(5), self.j(10))
        self.assertEqual(reponse.status_code, 201)
        commande = reponse.data['commandes'][0]
        self.assertEqual(commande['caution_demandee'], '0')
        # Les dates apparaissent comme prises, et une autre locataire est refusée dessus
        reservations = self.client.get(f'/api/produits/{self.produit.pk}/reservations/').data
        self.assertEqual(len(reservations), 1)
        refus = self.louer(self.autre, self.j(8), self.j(12))
        self.assertEqual(refus.status_code, 400)
        self.assertIn('déjà réservées', refus.data['general'])
        # En dehors de la période : accepté
        self.assertEqual(self.louer(self.autre, self.j(12), self.j(14)).status_code, 201)

    def test_contre_proposition_acceptee(self):
        cid = self.louer(self.locataire, self.j(5), self.j(10)).data['commandes'][0]['id']
        self.client.force_authenticate(self.vendeuse)
        reponse = self.client.post(f'/api/locations/{cid}/contre-proposition/', {'date_debut': self.j(5), 'date_fin': self.j(8)}, format='json')
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data['statut'], 'contre_proposition')
        self.assertTrue(any('Nouvelles dates' in m.subject for m in mail.outbox))
        # Une autre personne ne peut pas répondre à la place de la locataire
        self.client.force_authenticate(self.autre)
        self.assertEqual(self.client.post(f'/api/locations/{cid}/reponse-proposition/', {'accepter': True}, format='json').status_code, 404)
        self.client.force_authenticate(self.locataire)
        reponse = self.client.post(f'/api/locations/{cid}/reponse-proposition/', {'accepter': True}, format='json')
        self.assertEqual(reponse.data['statut'], 'confirme')
        self.assertEqual(reponse.data['date_fin_location'], self.j(8))
        self.assertEqual(reponse.data['nb_jours_location'], 3)
        self.assertEqual(reponse.data['prix_total_paye'], str(self.produit.prix_final_public * 3))

    def test_contre_proposition_refusee_libere_les_dates(self):
        cid = self.louer(self.locataire, self.j(5), self.j(10)).data['commandes'][0]['id']
        self.client.force_authenticate(self.vendeuse)
        self.client.post(f'/api/locations/{cid}/contre-proposition/', {'date_debut': self.j(6), 'date_fin': self.j(8)}, format='json')
        self.client.force_authenticate(self.locataire)
        reponse = self.client.post(f'/api/locations/{cid}/reponse-proposition/', {'accepter': False}, format='json')
        self.assertEqual(reponse.data['statut'], 'annule')
        self.assertEqual(self.client.get(f'/api/produits/{self.produit.pk}/reservations/').data, [])

    def livrer(self, cid):
        from .models import Commande
        commande = Commande.objects.get(pk=cid)
        commande.confirmer_disponibilite()
        commande.marquer_livree()
        return commande

    def test_prolongation_retour_et_caution(self):
        from .models import Commande
        from .location_api import traitement_quotidien
        self.produit.caution = 5000
        self.produit.save()
        cid = self.louer(self.locataire, self.j(1), self.j(3)).data['commandes'][0]['id']
        self.livrer(cid)
        self.produit.refresh_from_db()
        self.assertTrue(self.produit.disponible)  # la location ne vide plus le stock

        # Prolongation demandée puis acceptée : +2 jours à payer au retour
        self.client.force_authenticate(self.locataire)
        self.assertEqual(self.client.post(f'/api/locations/{cid}/prolongation/', {'date_fin': self.j(5)}, format='json').status_code, 200)
        self.client.force_authenticate(self.vendeuse)
        reponse = self.client.post(f'/api/locations/{cid}/prolongation/reponse/', {'accepter': True}, format='json')
        self.assertEqual(reponse.data['date_fin_location'], self.j(5))
        self.assertEqual(reponse.data['supplement_prolongation'], str(self.produit.prix_final_public * 2))

        # Tâche quotidienne le jour de la fin : retour à récupérer
        from datetime import date
        traitement_quotidien(date.fromisoformat(self.j(5)))
        self.assertEqual(Commande.objects.get(pk=cid).statut, 'retour_a_collecter')

        # Livreur : prendre -> récupérer (supplément encaissé) -> déposer
        self.client.force_authenticate(self.livreur)
        self.assertEqual(len(self.client.get('/api/livreur/retours/').data['disponibles']), 1)
        for action in ('prendre', 'recupere', 'depose'):
            self.assertEqual(self.client.patch(f'/api/livreur/retours/{cid}/', {'action': action}, format='json').status_code, 200)
        commande = Commande.objects.get(pk=cid)
        self.assertEqual(commande.statut, 'retour_controle')
        self.assertTrue(commande.supplement_paye)

        # Équipe : retenue sans motif refusée, puis clôture avec motif
        self.client.force_authenticate(self.equipe)
        url = f'/api/admin/locations/{cid}/cloturer/'
        self.assertEqual(self.client.post(url, {'caution_retenue': 1000}, format='json').status_code, 400)
        self.assertEqual(self.client.post(url, {'caution_retenue': 9000, 'motif_retenue': 'x'}, format='json').status_code, 400)
        reponse = self.client.post(url, {'caution_retenue': 1000, 'motif_retenue': 'Tache sur le matelas'}, format='json')
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data['statut'], 'terminee')
        self.assertTrue(any('Tache sur le matelas' in m.body for m in mail.outbox))

    def test_la_vendeuse_ne_cloture_plus_elle_meme(self):
        cid = self.louer(self.locataire, self.j(1), self.j(3)).data['commandes'][0]['id']
        self.livrer(cid)
        self.client.force_authenticate(self.vendeuse)
        self.assertEqual(self.client.patch(f'/api/commandes/{cid}/marquer-retournee/').status_code, 400)

    def test_rappel_la_veille(self):
        from datetime import date
        from .location_api import traitement_quotidien
        cid = self.louer(self.locataire, self.j(1), self.j(3)).data['commandes'][0]['id']
        self.livrer(cid)
        mail.outbox.clear()
        nb_rappels, _ = traitement_quotidien(date.fromisoformat(self.j(2)))
        self.assertEqual(nb_rappels, 1)
        self.assertIn('se termine demain', mail.outbox[0].subject)
        self.assertEqual(traitement_quotidien(date.fromisoformat(self.j(2)))[0], 0)  # pas de doublon


class DocumentsLivreurTests(TestCase):
    """Les pièces d'identité et permis des livreurs ne sont lisibles que par
    le livreur concerné et par l'équipe, et ne sont jamais dans media."""

    def setUp(self):
        import tempfile
        self.dossier_public = tempfile.mkdtemp()
        self.dossier_prive = tempfile.mkdtemp()
        self.reglages = override_settings(MEDIA_ROOT=self.dossier_public, PRIVATE_MEDIA_ROOT=self.dossier_prive)
        self.reglages.enable()
        self.livreur = User.objects.create_user('livreur1', 'l1@test.sn', 'MotDePasse!2026', role='livreur', phone_number='771110001')
        self.autre = User.objects.create_user('livreur2', 'l2@test.sn', 'MotDePasse!2026', role='livreur', phone_number='771110002')
        self.admin = User.objects.create_user('equipe', 'eq@test.sn', 'MotDePasse!2026', role='admin', phone_number='771110003')
        self.client = APIClient()

    def tearDown(self):
        import shutil
        self.reglages.disable()
        shutil.rmtree(self.dossier_public, ignore_errors=True)
        shutil.rmtree(self.dossier_prive, ignore_errors=True)

    def envoyer_piece(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(self.livreur)
        fichier = SimpleUploadedFile('cni.png', b'\x89PNG\r\n\x1a\n-test-', content_type='image/png')
        res = self.client.patch('/api/livreur/documents/', {'piece_identite': fichier}, format='multipart')
        self.assertEqual(res.status_code, 200)
        return res.json()['piece_identite']

    def test_fichier_hors_du_dossier_public_et_lien_protege(self):
        import os
        url = self.envoyer_piece()
        self.assertIn(f'/api/livreurs/{self.livreur.pk}/documents/piece_identite/', url)
        self.assertNotIn('/media/', url)
        self.livreur.refresh_from_db()
        self.assertTrue(os.path.exists(os.path.join(self.dossier_prive, self.livreur.piece_identite.name)))
        self.assertFalse(os.path.exists(os.path.join(self.dossier_public, self.livreur.piece_identite.name)))

    def test_le_livreur_et_l_equipe_peuvent_lire(self):
        self.envoyer_piece()
        chemin = f'/api/livreurs/{self.livreur.pk}/documents/piece_identite/'
        for qui in (self.livreur, self.admin):
            self.client.force_authenticate(qui)
            res = self.client.get(chemin)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res['Content-Type'], 'image/png')
            self.assertIn('no-store', res['Cache-Control'])
            self.assertEqual(b''.join(res.streaming_content), b'\x89PNG\r\n\x1a\n-test-')

    def test_les_autres_n_ont_pas_acces(self):
        self.envoyer_piece()
        chemin = f'/api/livreurs/{self.livreur.pk}/documents/piece_identite/'
        self.client.force_authenticate(self.autre)
        self.assertEqual(self.client.get(chemin).status_code, 404)
        self.client.force_authenticate(None)
        self.assertIn(self.client.get(chemin).status_code, (401, 403))
        self.client.force_authenticate(self.livreur)
        self.assertEqual(self.client.get(f'/api/livreurs/{self.livreur.pk}/documents/mot_de_passe/').status_code, 404)

    def test_fichier_non_image_telecharge(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(self.livreur)
        fichier = SimpleUploadedFile('piege.html', b'<script>alert(1)</script>', content_type='text/html')
        self.client.patch('/api/livreur/documents/', {'permis_conduire': fichier}, format='multipart')
        res = self.client.get(f'/api/livreurs/{self.livreur.pk}/documents/permis_conduire/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res['Content-Disposition'].startswith('attachment'))
        self.assertEqual(res['X-Content-Type-Options'], 'nosniff')
