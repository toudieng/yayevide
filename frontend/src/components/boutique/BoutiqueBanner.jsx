// frontend/src/components/boutique/BoutiqueBanner.jsx
import { findCategoryBySlug } from '../../data/categories';
import Reveal from '../ui/Reveal';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1560707854-fb9a10eeaace?fm=jpg&q=75&w=1800&auto=format&fit=crop';

export default function BoutiqueBanner({ categorieSlug }) {
  const cat = findCategoryBySlug(categorieSlug);

  return (
    <div className="relative h-[220px] sm:h-[280px] overflow-hidden">
      <img
        key={categorieSlug || 'all'}
        src={cat ? cat.img : DEFAULT_IMG}
        alt={cat ? cat.name : 'Tous les articles'}
        className="absolute inset-0 h-full w-full object-cover animate-kenburns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
      <Reveal className="relative z-10 h-full flex flex-col items-start justify-end max-w-[1280px] mx-auto px-6 md:px-12 pb-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay mb-2">
          {cat ? cat.name : 'Catalogue Yaay Vidé'}
        </p>
        <h1 className="font-serif text-[28px] sm:text-[38px] text-cream leading-tight">
          {cat ? cat.name : 'Tous les articles'}
        </h1>
        <p className="text-cream/75 text-[14px] mt-1.5">
          Découvrez notre sélection d'articles pour familles
        </p>
      </Reveal>
    </div>
  );
}
