// frontend/src/utils/dates.js
// Formats d'heure / de date courts pour les fils de discussion.
export function heure(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function dateCourte(iso) {
  const d = new Date(iso);
  const auj = new Date();
  const hier = new Date();
  hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === auj.toDateString()) return heure(iso);
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
