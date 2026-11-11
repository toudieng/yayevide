import LegalPage from '../../components/static/LegalPage';

// Texte fourni par Yaay Vidé (CGV_final_1.docx).
const SECTIONS = [
  {
    title: "Article 1 — Objet",
    content: "Les présentes Conditions Générales de Vente (ci-après « CGV ») ont pour objet de définir les droits et obligations applicables dans le cadre de l'utilisation de la plateforme Yaay Vidé (site web et application mobile), permettant la mise en relation entre :\n• les vendeuses et loueuses souhaitant proposer des articles de seconde main ou neufs ;\n• les acheteuses et locataires souhaitant acquérir ou louer ces articles.\n\nLa plateforme couvre les articles liés à l'enfance, la maternité, la parentalité et certaines catégories féminines.",
  },
  {
    title: "Article 2 — Acceptation des CGV",
    content: "L'accès, l'inscription ou l'utilisation de la plateforme, que ce soit pour acheter, vendre ou louer, implique l'acceptation pleine et entière des présentes CGV.\nCes CGV prévalent sur tout autre document non expressément validé par Yaay Vidé.\n\nLa société se réserve le droit de modifier les CGV à tout moment. Les nouvelles dispositions s'appliqueront dès leur publication sur la plateforme.",
  },
  {
    title: "Article 3 — Accès et inscription",
    content: "• L'inscription est gratuite et obligatoire pour publier un article en vente ou en location.\n• L'utilisateur s'engage à fournir des informations exactes, complètes et à jour.\n• Yaay Vidé se réserve le droit de suspendre ou supprimer tout compte en cas de fraude, de non-respect des CGV ou de comportement portant préjudice à la plateforme ou à ses utilisateurs.",
  },
  {
    title: "Article 4 — Règles relatives à la vente et à la location",
    content: "4.1 Publication des articles\n• Les articles doivent appartenir aux catégories autorisées (liste disponible sur la plateforme).\n• La description doit être conforme à la réalité et accompagnée de photos de bonne qualité.\n• Les articles interdits (contrefaçons, produits dangereux ou prohibés) seront supprimés.\n• En cas de récidive, le compte de la vendeuse pourra être suspendu ou supprimé.\n\n4.2 Prix et paiement\n• Le prix est fixé librement par la vendeuse.\n• Les paiements sont effectués via Intouch (Wave, Orange Money, Mixx by Yas, carte bancaire).\n• Les fonds sont conservés en séquestre jusqu'à confirmation de la réception par l'acheteuse.\n\nFrais applicables :\n• Commission variable : autour de 8 % du prix de vente ;\n• Frais de livraison (acheteuse) : à partir de 1 500 FCFA ;\n• Frais Intouch : variables entre 1,5 et 3 % en fonction du mode de paiement (intégrés dans la structure de coûts) ;\n• Frais de récupération de gains : 1 %, conformément aux exigences de Wave et Orange Money selon les nouvelles normes légales en vigueur (non intégrés dans la structure de coûts).\n\n4.3 Location d'articles\n• Certaines catégories d'articles peuvent être proposées à la location.\n• La location peut nécessiter le versement d'une caution par la locataire.\n• Les articles loués peuvent faire l'objet d'un contrôle qualité lors de la remise et du retour.\n• Les conditions spécifiques (durée, montant de la caution, modalités de restitution) sont définies lors de la réservation.",
  },
  {
    title: "Article 5 — Collecte et livraison",
    content: "• La collecte et la livraison sont assurées par le service interne Yaay Vidé, dans les zones couvertes (actuellement la région de Dakar).\n• Délai indicatif : 24 à 48 heures après validation du contrôle qualité.\n• La remise en main propre entre utilisateurs est strictement interdite.\n• Les frais de collecte et de livraison sont fixes et non remboursables, sauf en cas d'erreur imputable à Yaay Vidé.",
  },
  {
    title: "Article 6 — Contrôle qualité",
    content: "• Tout article déposé est soumis à un contrôle qualité (conformité à l'annonce, état général, propreté).\n• En cas de non-conformité, l'article est refusé et retourné à la vendeuse, à ses frais.\n• Yaay Vidé peut suspendre ou fermer un compte en cas de publications répétées d'articles non conformes.",
  },
  {
    title: "Article 7 — Réclamations et litiges",
    content: "• Toute réclamation doit être formulée auprès du service client dans un délai de 48 heures après réception de l'article.\n• Yaay Vidé privilégie le règlement amiable (remboursement, échange, avoir).\n• La responsabilité de la plateforme se limite à la bonne exécution des transactions et à la sécurisation financière.\n• La plateforme ne peut se substituer aux utilisateurs dans le cadre d'éventuelles actions judiciaires entre eux.",
  },
  {
    title: "Article 8 — Responsabilités",
    content: "• Yaay Vidé est tenue à une obligation de moyens et non de résultat.\n• Les vendeuses sont seules responsables de la conformité légale et matérielle des articles proposés.\n• La plateforme décline toute responsabilité en cas de perte, dommage ou retard imputable à un transporteur tiers (hors livraison interne).",
  },
  {
    title: "Article 9 — Propriété intellectuelle",
    content: "Tous les éléments visuels, logos, textes, graphismes, codes et bases de données de la plateforme sont la propriété exclusive de Yaay Vidé.\nToute reproduction, même partielle, est strictement interdite sans autorisation préalable.",
  },
  {
    title: "Article 10 — Données personnelles",
    content: "• Yaay Vidé collecte et traite les données des utilisateurs dans le respect de la législation sénégalaise relative à la protection des données personnelles.\n• Les données ne sont ni revendues ni transmises à des tiers, sauf exigence légale.\n• Elles sont utilisées uniquement pour les besoins liés au fonctionnement des services.",
  },
  {
    title: "Article 11 — Force majeure",
    content: "En cas d'événement imprévisible et indépendant de la volonté de Yaay Vidé (panne, catastrophe naturelle, troubles sociaux, etc.), la responsabilité de la plateforme ne saurait être engagée.",
  },
  {
    title: "Article 12 — Loi applicable et juridiction compétente",
    content: "Les présentes CGV sont soumises au droit sénégalais.\nTout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des tribunaux de Dakar.",
  },
];

export default function CGV() {
  return <LegalPage title="Conditions générales de vente" updatedAt="novembre 2026" sections={SECTIONS} />;
}
