// frontend/src/utils/produit.js
// Libellés, couleurs de badge et format de prix partagés par la carte
// produit de la boutique et la tringle de l'accueil.
export const ETAT_LABELS = {
  neuf: "Neuf avec étiquette",
  excellent: "Excellent état",
  bon: "Bon état",
};

export const ETAT_BADGE = {
  // Fonds assez foncés pour un texte blanc lisible (contraste AA)
  neuf: "bg-green-700",
  excellent: "bg-teal-dark",
  bon: "bg-clay-dark",
};

export function formatFCFA(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("fr-FR") + " FCFA";
}
