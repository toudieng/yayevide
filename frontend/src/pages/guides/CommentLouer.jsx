import GuideSteps from '../../components/static/GuideSteps';
import heroImage from '../../assets/guides/louer-hero.webp';
import imgSelection from '../../assets/guides/louer-selection.webp';
import imgDates from '../../assets/guides/louer-dates.webp';
import imgPaiement from '../../assets/guides/louer-paiement.webp';
import imgLivraison from '../../assets/guides/louer-livraison.webp';
import imgRetour from '../../assets/guides/louer-retour.webp';

const STEPS = [
  {
    title: "Découverte et sélection de l'article",
    tag: 'Sélection',
    description: 'Explorez notre catalogue : poussettes, chaises hautes, lits de voyage et plus. Les articles disponibles à la location affichent le bouton "Louer le produit" sur leur fiche.',
    image: imgSelection,
    points: ['Catalogue dédié à la location', 'Bouton "Louer le produit" visible', 'Photos et état détaillés', 'Prix par jour affiché clairement'],
    tip: {
      title: 'Vérifiez la caution demandée',
      description: "Chaque fiche de location précise le montant de la caution avant tout engagement.",
    },
  },
  {
    title: 'Réservation des dates et de la durée',
    tag: 'Réservation',
    description: "Choisissez vos dates de début et de fin. La plateforme calcule automatiquement le coût total (prix par jour + caution) avant que vous contactiez la vendeuse via WhatsApp.",
    image: imgDates,
    points: ['Dates de début et de fin flexibles', 'Calcul automatique du coût total', 'Caution affichée séparément', 'Contact direct avec la propriétaire'],
    tip: {
      title: 'Réservez à l\'avance',
      description: "Les articles populaires (poussettes, lits voyage) partent vite — anticipez vos dates.",
    },
  },
  {
    title: 'Paiement et dépôt de caution',
    tag: 'Paiement',
    description: "Un récapitulatif clair présente le coût de la location et la caution (non débitée à l'avance, remboursée après retour). Le règlement se fait à la remise, via Wave, Orange Money ou espèces.",
    image: imgPaiement,
    points: ['Récapitulatif clair avant paiement', "Caution non débitée à l'avance", 'Wave, Orange Money ou espèces', 'Règlement à la remise uniquement'],
    tip: {
      title: 'La caution vous est acquise',
      description: "Elle n'est jamais prélevée avant la remise de l'article, et remboursée intégralement s'il revient en bon état.",
    },
  },
  {
    title: "Livraison et inspection de l'article",
    tag: 'Livraison',
    description: "L'article est collecté chez la propriétaire, vérifié (conformité, état, propreté), puis livré à domicile. Vous inspectez à votre tour l'article à la réception.",
    image: imgLivraison,
    points: ['Collecte chez la propriétaire', 'Vérification de conformité', 'Livraison à domicile', 'Inspection à la réception'],
    tip: {
      title: 'Signalez tout de suite',
      description: "Un défaut non signalé à la réception peut être imputé à tort lors du retour — vérifiez dès l'arrivée.",
    },
  },
  {
    title: 'Retour et remboursement de la caution',
    tag: 'Retour',
    description: "Un livreur récupère l'article chez vous en fin de location. Après inspection, si tout est conforme, la caution est intégralement remboursée.",
    image: imgRetour,
    points: ['Récupération à domicile en fin de location', 'Inspection systématique', 'Remboursement intégral si conforme', 'Délai de remboursement rapide'],
    tip: {
      title: "Rendez l'article comme reçu",
      description: "Nettoyez et vérifiez que tous les accessoires sont présents avant le retour.",
    },
  },
];

export default function CommentLouer() {
  return (
    <GuideSteps
      badge="Guide locataire Yaay Vidé"
      title="Comment"
      titleAccent="louer ?"
      subtitle="Un parcours simple et sécurisé pour louer des articles pour l'enfance, la maternité et la parentalité."
      heroImage={heroImage}
      steps={STEPS}
      trust={{
        eyebrow: 'Votre location reste encadrée à chaque étape',
        title: 'Vous réservez. Yaay Vidé coordonne le reste.',
        subtitle: "La caution n'est jamais débitée à l'avance, et chaque article est inspecté à l'aller comme au retour.",
        phases: ['Sélection', 'Réservation', 'Livraison', 'Retour'],
      }}
      cta={{ title: 'Envie de louer ?', subtitle: 'Découvrez les articles disponibles à la location.', to: '/boutique', label: 'Voir les articles' }}
    />
  );
}
