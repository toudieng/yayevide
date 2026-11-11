// frontend/src/components/home/MeilleursProduits.jsx
import { useEffect, useRef, useState } from 'react';
import TringleProduits from './TringleProduits';
import Button from '../ui/Button';
import { apiFetch } from '../../utils/api';

export default function MeilleursProduits() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const tringleRef = useRef(null);

  useEffect(() => {
    apiFetch('/produits/?tri=tendance&limit=10')
      .then(async (res) => setProduits(res.ok ? await res.json() : []))
      .catch(() => setProduits([]))
      .finally(() => setChargement(false));
  }, []);

  const scroll = (direction) => tringleRef.current?.defiler(direction);

  if (!chargement && produits.length === 0) return null;

  return (
    <section className="py-12" aria-busy={chargement}>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-12">
        <div className="flex items-end justify-between mb-6">
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

        <TringleProduits ref={tringleRef} produits={produits} chargement={chargement} />

        <div className="text-center mt-6">
          <Button to="/boutique" variant="primary" shine pulse>
            Voir tous les produits
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
}
