import GuideSteps from '../../components/static/GuideSteps';
import heroImage from '../../assets/guides/mise-hero.webp';
import imgAnnonce from '../../assets/guides/mise-annonce.webp';
import imgDemande from '../../assets/guides/mise-demande.webp';
import imgCollecte from '../../assets/guides/mise-collecte.webp';
import imgGains from '../../assets/guides/mise-gains.webp';
import imgRetour from '../../assets/guides/mise-retour.webp';

const STEPS = [
  {
    title: 'Inscription et création de votre annonce de location',
    tag: 'Publier',
    description: "Créez un compte loueuse sur le site ou l'application Yaay Vidé. Ce même compte vous permet de vendre et de louer vos articles. Depuis votre espace vendeuse, choisissez \"Ajouter un produit\", puis rédigez un titre et une description précis et honnêtes en déclarant les fonctionnalités et les éventuelles imperfections. Ajoutez plusieurs photos claires et lumineuses, sous différents angles. Indiquez ensuite le prix par jour, la caution, ainsi que le poids et la taille du colis, puis sélectionnez l'option \"Location\".",
    image: imgAnnonce,
    points: ['Titre et description honnêtes', 'Photos claires sous plusieurs angles', 'Prix par jour et caution', 'Poids, taille et option "Location"'],
    tip: {
      title: 'Une annonce transparente inspire confiance',
      description: "Montrez l'état réel de l'article, ses fonctionnalités et ses éventuelles imperfections.",
    },
  },
  {
    title: 'Gestion de la demande de location',
    tag: 'Vérification',
    description: "Les demandes arrivent dans votre espace vendeuse, rubrique Locations, avec les dates souhaitées. Vous avez 24 h pour accepter, refuser, ou proposer d'autres dates qui vous arrangent : la locataire accepte ou refuse, et si elle refuse, l'article redevient disponible. Pendant la location, vous répondez aussi aux demandes de prolongation.",
    image: imgDemande,
    points: ['Demandes reçues dans votre espace', "Accepter, refuser ou proposer d'autres dates", 'Prolongations à valider', 'Dates déjà réservées bloquées'],
    tip: {
      title: 'Répondez rapidement',
      description: "Une réponse sous quelques heures rassure la locataire et augmente vos chances de conclure la location.",
    },
  },
  {
    title: "Préparation et collecte de l'article",
    tag: 'Collecte',
    description: "Assurez-vous que l'article est propre, complet et conforme à sa description. Un livreur Yaay Vidé vient le récupérer gratuitement à votre domicile, avec une première vérification de l'état sur place avant de le transmettre à la locataire.",
    image: imgCollecte,
    points: ['Article propre et complet', 'Collecte gratuite à domicile', "Vérification de l'état sur place", 'Livraison organisée par Yaay Vidé'],
    tip: {
      title: 'Un article bien entretenu se loue plus souvent',
      description: "Nettoyez et vérifiez le bon fonctionnement de l'article avant chaque collecte.",
    },
  },
  {
    title: 'Réception de vos gains',
    tag: 'Paiement',
    description: "Le règlement (Wave, Orange Money, Mixx by Yas ou espèces) est encaissé au moment précis de la livraison chez la locataire. Votre part vous est ensuite reversée, commission déduite, selon la fréquence de retrait que vous avez choisie.",
    image: imgGains,
    points: ['Paiement encaissé à la livraison', 'Wave, Orange Money, Mixx by Yas ou espèces', 'Commission déduite automatiquement', 'Retrait selon votre fréquence'],
    tip: {
      title: 'Suivez vos gains en temps réel',
      description: "Le tableau de bord vendeuse affiche le détail de chaque location payée.",
    },
  },
  {
    title: 'Retour, inspection et finalisation',
    tag: 'Restitution',
    description: "En fin de location, un livreur récupère l'article chez la locataire et l'apporte chez Yaay Vidé, où notre équipe le contrôle. La caution est ensuite rendue à la locataire (en totalité, ou en partie avec un motif en cas de dommage), et votre article vous est restitué. Les jours de prolongation éventuels sont encaissés au retour et ajoutés à vos gains.",
    image: imgRetour,
    points: ['Récupération chez la locataire', 'Inspection systématique', 'Caution remboursée si conforme', 'Article restitué rapidement'],
    tip: {
      title: 'Un litige ? Nous sommes là',
      description: "En cas de dommage constaté, notre équipe examine la situation avant toute décision.",
    },
  },
];

export default function CommentMettreEnLocation() {
  return (
    <GuideSteps
      badge="Guide propriétaire Yaay Vidé"
      title="Comment mettre en"
      titleAccent="location ?"
      subtitle="Faites fructifier ce qui dort dans vos placards, sans vous en séparer définitivement."
      heroImage={heroImage}
      steps={STEPS}
      trust={{
        eyebrow: 'Votre bien reste encadré à chaque étape',
        title: 'Vous mettez en location. Yaay Vidé coordonne le reste.',
        subtitle: "De la vérification de la locataire au retour de l'article, chaque étape est suivie par notre équipe pour que la transaction se passe en toute confiance.",
        phases: ['Annonce', 'Vérification', 'Collecte et livraison', 'Retour et restitution'],
      }}
      cta={{ title: 'Prête à louer vos articles ?', subtitle: 'Publiez votre premier article en location.', to: '/vendeuse/ajouter-produit', label: 'Ajouter un article' }}
    />
  );
}
