// frontend/src/data/articles.js
// Photo locale (WebP ~27 Ko) choisie par la cliente pour l'article « valise de maternité »
import imgValiseMaternite from '../assets/blog/valise-maternite.webp';

export const ARTICLES = [
  {
    slug: 'seconde-main-controle',
    tag: 'Guide pratique',
    tagColor: 'text-clay',
    title: "Bien choisir des articles d'occasion pour bébé : 7 points de contrôle",
    excerpt: 'Les vérifications essentielles pour acheter en seconde main l\'esprit léger, sans mauvaise surprise.',
    image: 'https://images.unsplash.com/photo-1642379831634-1eb6a4e2788d?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    readTime: '5 min',
    date: '12 juin 2026',
    content: [
      "Acheter d'occasion pour bébé permet d'économiser sans renoncer à la qualité, à condition de vérifier quelques points essentiels avant de valider son achat.",
      "1. L'état général : recherchez les traces d'usure excessive, déchirures ou taches tenaces qui ne partiraient pas au lavage.",
      "2. La sécurité : pour les équipements (chaises hautes, lits, poussettes), vérifiez que toutes les sangles et mécanismes de verrouillage fonctionnent correctement.",
      "3. Les rappels produits : un rapide coup d'œil en ligne permet de s'assurer que le modèle n'a jamais fait l'objet d'un rappel de sécurité.",
      "4. La date de fabrication : pour les sièges auto notamment, vérifiez que le produit n'a pas dépassé sa durée de vie recommandée par le fabricant.",
      "5. L'odeur : un article qui sent fort le tabac ou l'humidité cache souvent un entretien insuffisant.",
      "6. Les pièces manquantes : assurez-vous que tous les éléments (vis, harnais, housses) sont bien présents.",
      "7. La photo réelle : sur Yaay Vidé, privilégiez les annonces avec plusieurs photos prises sous différents angles plutôt que des visuels publicitaires génériques.",
      "En suivant ces quelques réflexes, la seconde main devient un vrai allié du quotidien, sans compromis sur la sécurité de votre enfant.",
    ],
  },
  {
    slug: 'seconde-main-solution-intelligente',
    tag: 'Conseils parents',
    tagColor: 'text-clay',
    title: 'Pourquoi la seconde main est une solution intelligente pour les familles',
    excerpt: 'Économie, écologie et bon sens : les trois raisons qui font de la seconde main un choix gagnant.',
    image: 'https://images.unsplash.com/photo-1622290291720-ac961c43ee30?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    readTime: '5 min',
    date: '8 juin 2026',
    content: [
      "Les enfants grandissent vite — souvent trop vite pour justifier l'achat systématique d'articles neufs qui ne serviront que quelques mois.",
      "Sur le plan économique, la seconde main permet de réduire le budget habillement et équipement de 50 à 70% par rapport au neuf.",
      "Sur le plan écologique, chaque article réutilisé évite la production d'un nouvel objet et limite les déchets textiles, un enjeu de plus en plus présent dans les foyers sénégalais.",
      "Enfin, sur le plan humain, acheter et vendre en seconde main crée du lien : chaque transaction sur Yaay Vidé connecte deux familles qui partagent les mêmes préoccupations.",
    ],
  },
  {
    slug: 'organisation-astuces-bebe',
    tag: 'Organisation',
    tagColor: 'text-teal',
    title: "S'organiser avec un bébé : nos astuces du quotidien",
    excerpt: 'Quelques habitudes simples pour alléger le quotidien avec un nouveau-né.',
    image: 'https://images.unsplash.com/photo-1632337948797-ba161d29532b?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    readTime: '3 min',
    date: '2 juin 2026',
    content: [
      "Préparer des sacs de change prêts à l'emploi, organisés par taille de vêtement, fait gagner un temps précieux dans les premiers mois.",
      "Anticiper les changements de taille en repérant à l'avance les prochains articles dont bébé aura besoin permet d'acheter ou louer au bon moment, sans précipitation.",
      "Profiter de la location pour les équipements volumineux (lit parapluie, transat) évite l'encombrement et s'adapte aux besoins réels, semaine après semaine.",
    ],
  },
  {
    slug: 'louer-plutot-quacheter',
    tag: 'Location',
    tagColor: 'text-clay',
    title: "Louer plutôt qu'acheter : ce qu'il faut savoir",
    excerpt: "Avant de réserver votre prochain équipement bébé, voici comment fonctionne la location sur Yaay Vidé.",
    image: 'https://images.unsplash.com/photo-1635874714425-c342060a4c58?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    readTime: '4 min',
    date: '28 mai 2026',
    content: [
      "La location est idéale pour les équipements utilisés sur une courte période : chaise haute pour un séjour chez les grands-parents, lit parapluie pour des vacances, poussette pour un événement ponctuel.",
      "Sur Yaay Vidé, vous choisissez vos dates directement sur la fiche produit : le prix total et la caution s'affichent instantanément.",
      "La caution, fixée par la vendeuse, vous est intégralement restituée à la fin de la location si l'article est rendu en bon état.",
      "Une fois la période choisie, un message WhatsApp pré-rempli vous met en contact direct avec la vendeuse pour organiser la remise.",
    ],
  },
  {
    slug: 'preparer-valise-maternite',
    tag: 'Maman & Maternité',
    tagColor: 'text-teal',
    title: 'Préparer sa valise de maternité sans se ruiner',
    excerpt: "La liste essentielle, version seconde main intelligente.",
    image: imgValiseMaternite,
    readTime: '4 min',
    date: '20 mai 2026',
    content: [
      "Entre les vêtements de naissance, les produits d'hygiène et le nécessaire pour la maman, la valise de maternité représente souvent un budget conséquent pour un usage très court.",
      "Les bodys et pyjamas de naissance, portés seulement quelques semaines, sont parmi les articles les mieux préservés en seconde main.",
      "Pensez à réserver vos articles à l'avance sur Yaay Vidé pour avoir le temps de les recevoir avant le jour J.",
    ],
  },
  {
    slug: 'equipements-scolaires-malins',
    tag: 'Équipements scolaires',
    tagColor: 'text-clay',
    title: 'Rentrée scolaire : les bons plans pour équiper sans exploser le budget',
    excerpt: 'Cartables, uniformes, fournitures : comment bien anticiper la rentrée.',
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    readTime: '4 min',
    date: '14 mai 2026',
    content: [
      "La rentrée scolaire représente une dépense importante chaque année, en particulier pour les familles avec plusieurs enfants.",
      "Cartables, uniformes et équipements de sport en bon état changent souvent de main avant même d'être usés — l'occasion idéale pour économiser.",
      "Publier ses anciens équipements scolaires dès la fin de l'année permet aux autres familles d'anticiper leurs achats pour la rentrée suivante.",
    ],
  },
];

export function findArticleBySlug(slug) {
  return ARTICLES.find((a) => a.slug === slug);
}
