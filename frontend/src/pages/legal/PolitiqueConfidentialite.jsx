import LegalPage from '../../components/static/LegalPage';

const SECTIONS = [
  {
    title: '1. Introduction',
    content: "La présente Politique de confidentialité a pour objectif d'informer les utilisateurs de la plateforme Yaay Vidé (site web www.yaayvide.com et application mobile) sur la collecte, l'utilisation, le partage et la protection de leurs données personnelles. Yaay Vidé s'engage à respecter la législation sénégalaise relative à la protection des données personnelles, notamment la Loi n° 2008-12 du 25 janvier 2008.",
  },
  {
    title: '2. Données collectées',
    content: "Dans le cadre de l'utilisation de la plateforme, Yaay Vidé collecte uniquement les données strictement nécessaires au bon fonctionnement de ses services : nom et prénom, adresse e-mail, numéro de téléphone, adresse de livraison, et historique des commandes et interactions.",
  },
  {
    title: '3. Utilisation des cookies et traceurs',
    content: "Lors de votre navigation, des cookies ou technologies similaires peuvent être déposés sur votre terminal, pour le fonctionnement technique (connexion, panier, sécurité des transactions) et l'amélioration du service (analyse de la fréquentation). Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités (comme la prise de commande) pourraient être affectées.",
  },
  {
    title: "4. Finalité de l'utilisation des données",
    content: "Les données personnelles collectées sont utilisées pour traiter les transactions (achat, vente, location) et assurer la livraison, fournir un support client réactif, améliorer les services et l'expérience utilisateur, et envoyer des offres promotionnelles sous réserve de votre consentement préalable.",
  },
  {
    title: '5. Partage des données',
    content: "Yaay Vidé ne vend ni ne loue les données personnelles de ses utilisateurs. Les données peuvent uniquement être partagées avec les prestataires logistiques (collecte et livraison), les prestataires de paiement (Intouch : Wave, Orange Money, Mixx by Yas, carte bancaire), et les autorités administratives ou judiciaires compétentes lorsque la loi l'exige.",
  },
  {
    title: '6. Conservation des données',
    content: "Les données personnelles sont conservées pendant cinq (5) ans à compter de la dernière activité ou transaction. Conformément aux obligations légales et comptables (Acte uniforme de l'OHADA), les données nécessaires à la justification des transactions (factures, historique des paiements) sont archivées dix (10) ans. Passé ces délais, les données sont supprimées ou anonymisées de manière sécurisée.",
  },
  {
    title: "7. Lieu d'hébergement et transfert international",
    content: "Les données personnelles collectées via la plateforme sont hébergées sur des serveurs sécurisés situés à l'étranger (hors du territoire sénégalais). Yaay Vidé s'assure que ce transfert présente des garanties de sécurité et de confidentialité conformes à la Loi n° 2008-12, et fait l'objet des formalités requises auprès de la Commission de Protection des Données Personnelles (CDP).",
  },
  {
    title: '8. Sécurité des données',
    content: "Yaay Vidé met en œuvre toutes les mesures techniques et organisationnelles nécessaires pour protéger les données personnelles contre tout accès, divulgation, modification ou destruction non autorisée.",
  },
  {
    title: '9. Droits des utilisateurs',
    content: "Conformément à la législation sénégalaise, tout utilisateur dispose d'un droit d'accès à ses données, d'un droit de rectification en cas d'informations inexactes, d'un droit de suppression dans les limites prévues par la loi, et d'un droit d'opposition au traitement de ses données à des fins marketing. Toute demande doit être adressée à contact@yaayvide.sn.",
  },
  {
    title: '10. Coordonnées de Yaay Vidé',
    content: "Pour toute question concernant cette politique ou l'exercice de vos droits : Téléphone +221 71 018 91 91 / 76 931 99 11 — Email contact@yaayvide.sn — Adresse Dakar, Sénégal.",
  },
  {
    title: '11. Modifications de la politique',
    content: "Yaay Vidé se réserve le droit de modifier la présente Politique de confidentialité afin de se conformer à toute évolution légale, réglementaire ou technique. Les utilisateurs seront informés de toute mise à jour par publication sur la plateforme.",
  },
];

export default function PolitiqueConfidentialite() {
  return <LegalPage title="Politique de confidentialité" updatedAt="juillet 2026" sections={SECTIONS} />;
}
