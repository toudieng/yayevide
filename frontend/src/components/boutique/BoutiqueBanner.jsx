// frontend/src/components/boutique/BoutiqueBanner.jsx
import { findCategoryBySlug } from '../../data/categories';
import Reveal from '../ui/Reveal';
// Même photo que l'accueil (locale, WebP ~80 Ko) pour toutes les bannières :
// les photos de catégorie sont trop petites pour une bannière pleine largeur
// (elles restent sur les cartes de catégories de l'accueil).
import DEFAULT_IMG from '../../assets/hero-maman-bebe.webp';

export default function BoutiqueBanner({ categorieSlug }) {
  const cat = findCategoryBySlug(categorieSlug);

  return (
    <div className="relative h-[220px] sm:h-[280px] overflow-hidden">
      <img
        key={categorieSlug || 'all'}
        src={DEFAULT_IMG}
        alt={cat ? cat.name : 'Tous les articles'}
        className="absolute inset-0 h-full w-full object-cover object-[50%_22%] animate-kenburns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
      <Reveal className="relative z-10 h-full flex flex-col items-start justify-end max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 pb-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange mb-2">
          {cat ? cat.name : 'Catalogue Yaay Vidé'}
        </p>
        <h1 className="font-impact font-extrabold text-[30px] sm:text-[40px] text-cream leading-[1.1] text-balance">
          {cat ? cat.name : 'Tous les articles'}
        </h1>
        <p className="text-cream/85 text-[14px] mt-1.5">
          Découvrez notre sélection d'articles pour familles
        </p>
      </Reveal>
    </div>
  );
}
