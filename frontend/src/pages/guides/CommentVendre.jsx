import GuideSteps from '../../components/static/GuideSteps';
import heroImage from '../../assets/guides/vendre-compte.webp';
import imgPublier from '../../assets/guides/vendre-publier.webp';
import imgCollecte from '../../assets/guides/vendre-collecte.webp';
import imgLivraison from '../../assets/guides/vendre-livraison.webp';
import imgPaiement from '../../assets/guides/vendre-paiement.webp';

const STEPS = [
  {
    title: 'Créez votre compte vendeuse',
    tag: 'Compte',
    description: "Rendez-vous sur le site, cliquez sur \"Vendre / Louer\", puis complétez votre profil et le nom de votre boutique — un profil complet inspire confiance aux acheteuses.",
    image: heroImage,
    points: ['Inscription en quelques minutes', 'Nom de boutique personnalisé', 'Profil vérifié par WhatsApp ou email', 'Zone renseignée pour la livraison'],
    tip: {
      title: 'Un profil complet vend mieux',
      description: "Une bio soignée et une zone renseignée rassurent les acheteuses dès le premier coup d'œil.",
    },
  },
  {
    title: 'Publiez vos articles',
    tag: 'Publication',
    description: "Photos sous plusieurs angles à la lumière du jour, description honnête (état, marque, dimensions), prix juste, et taille du colis pour le calcul des frais de livraison affichés à l'acheteuse.",
    image: imgPublier,
    points: ['Photos nettes sous plusieurs angles', 'Description honnête et précise', 'Prix juste et compétitif', 'Taille du colis renseignée'],
    tip: {
      title: 'La lumière naturelle change tout',
      description: "Photographiez vos articles près d'une fenêtre, jamais avec un flash direct.",
    },
  },
  {
    title: 'Confirmez la commande sous 24h',
    tag: 'Confirmation',
    description: "Dès qu'un article est commandé, vous êtes notifiée. Vous avez 24 heures maximum pour confirmer qu'il est toujours disponible — aucun paiement n'a encore eu lieu à ce stade, ni pour vous ni pour l'acheteuse.",
    image: imgCollecte,
    points: ['Notification immédiate', '24h maximum pour répondre', 'Aucun paiement encore engagé', 'Annulation simple si indisponible'],
    tip: {
      title: 'Répondez vite pour ne rien perdre',
      description: "Passé le délai de 24h, la commande est automatiquement annulée et vous perdez la vente.",
    },
  },
  {
    title: 'Collecte et vérification',
    tag: 'Collecte',
    description: "Une fois confirmé, un livreur Yaay Vidé vient récupérer l'article chez vous gratuitement, avec un contrôle de conformité, avant de le livrer à l'acheteuse sous 24 à 48h.",
    image: imgLivraison,
    points: ['Collecte gratuite à domicile', 'Contrôle de conformité sur place', 'Livraison sous 24 à 48h', 'Suivi visible depuis votre tableau de bord'],
    tip: {
      title: 'Emballez soigneusement',
      description: "Un article bien protégé arrive en meilleur état et limite les litiges à la livraison.",
    },
  },
  {
    title: 'Recevez votre paiement',
    tag: 'Paiement',
    description: "Le paiement (Wave, Orange Money ou espèces) est encaissé au moment précis de la livraison, puis votre part vous est reversée — commission déduite — selon la fréquence de retrait choisie.",
    image: imgPaiement,
    points: ['Paiement encaissé à la livraison', 'Commission déduite automatiquement', 'Wave, Orange Money ou espèces', 'Retrait selon votre fréquence'],
    tip: {
      title: 'Suivez vos ventes en direct',
      description: "Le tableau de bord vendeuse affiche le détail de chaque commande, du paiement à la livraison.",
    },
  },
];

export default function CommentVendre() {
  return (
    <GuideSteps
      badge="Guide vendeuse Yaay Vidé"
      title="Comment"
      titleAccent="vendre ?"
      subtitle="Vendez vos articles simplement et en toute sécurité."
      heroImage={heroImage}
      steps={STEPS}
      note={{
        title: 'Comprendre les commissions et les frais',
        content: `Une commission de 10% est prélevée sur le prix de vente (5% pour le tout premier article des 100 premières boutiques inscrites). L'acheteuse ne voit que le prix final, commission incluse.

Exemple : pour une poussette vendue 50 000 FCFA, la commission (10%) est de 5 000 FCFA — vous recevez 45 000 FCFA net.

Bon à savoir : ne mettez en ligne que des articles réellement disponibles. Un article confirmé indisponible à répétition peut entraîner une suspension du compte.`,
      }}
      trust={{
        eyebrow: 'Votre commande reste encadrée à chaque étape',
        title: 'Vous publiez. Yaay Vidé coordonne le reste.',
        subtitle: "De la confirmation à la collecte, chaque étape est suivie par notre équipe pour que la transaction se passe en toute confiance.",
        phases: ['Publication', 'Confirmation', 'Collecte', 'Paiement'],
      }}
      cta={{ title: 'Prête à vendre ?', subtitle: 'Créez votre boutique en quelques minutes.', to: '/inscription', label: 'Devenir vendeuse' }}
    />
  );
}
