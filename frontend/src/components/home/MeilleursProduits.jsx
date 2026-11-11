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
            <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-clay-dark bg-orange/10 px-3.5 py-1.5 rounded-full mb-4">
              <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9L12 2.8z" /></svg>Les favoris des mamans</span>
            </span>
            <h2 className="font-impact font-extrabold text-ink text-[30px] sm:text-[40px] lg:text-[48px] leading-tight flex items-center gap-3">
              Nos meilleurs produits
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6 sm:h-7 sm:w-7 text-orange -rotate-6 shrink-0">
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
              <div className="rounded-[20px] overflow-hidden bg-white shadow-[0_4px_14px_-6px_rgba(27,36,48,0.18)]">
                <div className="aspect-square bg-line/40 animate-pulse" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 w-16 rounded-full bg-line/50 animate-pulse" />
                  <div className="h-4 w-4/5 rounded bg-line/50 animate-pulse" />
                  <div className="h-4 w-1/3 rounded bg-line/50 animate-pulse" />
                  <div className="h-9 w-full rounded-full bg-line/40 animate-pulse mt-3" />
                </div>
              </div>
            </div>
          ))}
          {produits.map((p, i) => (
            <div key={p.id} className="w-[62%] sm:w-[42%] lg:w-[23%] shrink-0 snap-start">
              <ProductCard produit={p} index={i} />
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
