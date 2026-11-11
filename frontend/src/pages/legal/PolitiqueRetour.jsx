import LegalPage from '../../components/static/LegalPage';

// Texte fourni par Yaay Vidé (Politique_de_Retour_et_de_Remboursement_final_1.docx).
const SECTIONS = [
  {
    title: "1. Principes",
    content: "Yaay Vidé met en place un contrôle qualité préalable afin de s'assurer de la conformité des articles proposés sur sa plateforme.\nCependant, afin de protéger les acheteurs, un système de retour et de remboursement est prévu dans certaines situations exceptionnelles.",
  },
  {
    title: "2. Délai de réclamation",
    content: "L'acheteur dispose d'un délai de 24 heures après réception de l'article pour signaler l'un des cas suivants :\n• Un article non conforme à la description publiée sur la plateforme\n• Un défaut majeur non mentionné dans l'annonce\n• Un dommage constaté et clairement imputable au transport\n\nToute réclamation formulée au-delà de ce délai ne pourra être prise en compte.",
  },
  {
    title: "3. Procédure de retour",
    content: "Pour engager une procédure de retour, l'acheteur doit :\n1. Contacter le service client via WhatsApp, email ou formulaire de contact disponible sur la plateforme.\n2. Fournir des photos claires et précises du problème rencontré.\n3. Attendre la validation du retour par l'équipe Yaay Vidé avant toute réexpédition ou remboursement.",
  },
  {
    title: "4. Cas non éligibles",
    content: "Aucun retour ni remboursement ne sera accepté dans les cas suivants :\n• Un simple changement d'avis de l'acheteur\n• Des dommages causés par l'acheteur après réception de l'article\n• Des articles explicitement vendus « en l'état » dans l'annonce",
  },
  {
    title: "5. Solutions proposées",
    content: "Après examen du dossier, Yaay Vidé pourra, à sa seule discrétion, proposer :\n• Un échange avec un article similaire disponible\n• Un remboursement intégral du montant payé\n• L'émission d'un avoir valable sur la plateforme Yaay Vidé",
  },
  {
    title: "6. Coordonnées du service client",
    content: "Pour toute demande relative à un retour ou un remboursement, merci de contacter :\n• Téléphone : +221 71 018 91 91 / 76 931 99 11\n• Email : contact@yaayvide.com\n• Adresse : Dakar, Sénégal",
  },
];

export default function PolitiqueRetour() {
  return <LegalPage title="Politique de retour et de remboursement" updatedAt="novembre 2026" sections={SECTIONS} />;
}
