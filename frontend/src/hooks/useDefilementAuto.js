// frontend/src/hooks/useDefilementAuto.js
// Fait défiler une rangée horizontale en continu, doucement, comme un tapis
// roulant, sur téléphone seulement (< 640 px).
//
// Boucle sans fin : la rangée contient ses éléments deux fois. Les copies
// portent l'attribut `data-doublon` (et `inert`, pour les lecteurs d'écran et
// le clavier). Dès qu'on a parcouru une liste complète, on revient d'autant en
// arrière : la position affichée est identique, aucun saut n'est visible.
//
// - pause dès qu'on touche la rangée, la fait défiler ou y navigue au clavier,
//   reprise 5 s après le dernier geste ;
// - ne tourne que si la rangée est à l'écran et l'onglet visible ;
// - jamais si l'utilisatrice a demandé à réduire les animations.
// Pendant le défilement automatique, la rangée porte `data-defilement-auto`
// (la tringle s'en sert pour ne pas balancer ses étiquettes) et l'alignement
// sur les cartes (scroll-snap) est coupé, sinon elle avancerait par à-coups.
import { useEffect, useRef } from 'react';

const REPRISE_MS = 5000;

export default function useDefilementAuto({ ref: refExterne, vitesse = 25, actif = true } = {}) {
  const refInterne = useRef(null);
  const ref = refExterne || refInterne;

  useEffect(() => {
    const el = ref.current;
    if (!el || !actif || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let visible = false;
    let repriseApres = 0;
    let raf = 0;
    let dernier = 0;
    let position = el.scrollLeft; // flottant : scrollLeft arrondit au pixel

    // largeur d'une liste complète = écart entre la 1re carte et sa copie
    const periode = () => {
      const copie = el.querySelector('[data-doublon]');
      const premier = copie?.parentElement?.firstElementChild;
      if (!copie || !premier || getComputedStyle(copie).display === 'none') return 0;
      let p = premier;
      // la tringle a un premier <li> décoratif (la barre) : on le saute
      while (p && p.getAttribute('aria-hidden') === 'true' && !p.hasAttribute('data-doublon')) p = p.nextElementSibling;
      return copie.getBoundingClientRect().left - p.getBoundingClientRect().left;
    };

    const mettreEnPause = () => {
      el.removeAttribute('data-defilement-auto');
      el.style.scrollSnapType = '';
    };

    const peutTourner = () =>
      visible && !document.hidden && window.innerWidth < 640 && Date.now() >= repriseApres && el.scrollWidth > el.clientWidth + 2;

    const tick = (now) => {
      raf = 0;
      if (!peutTourner()) {
        mettreEnPause();
        planifier();
        return;
      }
      if (!el.hasAttribute('data-defilement-auto')) {
        el.setAttribute('data-defilement-auto', '');
        el.style.scrollSnapType = 'none';
        position = el.scrollLeft; // reprendre là où la personne s'est arrêtée
        dernier = now;
      }
      const dt = Math.min(now - dernier, 100) / 1000;
      dernier = now;
      position += vitesse * dt;
      const p = periode();
      if (p > 0 && position >= p) position -= p;
      else if (p <= 0 && position >= el.scrollWidth - el.clientWidth) position = 0;
      el.scrollLeft = position;
      raf = requestAnimationFrame(tick);
    };

    // hors de l'écran ou en pause : on revérifie calmement, sans animation
    let attente = 0;
    const planifier = () => {
      clearTimeout(attente);
      attente = setTimeout(() => {
        if (peutTourner()) {
          dernier = performance.now();
          raf = requestAnimationFrame(tick);
        } else {
          planifier();
        }
      }, 500);
    };

    const suspendre = () => {
      repriseApres = Date.now() + REPRISE_MS;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        mettreEnPause();
        planifier();
      }
    };
    const evenements = ['pointerdown', 'touchstart', 'wheel', 'focusin', 'keydown'];
    evenements.forEach((n) => el.addEventListener(n, suspendre, { passive: true }));

    // boucle aussi quand c'est la personne qui fait défiler jusqu'aux copies
    const surScroll = () => {
      if (el.hasAttribute('data-defilement-auto')) return;
      const p = periode();
      if (p > 0 && el.scrollLeft >= p + 1) el.scrollLeft -= p;
    };
    el.addEventListener('scroll', surScroll, { passive: true });

    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, { threshold: 0.1 });
    obs.observe(el);
    planifier();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(attente);
      obs.disconnect();
      mettreEnPause();
      evenements.forEach((n) => el.removeEventListener(n, suspendre));
      el.removeEventListener('scroll', surScroll);
    };
  }, [ref, vitesse, actif]);

  return ref;
}
