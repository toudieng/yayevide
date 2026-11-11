// frontend/src/components/home/MeilleursProduits.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../boutique/ProductCard';
import { apiFetch } from '../../utils/api';

export default function MeilleursProduits() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const scrollerRef = useRef(null);

  useEffect(() => {
    apiFetch('/produits/?tri=tendance&limit=10')
      .then(async (res) => setProduits(res.ok ? await res.json() : []))
      .catch(() => setProduits([]))
      .finally(() => setChargement(false));
  }, []);

  const scroll = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!chargement && produits.length === 0) return null;

  return (
    <section className="py-12" aria-busy={chargement}>
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <div className="flex items-end justify-between mb-9">
          <div>
            <h2 className="font-impact font-extrabold text-ink text-[30px] sm:text-[40px] lg:text-[48px] leading-tight text-balance">
              Nos meilleurs produits
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block align-[-0.1em] ml-2.5 h-6 w-6 sm:h-7 sm:w-7 text-orange -rotate-6" aria-hidden="true">
                <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z" />
              </svg>
            </h2>
            <p className="font-sans text-ink-soft text-[16px] sm:text-[18px] mt-3">Populaire en ce moment auprès des familles</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Précédent"
              className="h-10 w-10 rounded-full border border-line flex items-center justify-center text-ink hover:border-teal hover:text-teal-dark transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Suivant"
              className="h-10 w-10 rounded-full border border-line flex items-center justify-center text-ink hover:border-teal hover:text-teal-dark transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        <div ref={scrollerRef} className="flex gap-5 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x snap-mandatory">
          {chargement && Array.from({ length: 4 }).map((_, i) => (
            <div key={`sq-${i}`} className="w-[62%] sm:w-[42%] lg:w-[23%] shrink-0" aria-hidden="true">
              <div className="rounded-[18px] overflow-hidden bg-white shadow-[0_4px_14px_-6px_rgba(27,36,48,0.18)]">
                <div className="aspect-[4/3] bg-line/40 animate-pulse" />
                <div className="px-3 pt-2.5 pb-3 space-y-2">
                  <div className="h-3 w-16 rounded-full bg-line/50 animate-pulse" />
                  <div className="flex justify-between gap-3">
                    <div className="h-4 w-1/2 rounded bg-line/50 animate-pulse" />
                    <div className="h-4 w-1/4 rounded bg-line/50 animate-pulse" />
                  </div>
                  <div className="h-3 w-3/4 rounded bg-line/40 animate-pulse" />
                  <div className="h-9 w-full rounded-full bg-line/40 animate-pulse mt-1" />
                </div>
              </div>
            </div>
          ))}
          {produits.map((p, i) => (
            <div key={p.id} className="w-[62%] sm:w-[42%] lg:w-[23%] shrink-0 snap-start">
              <ProductCard produit={p} index={i} compacte />
            </div>
          ))}
        </div>

        <div className="text-center mt-9">
          <Link
            to="/boutique"
            className="inline-flex items-center gap-2 bg-white text-teal-dark border-2 border-teal font-bold text-sm px-7 py-3.5 rounded-full hover:bg-teal hover:text-white transition-colors"
          >
            Voir tous les produits
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
