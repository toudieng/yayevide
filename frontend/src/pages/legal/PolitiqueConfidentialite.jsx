import LegalPage from '../../components/static/LegalPage';

// Texte fourni par Yaay Vidé (Politique_de_Confidentialite_final_1.docx).
const SECTIONS = [
  {
    title: "1. Introduction",
    content: "La présente Politique de confidentialité a pour objectif d'informer les utilisateurs de la plateforme Yaay Vidé (site web www.yaayvide.com et application mobile) sur la collecte, l'utilisation, le partage et la protection de leurs données personnelles.\n\nYaay Vidé s'engage à respecter la législation sénégalaise relative à la protection des données personnelles, notamment la Loi n° 2008-12 du 25 janvier 2008, et à garantir la confidentialité des informations confiées par ses utilisateurs.",
  },
  {
    title: "2. Données collectées",
    content: "Dans le cadre de l'utilisation de la plateforme, Yaay Vidé collecte uniquement les données strictement nécessaires au bon fonctionnement de ses services :\n• Nom et prénom\n• Adresse e-mail\n• Numéro de téléphone\n• Adresse de livraison\n• Historique des commandes et interactions",
  },
  {
    title: "3. Utilisation des cookies et traceurs",
    content: "Lors de votre navigation sur le site web ou l'application mobile Yaay Vidé, des cookies (fichiers textes) ou technologies similaires peuvent être déposés sur votre terminal. Ces traceurs ont pour finalités :\n• Fonctionnement technique : assurer la connexion à votre compte, mémoriser votre panier et garantir la sécurité des transactions.\n• Amélioration du service : analyser la fréquentation et l'utilisation de la plateforme pour optimiser l'expérience utilisateur.\n\nVous avez la possibilité de configurer votre navigateur ou les paramètres de votre mobile pour refuser les cookies. Toutefois, notez que certaines fonctionnalités de la plateforme (comme la prise de commande) pourraient être affectées par cette désactivation.",
  },
  {
    title: "4. Finalité de l'utilisation des données",
    content: "Les données personnelles collectées sont utilisées pour :\n• Traiter les transactions (achat, vente, location) et assurer la livraison des articles.\n• Fournir un support client réactif et adapté.\n• Améliorer les services proposés et l'expérience utilisateur sur la plateforme.\n• Envoyer des offres promotionnelles et communications marketing, sous réserve du consentement préalable de l'utilisateur.",
  },
  {
    title: "5. Partage des données",
    content: "Yaay Vidé ne vend ni ne loue les données personnelles de ses utilisateurs. Les données peuvent uniquement être partagées avec :\n• Les prestataires logistiques (services de collecte et de livraison).\n• Les prestataires de paiement (Intouch : Wave, Orange Money, Mixx by Yas, carte bancaire).\n• Les autorités administratives ou judiciaires compétentes, lorsque la loi l'exige.",
  },
  {
    title: "6. Conservation des données",
    content: "Les données personnelles sont conservées pendant une durée de cinq (5) ans à compter de la dernière activité ou transaction effectuée sur la plateforme.\n\nToutefois, conformément aux obligations légales et comptables (notamment l'Acte uniforme de l'OHADA relatif au droit comptable), les données nécessaires à la justification des transactions (factures, historique des paiements) sont archivées pour une durée de dix (10) ans. Passé ces délais, les données seront supprimées ou anonymisées de manière sécurisée.",
  },
  {
    title: "7. Lieu d'hébergement et transfert international",
    content: "Les données personnelles collectées via la plateforme Yaay Vidé sont hébergées sur des serveurs sécurisés situés à l'étranger (hors du territoire sénégalais).\n\nYaay Vidé s'assure que ce transfert présente des garanties de sécurité et de confidentialité conformes aux exigences de la Loi n° 2008-12. Ce transfert de données fait l'objet des formalités requises auprès de la Commission de Protection des Données Personnelles (CDP).",
  },
  {
    title: "8. Sécurité des données",
    content: "Yaay Vidé met en œuvre toutes les mesures techniques et organisationnelles nécessaires pour protéger les données personnelles contre tout accès, divulgation, modification ou destruction non autorisée.",
  },
  {
    title: "9. Droits des utilisateurs",
    content: "Conformément à la législation sénégalaise sur la protection des données personnelles, tout utilisateur dispose des droits suivants :\n• Droit d'accès à ses données personnelles.\n• Droit de rectification en cas d'informations inexactes ou incomplètes.\n• Droit de suppression de ses données, dans les limites prévues par la loi.\n• Droit d'opposition au traitement de ses données à des fins marketing.\n\nToute demande relative à l'exercice de ces droits doit être adressée à l'adresse suivante : contact@yaayvide.sn",
  },
  {
    title: "10. Coordonnées de Yaay Vidé",
    content: "Pour toute question concernant la présente Politique de confidentialité, l'exercice de vos droits ou le traitement de vos données, vous pouvez nous contacter :\n• Téléphone : +221 71 018 91 91 / 76 931 99 11\n• Email : contact@yaayvide.sn\n• Adresse : Dakar, Sénégal",
  },
  {
    title: "11. Modifications de la politique",
    content: "Yaay Vidé se réserve le droit de modifier la présente Politique de confidentialité afin de se conformer à toute évolution légale, réglementaire ou technique. Les utilisateurs seront informés de toute mise à jour par publication sur la plateforme.",
  },
];

export default function PolitiqueConfidentialite() {
  return <LegalPage title="Politique de confidentialité" updatedAt="novembre 2026" sections={SECTIONS} />;
}
