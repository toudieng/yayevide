// frontend/src/hooks/useDefilementRangee.js
// Pour une rangée qui défile de côté : sait si l'on est au début ou à la fin
// (pour griser les flèches) et fait avancer d'une carte à la fois.
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useDefilementRangee() {
  const ref = useRef(null);
  const [bords, setBords] = useState({ debut: true, fin: false });

  const majBords = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setBords({
      debut: el.scrollLeft <= 2,
      fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(majBords, 0);
    window.addEventListener('resize', majBords);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', majBords);
    };
  }, [majBords]);

  const defiler = useCallback((direction) => {
    const el = ref.current;
    if (!el) return;
    const carte = el.children[0];
    const ecart = parseFloat(getComputedStyle(el).columnGap) || 0;
    const pas = carte ? carte.getBoundingClientRect().width + ecart : el.clientWidth;
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * pas, behavior: reduit ? 'auto' : 'smooth' });
  }, []);

  return { ref, bords, majBords, defiler };
}
