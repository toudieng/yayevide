// frontend/src/components/home/EbookBanner.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

/**
 * Bannière "Découvrir notre e-book" en haut du journal — ne s'affiche que si
 * un e-book actif existe côté admin, pour ne jamais montrer un bloc cassé
 * ou vide avant qu'elle en ait publié un.
 */
export default function EbookBanner() {
  const [ebook, setEbook] = useState(null);

  useEffect(() => {
    apiFetch('/ebook/')
      .then(async (res) => setEbook(res.ok ? await res.json() : null))
      .catch(() => setEbook(null));
  }, []);

  if (!ebook) return null;

  return (
    <Link
      to="/ebook"
      className="group relative flex flex-col sm:flex-row items-center gap-6 overflow-hidden rounded-m bg-ink text-cream px-6 py-6 sm:px-8 sm:py-7 mb-10 hover:-translate-y-0.5 transition-transform"
    >
      {ebook.couverture && (
        <img loading="lazy" decoding="async"
          src={ebook.couverture}
          alt={ebook.titre}
          className="h-28 w-20 shrink-0 rounded-btn object-cover shadow-lg"
        />
      )}
      <div className="flex-1 text-center sm:text-left">
        <span className="text-[11px] font-bold uppercase tracking-wide text-orange">Nouveau · E-book</span>
        <h3 className="font-serif text-xl sm:text-[22px] leading-snug mt-1.5">{ebook.titre}</h3>
        <p className="text-cream/70 text-[13.5px] mt-1.5 max-w-lg">
          Un guide, des conseils sur la vie de maman, et nos partenaires de confiance.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 shrink-0">
        <span className="bg-orange group-hover:bg-orange-dark text-white font-bold text-sm px-6 py-3 rounded-full transition-colors whitespace-nowrap">
          Découvrir notre e-book
        </span>
        <span className="text-cream/60 text-[12.5px]">{formatFCFA(ebook.prix)}</span>
      </div>
    </Link>
  );
}
