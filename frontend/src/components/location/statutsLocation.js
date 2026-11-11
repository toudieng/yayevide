// frontend/src/components/location/statutsLocation.js
// Libellés et couleurs des étapes d'une location (côté locataire et vendeuse).
export const ETAPES_LOCATION = {
  en_attente_confirmation: { label: 'En attente de la vendeuse', couleur: 'bg-orange/15 text-clay-dark' },
  contre_proposition: { label: 'Nouvelles dates proposées', couleur: 'bg-orange/15 text-clay-dark' },
  confirme: { label: 'Confirmée', couleur: 'bg-teal/10 text-teal-dark' },
  en_cours_livraison: { label: 'En cours de livraison', couleur: 'bg-teal/10 text-teal-dark' },
  livre: { label: 'En cours', couleur: 'bg-green-50 text-green-700' },
  retour_a_collecter: { label: 'Retour à récupérer', couleur: 'bg-teal/10 text-teal-dark' },
  retour_en_cours: { label: 'Retour en cours', couleur: 'bg-teal/10 text-teal-dark' },
  retour_controle: { label: 'Contrôle chez Yaay Vidé', couleur: 'bg-teal/10 text-teal-dark' },
  terminee: { label: 'Terminée', couleur: 'bg-line text-ink' },
  indisponible: { label: 'Refusée', couleur: 'bg-red-50 text-red-700' },
  annule: { label: 'Annulée', couleur: 'bg-line text-ink' },
};

// Frise du parcours (pour l'indicateur d'avancement)
export const FRISE_LOCATION = [
  { id: 'demande', label: 'Demande', statuts: ['en_attente_confirmation', 'contre_proposition'] },
  { id: 'confirmee', label: 'Confirmée', statuts: ['confirme', 'en_cours_livraison'] },
  { id: 'en_cours', label: 'En cours', statuts: ['livre'] },
  { id: 'retour', label: 'Retour', statuts: ['retour_a_collecter', 'retour_en_cours', 'retour_controle'] },
  { id: 'terminee', label: 'Terminée', statuts: ['terminee'] },
];
