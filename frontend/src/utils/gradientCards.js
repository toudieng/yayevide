// frontend/src/utils/gradientCards.js
// Palette de cartes dégradées réutilisée sur tous les tableaux de bord
// (client, vendeuse, admin, livreur) pour un rendu homogène et vivant,
// au lieu de cartes plates blanches. On boucle sur ce tableau pour
// colorer une rangée de 3 ou 4 cartes stats.
export const GRADIENT_CARDS = [
  {
    bg: 'bg-gradient-to-br from-[#1B2430] to-[#2E3B4A]',
    text: 'text-white',
    label: 'text-white/55',
    iconBg: 'bg-white/10',
    iconColor: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-teal/25 via-teal/10 to-transparent',
    text: 'text-ink',
    label: 'text-ink-soft/55',
    iconBg: 'bg-teal/20',
    iconColor: 'text-teal-dark',
  },
  {
    bg: 'bg-gradient-to-br from-orange/25 via-orange/10 to-transparent',
    text: 'text-ink',
    label: 'text-ink-soft/55',
    iconBg: 'bg-orange/20',
    iconColor: 'text-orange',
  },
  {
    bg: 'bg-gradient-to-br from-clay/25 via-clay/10 to-transparent',
    text: 'text-ink',
    label: 'text-ink-soft/55',
    iconBg: 'bg-clay/20',
    iconColor: 'text-clay',
  },
];

export const SHADOW_CARD = 'shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]';
