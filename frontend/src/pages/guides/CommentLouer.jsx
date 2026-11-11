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
    description: "Choisissez vos dates de début et de fin : les dates déjà réservées sont indiquées. La plateforme calcule le coût total (prix par jour + caution), puis vous envoyez votre demande. La vendeuse confirme sous 24 h, ou vous propose d'autres dates que vous acceptez ou refusez en un clic depuis votre compte.",
    image: imgDates,
    points: ['Dates déjà réservées indiquées', 'Calcul automatique du coût total', 'Réponse de la vendeuse sous 24 h', "D'autres dates proposées ? Vous décidez"],
    tip: {
      title: 'Réservez à l\'avance',
      description: "Les articles populaires (poussettes, lits voyage) partent vite — anticipez vos dates.",
    },
  },
  {
    title: 'Paiement et dépôt de caution',
    tag: 'Paiement',
    description: "Un récapitulatif clair présente le coût de la location et la caution (non débitée à l'avance, remboursée après retour). Le règlement se fait à la remise, via Wave, Orange Money, Mixx by Yas ou espèces.",
    image: imgPaiement,
    points: ['Récapitulatif clair avant paiement', "Caution non débitée à l'avance", 'Wave, Orange Money, Mixx by Yas ou espèces', 'Règlement à la remise uniquement'],
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
    description: "Besoin de plus de temps ? Demandez une prolongation depuis votre compte, la vendeuse l'accepte ou la refuse. La veille de la fin, vous recevez un rappel ; un livreur Yaay Vidé récupère ensuite l'article chez vous. Après contrôle chez Yaay Vidé, l'équipe vous rend votre caution (Wave, Orange Money, Mixx by Yas ou espèces). En cas de retenue, le motif vous est toujours expliqué.",
    image: imgRetour,
    points: ['Prolongation possible depuis votre compte', 'Rappel la veille de la fin', 'Récupération à domicile', 'Caution rendue après contrôle'],
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
