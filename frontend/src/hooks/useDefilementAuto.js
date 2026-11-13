// frontend/src/hooks/useDefilementAuto.js
// Fait défiler toute seule une rangée horizontale, sur téléphone seulement
// (< 640 px) : une carte toutes les `intervalle` ms, retour au début à la fin.
// - s'arrête 8 s dès qu'on touche la rangée, la fait défiler ou y navigue au
//   clavier, puis reprend ;
// - ne tourne que si la rangée est à l'écran et l'onglet visible ;
// - jamais si l'utilisatrice a demandé à réduire les animations.
import { useEffect, useRef } from 'react';

const PAUSE_MS = 8000;

export default function useDefilementAuto({ ref: refExterne, intervalle = 3000, selecteurCarte = ':scope > *', actif = true } = {}) {
  const refInterne = useRef(null);
  const ref = refExterne || refInterne;

  useEffect(() => {
    const el = ref.current;
    if (!el || !actif || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let visible = false;
    let repriseApres = 0;
    const suspendre = () => {
      repriseApres = Date.now() + PAUSE_MS;
    };
    const evenements = ['pointerdown', 'touchstart', 'wheel', 'focusin', 'keydown'];
    evenements.forEach((n) => el.addEventListener(n, suspendre, { passive: true }));

    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, { threshold: 0.5 });
    obs.observe(el);

    const t = setInterval(() => {
      if (!visible || document.hidden || Date.now() < repriseApres) return;
      if (window.innerWidth >= 640) return; // téléphone seulement
      if (el.scrollWidth <= el.clientWidth + 2) return; // rien à faire défiler
      const carte = el.querySelector(selecteurCarte);
      const ecart = carte ? parseFloat(getComputedStyle(carte.parentElement).columnGap) || 0 : 0;
      const pas = carte ? carte.getBoundingClientRect().width + ecart : el.clientWidth;
      const auBout = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: auBout ? 0 : el.scrollLeft + pas, behavior: 'smooth' });
    }, intervalle);

    return () => {
      clearInterval(t);
      obs.disconnect();
      evenements.forEach((n) => el.removeEventListener(n, suspendre));
    };
  }, [ref, intervalle, selecteurCarte, actif]);

  return ref;
}
