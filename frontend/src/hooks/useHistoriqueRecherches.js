// frontend/src/hooks/useHistoriqueRecherches.js
import { useCallback, useEffect, useState } from 'react';

const CLE_STOCKAGE = 'yv_recherches';
const MAX_ENTREES = 20;

function lireStockage() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    return brut ? JSON.parse(brut) : [];
  } catch {
    return [];
  }
}

function ecrireStockage(entrees) {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(entrees));
  } catch {
    // Stockage indisponible (navigation privée, quota...) — on ignore
    // silencieusement, ce n'est qu'une fonctionnalité de confort.
  }
}

/**
 * Historique de recherche 100% client (pas de compte requis, fonctionne
 * pour une visiteuse anonyme). Chaque entrée retient un terme de recherche
 * et/ou une catégorie, avec un compteur d'occurrences pour distinguer
 * "récent" de "fréquent".
 */
export function useHistoriqueRecherches() {
  const [entrees, setEntrees] = useState(() => lireStockage());

  useEffect(() => {
    ecrireStockage(entrees);
  }, [entrees]);

  const enregistrer = useCallback((terme, categorieSlug, categorieNom) => {
    const termeNettoye = (terme || '').trim();
    if (!termeNettoye && !categorieSlug) return;

    setEntrees((prev) => {
      const cle = `${termeNettoye.toLowerCase()}|${categorieSlug || ''}`;
      const existante = prev.find((e) => e.cle === cle);
      const sansExistante = prev.filter((e) => e.cle !== cle);
      const nouvelleEntree = {
        cle,
        terme: termeNettoye,
        categorieSlug: categorieSlug || null,
        categorieNom: categorieNom || null,
        count: (existante?.count || 0) + 1,
        derniere: Date.now(),
      };
      return [nouvelleEntree, ...sansExistante].slice(0, MAX_ENTREES);
    });
  }, []);

  const effacer = useCallback(() => {
    setEntrees([]);
  }, []);

  const recentes = [...entrees].sort((a, b) => b.derniere - a.derniere).slice(0, 6);
  const frequentes = [...entrees].sort((a, b) => b.count - a.count).slice(0, 3);

  return { recentes, frequentes, enregistrer, effacer };
}
