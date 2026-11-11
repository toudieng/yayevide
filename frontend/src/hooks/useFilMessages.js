// frontend/src/hooks/useFilMessages.js
// Charge un fil de messages puis récupère les nouveaux toutes les `intervalle`
// ms (?apres=<dernier id>), uniquement quand l'onglet est visible.
// Renvoie aussi les autres champs de la réponse (ex. infos utilisatrice).
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useFilMessages(url, { intervalle = 5000, surNonAutorise, surNouveauxRecus } = {}) {
  // `url` = fil auquel appartiennent les données chargées : tant qu'il
  // diffère de l'url demandée, on est en chargement (pas de remise à zéro
  // synchrone dans un effet).
  const [etat, setEtat] = useState({ url: null, messages: [], extra: {} });
  const dernierIdRef = useRef(0);

  const charger = useCallback(
    async (complet) => {
      if (!url || (!complet && document.hidden)) return;
      const sep = url.includes('?') ? '&' : '?';
      try {
        const res = await apiFetch(complet ? url : `${url}${sep}apres=${dernierIdRef.current}`);
        if (res.status === 401 || res.status === 403) {
          surNonAutorise?.();
          return;
        }
        if (!res.ok) return;
        const { messages = [], mes_messages_lus: lus = [], ...extra } = await res.json();
        const setLus = new Set(lus);
        setEtat((prec) => {
          const base = complet || prec.url !== url ? [] : prec.messages;
          const connus = new Set(base.map((m) => m.id));
          const tous = [...base, ...messages.filter((m) => !connus.has(m.id))].map((m) =>
            m.de_moi ? { ...m, lu: setLus.has(m.id) } : m,
          );
          if (tous.length) dernierIdRef.current = tous[tous.length - 1].id;
          return { url, messages: tous, extra };
        });
        if (messages.some((m) => !m.de_moi)) surNouveauxRecus?.();
      } catch {
        // réseau momentanément indisponible : on réessaiera au prochain tour
      }
    },
    [url, surNonAutorise, surNouveauxRecus],
  );

  useEffect(() => {
    if (!url) return undefined;
    dernierIdRef.current = 0;
    const premier = setTimeout(() => charger(true), 0);
    const t = setInterval(() => charger(false), intervalle);
    return () => {
      clearTimeout(premier);
      clearInterval(t);
    };
  }, [url, charger, intervalle]);

  const ajouterMessage = useCallback(
    (message) => {
      setEtat((prec) => ({
        url,
        extra: prec.url === url ? prec.extra : {},
        messages: [...(prec.url === url ? prec.messages : []), message],
      }));
      dernierIdRef.current = message.id;
    },
    [url],
  );

  const pret = Boolean(url) && etat.url === url;
  return {
    messages: pret ? etat.messages : [],
    extra: pret ? etat.extra : {},
    chargement: Boolean(url) && !pret,
    ajouterMessage,
  };
}

// Petit compteur interrogé régulièrement (badges « non lus »).
export const EVENEMENT_SUPPORT_LU = 'yv-support-lu';

export function useCompteur(url, actif = true, intervalle = 60000) {
  const [total, setTotal] = useState(0);
  const charger = useCallback(() => {
    if (!actif || document.hidden) return;
    apiFetch(url)
      .then((r) => (r.ok ? r.json() : { total: 0 }))
      .then((d) => setTotal(d.total || 0))
      .catch(() => {});
  }, [url, actif]);

  useEffect(() => {
    if (!actif) return undefined;
    const premier = setTimeout(charger, 0);
    const t = setInterval(charger, intervalle);
    window.addEventListener(EVENEMENT_SUPPORT_LU, charger);
    document.addEventListener('visibilitychange', charger);
    return () => {
      clearTimeout(premier);
      clearInterval(t);
      window.removeEventListener(EVENEMENT_SUPPORT_LU, charger);
      document.removeEventListener('visibilitychange', charger);
    };
  }, [actif, charger, intervalle]);

  return actif ? total : 0;
}
