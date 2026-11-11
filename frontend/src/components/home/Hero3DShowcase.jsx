// frontend/src/components/home/Hero3DShowcase.jsx
import { useEffect, useRef, useState } from 'react';

const CARD_BACK_IMAGE =
  'https://images.unsplash.com/photo-1519689680058-324335c77eba?fm=jpg&q=80&w=600&auto=format&fit=crop';
const CARD_FRONT_IMAGE =
  'https://images.unsplash.com/photo-1522771930-78848d9293e8?fm=jpg&q=80&w=600&auto=format&fit=crop';

/**
 * Petite scène "3D" en pur CSS (perspective + translateZ), pas de WebGL —
 * deux cartes produit empilées qui basculent doucement selon la position de
 * la souris sur le hero. Reste léger (aucune dépendance ajoutée, aucun
 * rendu 3D réel à charger), pensé pour du mobile en priorité : masqué en
 * dessous de lg et figé si la personne préfère moins d'animations.
 */
export default function Hero3DShowcase({ trackRef }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = trackRef?.current;
    if (!el || reducedMotion.current) return;

    let ticking = false;
    let lastEvent = null;

    const apply = () => {
      ticking = false;
      if (!lastEvent) return;
      const rect = el.getBoundingClientRect();
      const px = (lastEvent.clientX - rect.left) / rect.width; // 0..1
      const py = (lastEvent.clientY - rect.top) / rect.height; // 0..1
      setTilt({
        x: (0.5 - py) * 16, // rotateX
        y: (px - 0.5) * 20, // rotateY
      });
    };

    const onMove = (e) => {
      lastEvent = e;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [trackRef]);

  return (
    <div
      className="hidden xl:block absolute z-[3] pointer-events-none"
      style={{ top: '10%', right: '6%', width: 180, perspective: '1400px' }}
    >
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* ombre projetée, décollée en profondeur */}
        <div
          className="absolute inset-3 rounded-m bg-black/35 blur-xl"
          style={{ transform: 'translateZ(-70px) translateY(18px)' }}
        />

        {/* carte du fond, légèrement décalée et penchée */}
        <div
          className="absolute inset-0 rounded-m overflow-hidden border border-white/15 shadow-2xl"
          style={{ transform: 'translateZ(-24px) translate(18px, 22px) rotate(-6deg)' }}
        >
          <img src={CARD_BACK_IMAGE} alt="" className="h-full w-full object-cover opacity-90" />
        </div>

        {/* carte principale, au premier plan */}
        <div
          className="relative rounded-m overflow-hidden border border-white/25 shadow-2xl bg-cream"
          style={{ transform: 'translateZ(30px)' }}
        >
          <img src={CARD_FRONT_IMAGE} alt="Article pour bébé mis en ligne sur Yaay Vidé" className="h-36 w-full object-cover" />
          <div className="p-3.5">
            <p className="text-[13px] font-semibold text-ink truncate">Ensemble pyjama bébé</p>
            <p className="text-[13px] font-bold text-clay mt-0.5">4 800 FCFA</p>
          </div>
        </div>

        {/* badge "vérifié" détaché devant tout le reste */}
        <div
          className="absolute -top-3.5 -left-3.5 flex items-center gap-1.5 bg-teal text-white text-[10.5px] font-bold px-3 py-1.5 rounded-full shadow-lg"
          style={{ transform: 'translateZ(60px)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3">
            <path d="M5 12l4.5 4.5L19 7" />
          </svg>
          Vérifié
        </div>

        {/* pastille note, décollée elle aussi */}
        <div
          className="absolute -bottom-3 -right-3 flex items-center gap-1 bg-cream text-ink text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-lg border border-line"
          style={{ transform: 'translateZ(50px)' }}
        >
          ★ 4.9
        </div>
      </div>
    </div>
  );
}
