// frontend/src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'yaayvide_panier';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitial);
  const [drawerOuvert, setDrawerOuvert] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // apiFetch vide le localStorage et déclenche cet événement quand le
  // panier ne correspond plus au compte connecté (cf. utils/api.js) — sans
  // ça, l'état React déjà chargé en mémoire ne le saurait jamais tout seul.
  useEffect(() => {
    const onPanierInvalide = () => setItems([]);
    window.addEventListener('yaayvide:panier-invalide', onPanierInvalide);
    return () => window.removeEventListener('yaayvide:panier-invalide', onPanierInvalide);
  }, []);

  // Ouvre automatiquement le panier latéral à chaque ajout, comme demandé.
  // Un article à vendre peut avoir plusieurs exemplaires (quantite) ; un
  // article en location est toujours unique mais porte des dates —
  // ajouter le même produit avec des dates différentes crée une 2e ligne.
  const addItem = (produit, datesLocation = null) => {
    setItems((prev) => {
      if (datesLocation) {
        const cleId = `${produit.id}-${datesLocation.dateDebut}-${datesLocation.dateFin}`;
        if (prev.some((i) => i.cleId === cleId)) return prev; // déjà dans le panier avec les mêmes dates
        return [
          ...prev,
          {
            cleId,
            id: produit.id,
            titre: produit.titre,
            image: produit.image_principale,
            prixUnitaire: Number(produit.prix_final_public),
            categorieNom: produit.categorie_nom,
            taille: produit.taille || null,
            typeOffre: 'location',
            quantite: 1,
            dateDebut: datesLocation.dateDebut,
            dateFin: datesLocation.dateFin,
            nbJours: datesLocation.nbJours,
            caution: Number(produit.caution) || 0,
          },
        ];
      }

      const existant = prev.find((i) => i.id === produit.id && i.typeOffre !== 'location');
      if (existant) {
        return prev.map((i) => (i === existant ? { ...i, quantite: i.quantite + 1 } : i));
      }
      return [
        ...prev,
        {
          cleId: `${produit.id}-vente`,
          id: produit.id,
          titre: produit.titre,
          image: produit.image_principale,
          prixUnitaire: Number(produit.prix_final_public),
          categorieNom: produit.categorie_nom,
          taille: produit.taille || null,
          typeOffre: 'vente',
          quantite: 1,
        },
      ];
    });
    setDrawerOuvert(true);
  };

  const removeItem = (cleId) => setItems((prev) => prev.filter((i) => (i.cleId || i.id) !== cleId));

  const updateQuantite = (cleId, quantite) => {
    if (quantite < 1) return removeItem(cleId);
    setItems((prev) => prev.map((i) => ((i.cleId || i.id) === cleId ? { ...i, quantite } : i)));
  };

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantite, 0), [items]);
  const sousTotalArticle = (i) => (i.typeOffre === 'location' ? i.prixUnitaire * i.nbJours : i.prixUnitaire * i.quantite);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + sousTotalArticle(i), 0), [items]);
  const totalCaution = useMemo(() => items.reduce((sum, i) => sum + (i.caution || 0), 0), [items]);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantite, clear, count, subtotal, totalCaution, sousTotalArticle,
      drawerOuvert, ouvrirDrawer: () => setDrawerOuvert(true), fermerDrawer: () => setDrawerOuvert(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook compagnon du provider, déjà utilisé par 7 fichiers sous cette forme
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé à l\'intérieur de <CartProvider>');
  return ctx;
}
