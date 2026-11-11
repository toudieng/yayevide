// frontend/src/components/boutique/Decouverte.jsx
import { useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';
import { apiFetch } from '../../utils/api';
import { findCategoryBySlug } from '../../data/categories';

// Libellé affichable d'une entrée d'historique (terme tapé ou catégorie)
const libelle = (e) => e.terme || e.categorieNom || findCategoryBySlug(e.categorieSlug)?.name || '';

function Fleche({ direction, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction < 0 ? 'Articles précédents' : 'Articles suivants'}
      className="h-9 w-9 rounded-full border border-line bg-white flex items-center justify-center text-ink enabled:hover:border-teal enabled:hover:text-teal-dark disabled:opacity-35 transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
        <path d={direction < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}

function RangeeProduits({ titre, sousTitre, produits }) {
  const rangeeRef = useRef(null);
  const [bords, setBords] = useState({ debut: true, fin: true });

  // Active / grise les flèches selon la position du défilement
  const majBords = () => {
    const el = rangeeRef.current;
    if (!el) return;
    setBords({
      debut: el.scrollLeft <= 2,
      fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  };

  useEffect(() => {
    majBords();
    window.addEventListener('resize', majBords);
    return () => window.removeEventListener('resize', majBords);
  }, [produits]);

  const defiler = (direction) => {
    const el = rangeeRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  if (!produits || produits.length === 0) return null;
  const defilable = !(bords.debut && bords.fin);

  return (
    <div className="mb-10 @container">
      <div className="mb-3.5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-impact font-extrabold text-lg text-ink">{titre}</h3>
          {sousTitre && <p className="text-[12.5px] text-ink-soft/75 mt-0.5">{sousTitre}</p>}
        </div>
        {defilable && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Fleche direction={-1} onClick={() => defiler(-1)} disabled={bords.debut} />
            <Fleche direction={1} onClick={() => defiler(1)} disabled={bords.fin} />
          </div>
        )}
      </div>
      {/* Mobile : grille de 2 colonnes qui défile verticalement (plus fluide).
          Dès 540 px de place : rangée défilante où 3 ou 4 cartes tiennent pile
          (requête de conteneur), avec les flèches. */}
      <div
        ref={rangeeRef}
        onScroll={majBords}
        className="grid grid-cols-2 gap-3 pt-1 pb-3 @min-[540px]:flex @min-[540px]:gap-4 @min-[540px]:overflow-x-auto @min-[540px]:snap-x @min-[540px]:snap-mandatory -mx-1 px-1 no-scrollbar"
      >
        {produits.map((p, i) => (
          <div
            key={p.id}
            className="min-w-0 @min-[540px]:w-[calc((100%-2rem)/3)] @min-[800px]:w-[calc((100%-3rem)/4)] @min-[540px]:shrink-0 @min-[540px]:snap-start"
          >
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
export default function Decouverte({ produits, recentes: recentesBrutes, frequentes, onEffacerHistorique, onSelectionnerRecherche, onIdsAffiches }) {
  // On n'affiche que les entrées qui ont un libellé (évite les pastilles vides)
  const recentes = recentesBrutes.filter((r) => libelle(r));
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
                {libelle(r)}
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestion && (
        <RangeeProduits
          titre="Suggéré pour vous"
          sousTitre={`Basé sur vos recherches de "${libelle(suggestion.entree)}"`}
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
