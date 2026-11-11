// frontend/src/data/rayons.js
// Rayons de la section « Bonnes affaires » de l'accueil. Chaque rayon
// regroupe des sous-catégories réelles de la base (noms exacts, cf.
// migrations 0022/0026 du backend), toutes catégories principales confondues.
export const RAYONS = [
  {
    slug: "tenues-de-fete",
    nom: "Tenues de fête",
    sousCategories: [
      "Tenues de fête", "Tenues de cérémonie", "Tenues traditionnelles",
      "Boubous", "Ensembles traditionnels", "Robes traditionnelles",
    ],
  },
  {
    slug: "chaussures-de-fete",
    nom: "Chaussures de fête",
    sousCategories: ["Chaussures de cérémonie", "Chaussures traditionnelles"],
  },
  {
    slug: "sacs-accessoires",
    nom: "Sacs & accessoires",
    sousCategories: [
      "Sacs", "Cartables & Sacs", "Sacs à langer", "Sacs maternité",
      "Accessoires traditionnels", "Ceintures", "Chapeaux", "Casquettes",
    ],
  },
  {
    slug: "deguisements",
    nom: "Déguisements",
    sousCategories: ["Déguisements", "Masques", "Perruques", "Accessoires de spectacle", "Costumes"],
  },
  {
    slug: "decorations-occasion",
    nom: "Décorations d'occasion",
    sousCategories: ["Décoration fête", "Décoration naissance", "Ballons de fête"],
  },
];

export function trouverRayon(slug) {
  return RAYONS.find((r) => r.slug === slug) || null;
}
