import LegalPage from '../../components/static/LegalPage';

const SECTIONS = [
  {
    title: '1. Ventes fermes et définitives',
    content: "Chaque article proposé sur Yaay Vidé fait l'objet d'un contrôle qualité avant expédition. Une fois la commande livrée et le paiement effectué, la vente est ferme et définitive : Yaay Vidé n'organise ni retour, ni échange, ni remboursement d'articles, quelle qu'en soit la raison, y compris un simple changement d'avis.",
  },
  {
    title: '2. Centre de plainte',
    content: "En cas de problème avéré avec une commande (article non conforme à la description, manquant, ou visiblement endommagé à la livraison), l'acheteuse peut déposer une plainte via le Centre de plainte, accessible depuis son compte. Chaque plainte est examinée individuellement par l'équipe Yaay Vidé, qui reste seule juge des suites à y donner — la plainte n'entraîne pas automatiquement de retour ni de remboursement.",
  },
  {
    title: '3. Objectif du centre de plainte',
    content: "Le centre de plainte n'est pas un guichet de remboursement : il sert à signaler un problème pour que Yaay Vidé puisse, le cas échéant, sensibiliser ou sanctionner une vendeuse ne respectant pas ses engagements (article non conforme, retard répété...), afin d'améliorer la qualité générale de la plateforme.",
  },
  {
    title: '4. Cas des locations',
    content: "Les articles loués suivent des règles différentes : la caution est remboursée à la fin de la location si l'article est rendu conforme à son état de départ, conformément aux conditions affichées sur chaque annonce de location.",
  },
  {
    title: '5. Coordonnées',
    content: "Téléphone : +221 71 018 91 91 / 76 931 99 11 — Email : contact@yaayvide.com — Adresse : Dakar, Sénégal.",
  },
];

export default function PolitiqueRetour() {
  return <LegalPage title="Politique de vente et centre de plainte" updatedAt="juillet 2026" sections={SECTIONS} />;
}
