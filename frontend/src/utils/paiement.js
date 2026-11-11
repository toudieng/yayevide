// frontend/src/utils/paiement.js
// Moyens de paiement acceptés (mêmes valeurs que Commande.MODE_PAIEMENT_CHOICES
// côté backend) avec leurs libellés et logos officiels.
import logoWave from "../assets/paiement/wave.webp";
import logoOrangeMoney from "../assets/paiement/orange-money.webp";
import logoMixx from "../assets/paiement/mixx.webp";

export const LIBELLES_PAIEMENT = {
  wave: "Wave",
  orange_money: "Orange Money",
  mixx: "Mixx by Yas",
  especes: "Espèces",
};

export const LOGOS_PAIEMENT = {
  wave: logoWave,
  orange_money: logoOrangeMoney,
  mixx: logoMixx,
};

// Ordre d'affichage au paiement
export const MODES_PAIEMENT = ["wave", "orange_money", "mixx", "especes"].map((value) => ({
  value,
  label: LIBELLES_PAIEMENT[value],
  logo: LOGOS_PAIEMENT[value] || null,
}));
