// frontend/src/data/categories.js
// Source unique pour les vignettes catégories de l'accueil. Les 5 premières
// sont de vraies catégories (slugs backend) ; les 2 dernières sont des
// vitrines automatiques (pas des catégories choisies manuellement) — leur
// `href` pointe vers un filtre spécial plutôt qu'un slug de catégorie.
export const CATEGORIES = [
  {
    name: "Maman & Maternité",
    slug: "maman-maternite",
    img: "https://images.unsplash.com/photo-1542385151-efd9000785a0?fm=jpg&q=75&w=900&auto=format&fit=crop",
    flagPath:
      "M12 21s-7-4.5-9.5-9C.5 8 2 4 6 4c2 0 4 1.5 6 4 2-2.5 4-4 6-4 4 0 5.5 4 3.5 8-2.5 4.5-9.5 9-9.5 9z",
  },
  {
    name: "Bébé (0-3 ans)",
    slug: "bebe",
    img: "https://images.unsplash.com/photo-1622290319146-7b63df48a635?fm=jpg&q=75&w=900&auto=format&fit=crop",
    flagPath: "M9 2h6M10 2v4l-3 3v9a2 2 0 002 2h6a2 2 0 002-2v-9l-3-3V2",
  },
  {
    name: "Enfant (3-9 ans)",
    slug: "enfant",
    img: "https://images.unsplash.com/photo-1569974641446-22542de88536?fm=jpg&q=75&w=900&auto=format&fit=crop",
    flagPath: "M6 3h9l3 4-7 14L4 7z",
  },
  {
    name: "Junior (10-15 ans)",
    slug: "junior",
    img: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?fm=jpg&q=75&w=900&auto=format&fit=crop",
    flagPath: "M6 3h9l3 4-7 14L4 7z",
  },
  {
    name: "Jeux & Jouets",
    slug: "jeux-jouets",
    img: "https://images.unsplash.com/photo-1654881609317-c3c7d43601c7?fm=jpg&q=75&w=900&auto=format&fit=crop",
    flagPath: "M12 8a4 4 0 100 8 4 4 0 000-8z",
  },
  {
    name: "Équipements scolaires",
    slug: "equipements-scolaires",
    img: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?fm=jpg&q=75&w=900&auto=format&fit=crop",
    flagPath:
      "M4 19.5V6a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v13M6 22h13M4 19.5A1.5 1.5 0 0 1 5.5 18H18",
  },
  {
    name: "Occasions spéciales",
    slug: "occasions-speciales",
    href: "/boutique?occasion=toutes",
    img: "https://images.unsplash.com/photo-1635874714425-c342060a4c58?fm=jpg&q=75&w=900&auto=format&fit=crop",
    flagPath: "M20 12V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4M2 12h20l-2 8H4l-2-8z",
  },
  {
    name: "Bonnes affaires",
    slug: "bonnes-affaires",
    href: "/boutique?bonne_affaire=true",
    img: "https://images.unsplash.com/photo-1684244160171-97f5dac39204?fm=jpg&q=75&w=900&auto=format&fit=crop",
    flagPath: "M9 7H4l1 13h14l1-13h-5M9 7V5a3 3 0 0 1 6 0v2M9 7h6",
  },
];

export function findCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}
