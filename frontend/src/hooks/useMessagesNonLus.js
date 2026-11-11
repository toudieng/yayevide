// frontend/src/hooks/useMessagesNonLus.js
// Nombre de messages non lus (badge de l'icône Messages). Interroge l'API
// toutes les 30 s, seulement quand l'onglet est visible, et tout de suite
// quand la page Messagerie signale qu'une conversation vient d'être lue.
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export const EVENEMENT_MESSAGES_LUS = 'yv-messages-lus';

export function useMessagesNonLus(actif) {
  const [total, setTotal] = useState(0);

  const charger = useCallback(() => {
    if (!actif || document.hidden) return;
    apiFetch('/messagerie/non-lus/')
      .then((r) => (r.ok ? r.json() : { total: 0 }))
      .then((d) => setTotal(d.total || 0))
      .catch(() => {});
  }, [actif]);

  useEffect(() => {
    if (!actif) return undefined;
    charger();
    const intervalle = setInterval(charger, 30000);
    document.addEventListener('visibilitychange', charger);
    window.addEventListener(EVENEMENT_MESSAGES_LUS, charger);
    return () => {
      clearInterval(intervalle);
      document.removeEventListener('visibilitychange', charger);
      window.removeEventListener(EVENEMENT_MESSAGES_LUS, charger);
    };
  }, [actif, charger]);

  return actif ? total : 0;
}
