// frontend/src/config/contact.js
// Coordonnées de l'équipe Yaay Vidé, à un seul endroit : pour changer de
// numéro, modifier ces lignes (format international sans « + » pour WhatsApp).
export const WHATSAPP_EQUIPE = '221710189191';
export const TELEPHONE_EQUIPE = '+221710189191';
export const TELEPHONE_EQUIPE_AFFICHE = '71 018 91 91';

export const lienWhatsappEquipe = (texte) =>
  `https://wa.me/${WHATSAPP_EQUIPE}${texte ? `?text=${encodeURIComponent(texte)}` : ''}`;
