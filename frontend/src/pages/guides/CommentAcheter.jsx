import GuideSteps from '../../components/static/GuideSteps';
import heroImage from '../../assets/guides/achat-hero.jpg';
import imgPaiement from '../../assets/guides/achat-paiement.jpg';
import imgConfirmation from '../../assets/guides/achat-confirmation.jpg';
import imgLivraison from '../../assets/guides/achat-livraison.jpg';
import imgColis from '../../assets/guides/achat-colis.jpg';

const STEPS = [
  {
    title: 'Parcourez le catalogue et ajoutez au panier',
    tag: 'Sélection',
    description: "Plongez dans notre sélection d'articles pour bébés, enfants et mamans. Utilisez la recherche ou les catégories pour trouver votre bonheur, puis ajoutez-le au panier — aucun compte requis pour naviguer.",
    image: heroImage,
    points: ['Recherche par mot-clé ou catégorie', 'Fiches produit détaillées', 'Navigation libre sans compte', 'Ajout au panier en un clic'],
    tip: {
      title: 'Comparez avant de choisir',
      description: "Consultez l'état, les photos et les avis de la boutique avant d'ajouter un article au panier.",
    },
  },
  {
    title: 'Choisissez votre adresse et votre mode de paiement',
    tag: 'Commande',
    description: "Renseignez votre adresse de livraison (par zone, pour un calcul juste des frais) et choisissez comment vous réglerez : Wave, Orange Money ou espèces. Vous ne payez rien à cette étape — le règlement se fait uniquement à la livraison.",
    image: imgPaiement,
    points: ['Adresse renseignée par zone', 'Frais de livraison calculés automatiquement', 'Wave, Orange Money ou espèces', 'Aucun débit à la commande'],
    tip: {
      title: "Rien n'est débité maintenant",
      description: "Le paiement n'a lieu qu'au moment où vous recevez réellement votre colis.",
    },
  },
  {
    title: 'La vendeuse confirme la disponibilité',
    tag: 'Vérification',
    description: "La vendeuse dispose de 24 heures maximum pour confirmer que l'article est toujours disponible. Si elle ne répond pas ou indique que l'article n'est plus disponible, votre commande est annulée sans qu'aucun paiement n'ait eu lieu.",
    image: imgConfirmation,
    points: ['Réponse sous 24h maximum', 'Confirmation ou annulation claire', 'Aucun paiement en jeu', 'Vous êtes informée du résultat'],
    tip: {
      title: 'Pas de nouvelles, pas de souci',
      description: "Sans réponse de la vendeuse sous 24h, la commande est automatiquement annulée.",
    },
  },
  {
    title: 'Livraison et paiement sécurisé',
    tag: 'Livraison',
    description: "Une fois la commande confirmée, l'article est collecté chez la vendeuse, contrôlé, puis livré chez vous. Vous réglez à ce moment précis, selon le mode choisi — via Wave/Orange Money (paiement InTouch déclenché à la livraison) ou en espèces au livreur.",
    image: imgLivraison,
    points: ['Collecte chez la vendeuse', 'Contrôle qualité avant expédition', 'Livraison sous 24 à 48h', 'Paiement au moment de la remise'],
    tip: {
      title: 'Vérifiez à la réception',
      description: "Inspectez votre article devant le livreur avant de finaliser le paiement.",
    },
  },
  {
    title: 'Réceptionnez votre colis vérifié',
    tag: 'Réception',
    description: "Chaque article passe un contrôle qualité avant expédition. Les ventes sont fermes et définitives — en cas de problème avéré à la réception, le Centre de plainte accessible depuis votre compte permet de le signaler à notre équipe.",
    image: imgColis,
    points: ['Contrôle qualité systématique', 'Ventes fermes et définitives', 'Centre de plainte disponible', 'Examen individuel par notre équipe'],
    tip: {
      title: 'Un souci après réception ?',
      description: "Le Centre de plainte, accessible depuis votre compte, permet de signaler tout problème avéré.",
    },
  },
];

export default function CommentAcheter() {
  return (
    <GuideSteps
      badge="Guide acheteuse Yaay Vidé"
      title="Comment"
      titleAccent="acheter ?"
      subtitle="Votre parcours d'achat, simplifié et sécurisé — vous ne payez qu'à la livraison."
      heroImage={heroImage}
      steps={STEPS}
      trust={{
        eyebrow: 'Votre argent reste protégé à chaque étape',
        title: 'Vous commandez. Yaay Vidé sécurise le reste.',
        subtitle: "Aucun paiement n'est débité avant la confirmation de la vendeuse, et le règlement final ne se fait qu'à la remise de votre colis.",
        phases: ['Commande', 'Confirmation', 'Livraison', 'Réception'],
      }}
      cta={{ title: 'Prête à chiner ?', subtitle: 'Découvrez les articles disponibles dès maintenant.', to: '/boutique', label: 'Voir la boutique' }}
    />
  );
}
