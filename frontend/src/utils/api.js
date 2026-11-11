// frontend/src/utils/api.js
import { getCookie } from './csrf';

//export const API_BASE = 'http://localhost:8000/api';
export const API_BASE = '/api';

/**
 * Enveloppe fetch() pour TOUTES les requêtes vers l'API Django.
 *
 * - Ajoute toujours `credentials: 'include'` (sans ça, le navigateur
 *   n'envoie/ne garde jamais le cookie de session).
 * - Ajoute automatiquement le header `X-CSRFToken` pour les méthodes qui
 *   modifient des données (POST/PUT/PATCH/DELETE) — c'est l'oubli de ce
 *   header qui causait les erreurs 403 "Forbidden" sur /connexion et
 *   /deconnexion dès qu'une session existait déjà dans le navigateur.
 *
 * Utilisation :
 *   const res = await apiFetch('/connexion/', { method: 'POST', body: {...} });
 *   const data = await res.json();
 */
export async function apiFetch(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const finalHeaders = { ...headers };
  let finalBody = body;

  const methodeSure = method.toUpperCase();
  const modifieDesDonnees = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodeSure);

  if (modifieDesDonnees) {
    finalHeaders['X-CSRFToken'] = getCookie('csrftoken');
  }

  // FormData (upload de fichiers) ne doit jamais être JSON.stringify ni
  // recevoir un Content-Type manuel (le navigateur le génère avec la
  // boundary multipart correcte tout seul).
  if (body && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: methodeSure,
    credentials: 'include',
    headers: finalHeaders,
    body: finalBody,
    ...rest,
  });

  // Le panier vit en localStorage, donc rien ne le lie automatiquement au
  // compte connecté — sans ça, le panier d'une personne "fuite" vers le
  // compte suivant utilisé sur le même appareil. On compare le compte qui
  // vient de se connecter au propriétaire enregistré du panier :
  // - même compte (ou pas de propriétaire connu, ex: panier d'invitée
  //   avant inscription) → on garde le panier tel quel.
  // - compte différent → le panier ne lui appartient pas, on le vide.
  // La déconnexion, elle, efface juste le repère de propriétaire (le
  // panier peut rester le temps qu'une session anonyme s'en resserve,
  // il sera de toute façon vidé si un AUTRE compte se connecte ensuite).
  if (response.ok && path === '/connexion/') {
    try {
      const clone = response.clone();
      const data = await clone.json();
      const proprietaireActuel = localStorage.getItem('yaayvide_panier_proprietaire');
      if (proprietaireActuel && proprietaireActuel !== data.username) {
        localStorage.removeItem('yaayvide_panier');
        window.dispatchEvent(new Event('yaayvide:panier-invalide'));
      }
      localStorage.setItem('yaayvide_panier_proprietaire', data.username);
    } catch {
      // corps de réponse illisible — on ne bloque pas la connexion pour ça
    }
  }
  if (response.ok && path === '/deconnexion/') {
    localStorage.removeItem('yaayvide_panier_proprietaire');
  }

  return response;
}
