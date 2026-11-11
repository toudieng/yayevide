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

// --- Dates « AAAA-MM-JJ » en heure locale (sélecteurs de dates de location) ---
function versISO(d) {
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}

export function dansJoursISO(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return versISO(d);
}

export function ajouterJoursISO(iso, n) {
  const [a, m, j] = iso.split('-').map(Number);
  const d = new Date(a, m - 1, j);
  d.setDate(d.getDate() + n);
  return versISO(d);
}

export function joursEntre(debutISO, finISO) {
  const [a1, m1, j1] = debutISO.split('-').map(Number);
  const [a2, m2, j2] = finISO.split('-').map(Number);
  return Math.round((new Date(a2, m2 - 1, j2) - new Date(a1, m1 - 1, j1)) / 86400000);
}

// « 2026-11-15 » -> « 15 nov. »
export function formatJour(iso) {
  if (!iso) return '';
  const [a, m, j] = iso.split('-').map(Number);
  return new Date(a, m - 1, j).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
