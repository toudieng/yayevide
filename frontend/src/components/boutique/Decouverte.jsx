// frontend/src/components/boutique/Decouverte.jsx
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { apiFetch } from '../../utils/api';

function RangeeProduits({ titre, sousTitre, produits }) {
  if (!produits || produits.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="mb-3.5">
        <h3 className="font-impact font-extrabold text-lg text-ink">{titre}</h3>
        {sousTitre && <p className="text-[12.5px] text-ink-soft/75 mt-0.5">{sousTitre}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1 no-scrollbar">
        {produits.map((p, i) => (
          <div key={p.id} className="w-[160px] sm:w-[190px] shrink-0 snap-start">
            <ProductCard produit={p} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Bloc "découverte" affiché au-dessus de la grille, uniquement quand la
 * personne n'est pas déjà en train de filtrer/rechercher activement (sinon
 * ça encombre des résultats qu'elle a explicitement demandés) :
 * recherches récentes (cliquables), suggestions basées sur ses recherches
 * les plus fréquentes, et tendances du moment (calculées côté serveur sur
 * les vraies ventes, pas inventées).
 */
export default function Decouverte({ produits, recentes, frequentes, onEffacerHistorique, onSelectionnerRecherche, onIdsAffiches }) {
  const [tendances, setTendances] = useState([]);

  useEffect(() => {
    apiFetch('/produits/?tri=tendance&limit=8')
      .then(async (res) => setTendances(res.ok ? await res.json() : []))
      .catch(() => setTendances([]));
  }, []);

  // Suggestions dérivées de la recherche la plus fréquente qui a encore des
  // résultats dans le catalogue actuel — pas d'appel réseau supplémentaire,
  // on filtre simplement ce qui est déjà chargé.
  const suggestion = frequentes
    .map((entree) => {
      const correspondances = produits.filter((p) => {
        const matchCategorie = entree.categorieSlug ? p.categorie_slug === entree.categorieSlug : true;
        const matchTerme = entree.terme
          ? p.titre.toLowerCase().includes(entree.terme.toLowerCase())
          : true;
        return matchCategorie && matchTerme;
      });
      return { entree, correspondances };
    })
    .find((s) => s.correspondances.length >= 3);

  // On prévient le parent des articles déjà montrés ici, pour qu'il ne les
  // réaffiche pas juste en dessous dans "Tout le catalogue" — un article ne
  // doit jamais apparaître deux fois sur la même page, peu importe la
  // taille du catalogue.
  useEffect(() => {
    if (!onIdsAffiches) return;
    const ids = new Set([
      ...tendances.map((p) => p.id),
      ...(suggestion ? suggestion.correspondances.map((p) => p.id) : []),
    ]);
    onIdsAffiches(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tendances, suggestion]);

  const rienAAfficher = recentes.length === 0 && !suggestion && tendances.length === 0;
  if (rienAAfficher) return null;

  return (
    <div className="mb-10">
      {recentes.length > 0 && (
        <div className="mb-9">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75">Recherches récentes</h3>
            <button
              type="button"
              onClick={onEffacerHistorique}
              className="text-[11.5px] text-ink-soft/75 hover:text-clay-dark transition-colors"
            >
              Effacer
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentes.map((r) => (
              <button
                key={r.cle}
                type="button"
                onClick={() => onSelectionnerRecherche(r)}
                className="px-3.5 py-2 bg-cream border border-line rounded-full text-[12.5px] text-ink-soft/80 hover:border-teal hover:text-teal-dark transition-colors flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3 opacity-60">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                {r.terme || r.categorieNom}
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestion && (
        <RangeeProduits
          titre="Suggéré pour vous"
          sousTitre={`Basé sur vos recherches de "${suggestion.entree.terme || suggestion.entree.categorieNom}"`}
          produits={suggestion.correspondances.slice(0, 8)}
        />
      )}

      <RangeeProduits
        titre="Tendances du moment"
        sousTitre="Les articles qui partent le plus vite en ce moment"
        produits={tendances}
      />
    </div>
  );
}
