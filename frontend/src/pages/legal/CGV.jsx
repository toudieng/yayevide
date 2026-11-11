import LegalPage from '../../components/static/LegalPage';

const SECTIONS = [
  {
    title: '1. Objet',
    content: "Les présentes Conditions Générales de Vente (CGV) définissent les droits et obligations applicables dans le cadre de l'utilisation de la plateforme Yaay Vidé (site web et application mobile), permettant la mise en relation entre les vendeuses et loueuses souhaitant proposer des articles de seconde main ou neufs, et les acheteuses et locataires souhaitant les acquérir ou les louer. La plateforme couvre les articles liés à l'enfance, la maternité, la parentalité et certaines catégories féminines.",
  },
  {
    title: '2. Acceptation des CGV',
    content: "L'accès, l'inscription ou l'utilisation de la plateforme, que ce soit pour acheter, vendre ou louer, implique l'acceptation pleine et entière des présentes CGV, qui prévalent sur tout autre document non expressément validé par Yaay Vidé. Yaay Vidé se réserve le droit de modifier les CGV à tout moment ; les nouvelles dispositions s'appliquent dès leur publication sur la plateforme.",
  },
  {
    title: '3. Accès et inscription',
    content: "L'inscription est gratuite et obligatoire pour publier un article en vente ou en location. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour. Yaay Vidé se réserve le droit de suspendre ou supprimer tout compte en cas de fraude, de non-respect des CGV ou de comportement portant préjudice à la plateforme ou à ses utilisateurs.",
  },
  {
    title: '4. Règles relatives à la vente et à la location',
    content: `4.1 Publication des articles — Les articles doivent appartenir aux catégories autorisées. La description doit être conforme à la réalité et accompagnée de photos de bonne qualité. Les articles interdits (contrefaçons, produits dangereux ou prohibés) seront supprimés, et en cas de récidive, le compte de la vendeuse pourra être suspendu ou supprimé.

4.2 Prix et paiement — Le prix est fixé librement par la vendeuse. Les paiements sont effectués via Intouch (Wave, Orange Money, Mixx by Yas, carte bancaire) et les fonds sont conservés en séquestre jusqu'à confirmation de la réception par l'acheteuse. Frais applicables : commission variable autour de 8% du prix de vente, frais de livraison à partir de 1500 FCFA (à la charge de l'acheteuse), frais Intouch entre 1,5% et 3% selon le mode de paiement, et frais de récupération des gains de 1% (Wave/Orange Money, non intégrés à la structure de coûts).

4.3 Location d'articles — Certaines catégories peuvent être proposées à la location, avec versement d'une caution par la locataire. Les articles loués peuvent faire l'objet d'un contrôle qualité à la remise et au retour. Les conditions spécifiques (durée, montant de la caution, modalités de restitution) sont définies lors de la réservation.`,
  },
  {
    title: '5. Collecte et livraison',
    content: "La collecte et la livraison sont assurées par le service interne Yaay Vidé, dans les zones couvertes (actuellement la région de Dakar), sous un délai indicatif de 24 à 48 heures après validation du contrôle qualité. La remise en main propre entre utilisateurs est strictement interdite. Les frais de collecte et de livraison sont fixes et non remboursables, sauf erreur imputable à Yaay Vidé.",
  },
  {
    title: '6. Contrôle qualité',
    content: "Tout article déposé est soumis à un contrôle qualité (conformité à l'annonce, état général, propreté). En cas de non-conformité, l'article est refusé et retourné à la vendeuse, à ses frais. Yaay Vidé peut suspendre ou fermer un compte en cas de publications répétées d'articles non conformes.",
  },
  {
    title: '7. Réclamations et centre de plainte',
    content: "Les ventes sont fermes et définitives : Yaay Vidé n'organise pas de retour, d'échange ni de remboursement d'articles vendus, chaque article faisant l'objet d'un contrôle qualité avant expédition. En cas de problème avéré avec une commande (article non conforme, manquant ou endommagé à la livraison), l'acheteuse peut déposer une plainte via le Centre de plainte accessible depuis son compte. Chaque plainte est examinée individuellement par l'équipe Yaay Vidé, qui reste seule juge de la suite à donner. La responsabilité de la plateforme se limite à la bonne exécution des transactions et à la sécurisation financière ; elle ne peut se substituer aux utilisateurs dans le cadre d'éventuelles actions judiciaires entre eux.",
  },
  {
    title: '8. Responsabilités',
    content: "Yaay Vidé est tenue à une obligation de moyens et non de résultat. Les vendeuses sont seules responsables de la conformité légale et matérielle des articles proposés. La plateforme décline toute responsabilité en cas de perte, dommage ou retard imputable à un transporteur tiers (hors livraison interne).",
  },
  {
    title: '9. Propriété intellectuelle',
    content: "Tous les éléments visuels, logos, textes, graphismes, codes et bases de données de la plateforme sont la propriété exclusive de Yaay Vidé. Toute reproduction, même partielle, est strictement interdite sans autorisation préalable.",
  },
  {
    title: '10. Données personnelles',
    content: "Yaay Vidé collecte et traite les données des utilisateurs dans le respect de la législation sénégalaise relative à la protection des données personnelles. Les données ne sont ni revendues ni transmises à des tiers, sauf exigence légale, et sont utilisées uniquement pour les besoins liés au fonctionnement des services.",
  },
  {
    title: '11. Force majeure',
    content: "En cas d'événement imprévisible et indépendant de la volonté de Yaay Vidé (panne, catastrophe naturelle, troubles sociaux, etc.), la responsabilité de la plateforme ne saurait être engagée.",
  },
  {
    title: '12. Loi applicable et juridiction compétente',
    content: "Les présentes CGV sont soumises au droit sénégalais. Tout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des tribunaux de Dakar.",
  },
];

export default function CGV() {
  return <LegalPage title="Conditions générales de vente" updatedAt="juillet 2026" sections={SECTIONS} />;
}
