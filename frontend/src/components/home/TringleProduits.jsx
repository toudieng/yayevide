// frontend/src/components/home/TringleProduits.jsx
// « Tringle » de l'accueil : les produits populaires pendent comme des
// étiquettes à une tringle en bois. Création maison, sans dépendance :
//  - balancement physique léger (pendules amortis, une seule boucle rAF
//    qui s'arrête dès que tout est immobile) ;
//  - la tringle se fait glisser (souris ou doigt) et les étiquettes se
//    balancent selon la vitesse ;
//  - survol / focus : l'étiquette se tourne un peu vers la visiteuse ;
//  - clavier : flèches gauche/droite, Début/Fin ;
//  - prefers-reduced-motion : aucune animation, étiquettes immobiles.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ETAT_LABELS, formatFCFA } from '../../utils/produit';

const ANGLE_MAX = 14; // degrés
const AMORTISSEMENT = 0.17;

function prefereMoinsDeMouvement() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Un pas de simulation pour toutes les étiquettes (pendules amortis).
// Renvoie true tant qu'au moins une étiquette bouge encore.
function pasPhysique(s, pendules, now) {
  const dt = Math.min((now - (s.dernier || now)) / 1000, 0.032) || 0.016;
  s.dernier = now;
  let enMouvement = false;
  pendules.forEach((el, i) => {
    if (!el) return;
    const w = s.omegas[i] || 6;
    let a = s.angles[i] || 0;
    let v = s.vitesses[i] || 0;
    v += (-w * w * a - 2 * AMORTISSEMENT * w * v) * dt;
    a += v * dt;
    if (a > ANGLE_MAX) { a = ANGLE_MAX; v *= -0.4; }
    if (a < -ANGLE_MAX) { a = -ANGLE_MAX; v *= -0.4; }
    if (Math.abs(a) > 0.04 || Math.abs(v) > 0.4) enMouvement = true;
    else { a = 0; v = 0; }
    s.angles[i] = a;
    s.vitesses[i] = v;
    el.style.transform = `rotate(${a.toFixed(2)}deg)`;
  });
  if (!enMouvement) s.dernier = 0;
  return enMouvement;
}

function Crochet() {
  return (
    <svg
      viewBox="0 0 24 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="absolute left-1/2 top-0 -translate-x-1/2 h-7 w-6 text-ink/70"
      aria-hidden="true"
    >
      {/* crochet qui passe par-dessus la tringle puis descend */}
      <path d="M8 13V9a4 4 0 118 0c0 2.2-1.8 3-4 4.2V28" />
    </svg>
  );
}

function Etiquette({ produit, onAjouter, ajoute }) {
  const isLocation = produit.type_offre === 'location';
  const image = produit.image_principale;
  return (
    <div className="relative rounded-[18px] bg-white p-2 pb-2.5 shadow-[0_10px_24px_-12px_rgba(27,36,48,0.35)] transition-[transform,box-shadow] duration-300 ease-out group-hover:[transform:perspective(700px)_rotateX(7deg)_translateY(-4px)] group-focus-within:[transform:perspective(700px)_rotateX(7deg)_translateY(-4px)] group-hover:shadow-[0_22px_36px_-16px_rgba(27,36,48,0.45)]">
      {/* trou de l'étiquette, où arrive le cordon */}
      <span className="block mx-auto mb-1.5 h-2.5 w-2.5 rounded-full bg-sable ring-1 ring-ink/25" aria-hidden="true" />
      <Link
        to={`/produit/${produit.id}`}
        draggable={false}
        className="block rounded-[12px] focus-visible:outline-offset-4"
      >
        <div className="relative aspect-square overflow-hidden rounded-[12px] bg-line/40">
          {image ? (
            <img
              src={image}
              alt={produit.titre}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover select-none"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-soft/30" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-10 w-10">
                <rect x="3" y="5" width="18" height="14" rx="1" />
                <path d="M3 15l5-5 4 4 3-3 6 6" />
                <circle cx="8.5" cy="9" r="1.3" />
              </svg>
            </div>
          )}
          <span
            className="absolute top-1.5 left-1.5 max-w-[calc(100%-12px)] leading-tight px-2 py-1 rounded-btn text-[10.5px] font-semibold bg-white text-ink shadow-[0_2px_6px_rgba(27,36,48,0.28)]"
          >
            {ETAT_LABELS[produit.etat] || 'Bon état'}
          </span>
          {produit.bonne_affaire && (
            <span className="absolute bottom-1.5 left-1.5 leading-tight px-2 py-1 rounded-btn text-[10.5px] font-semibold text-white bg-red-600 shadow-[0_2px_6px_rgba(27,36,48,0.28)]">
              Bonne affaire
            </span>
          )}
        </div>
        <div className={`px-1 pt-2 ${isLocation ? '' : 'pr-11'}`}>
          <h3 className="truncate font-serif font-semibold text-[14.5px] leading-snug text-ink">{produit.titre}</h3>
          <p className="text-[14px] font-bold text-clay-dark whitespace-nowrap">
            {formatFCFA(produit.prix_final_public)}
            {isLocation && <span className="text-[11px] font-medium text-ink-soft/75"> /jour</span>}
          </p>
        </div>
      </Link>
      {!isLocation && (
        <button
          type="button"
          onClick={() => onAjouter(produit)}
          aria-label={ajoute ? `${produit.titre} ajouté au panier` : `Ajouter ${produit.titre} au panier`}
          className={`absolute bottom-2.5 right-2.5 h-9 w-9 rounded-full flex items-center justify-center text-white transition-colors ${
            ajoute ? 'bg-teal-dark' : 'bg-clay-dark hover:bg-ink'
          }`}
        >
          {ajoute ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4" aria-hidden="true">
              <path d="M5 12l4.5 4.5L19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7V5a3 3 0 016 0v2M12 11v5M9.5 13.5h5" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

function TringleSquelette() {
  return (
    <div className="relative flex gap-4 sm:gap-6 px-7 sm:px-8 pb-4" aria-hidden="true">
      <span className="absolute left-0 right-0 top-[12px] h-[7px] rounded-full bg-line/70" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 w-[156px] sm:w-[176px] lg:w-[188px] pt-7">
          <div className="mt-4 rounded-[18px] bg-white p-2 shadow-[0_10px_24px_-12px_rgba(27,36,48,0.25)]">
            <div className="mx-auto mb-1.5 h-2.5 w-2.5 rounded-full bg-line/60" />
            <div className="aspect-square rounded-[12px] bg-line/40 animate-pulse" />
            <div className="h-3.5 w-3/4 rounded bg-line/50 animate-pulse mt-2.5" />
            <div className="h-3.5 w-1/3 rounded bg-line/50 animate-pulse mt-1.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

const TringleProduits = forwardRef(function TringleProduits({ produits, chargement }, ref) {
  const { addItem } = useCart();
  const [ajouteId, setAjouteId] = useState(null);
  const scrollerRef = useRef(null);
  const pendulesRef = useRef([]); // éléments DOM qui se balancent
  const etat = useRef({ angles: [], vitesses: [], omegas: [], raf: 0, dernier: 0, scrollX: 0, scrollT: 0 });
  const glisser = useRef({ actif: false, x: 0, depart: 0, bouge: false });

  useImperativeHandle(ref, () => ({
    defiler(direction) {
      const el = scrollerRef.current;
      if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
    },
  }));

  // --- boucle physique : démarre à la demande, s'arrête au repos -----------
  const relancer = useCallback(() => {
    const s = etat.current;
    if (s.raf) return;
    const tick = (now) => {
      const enMouvement = pasPhysique(s, pendulesRef.current, now);
      s.raf = enMouvement ? requestAnimationFrame(tick) : 0;
    };
    s.raf = requestAnimationFrame(tick);
  }, []);

  const pousser = useCallback((i, impulsion) => {
    if (prefereMoinsDeMouvement()) return;
    const s = etat.current;
    s.vitesses[i] = (s.vitesses[i] || 0) + impulsion;
    relancer();
  }, [relancer]);

  // fréquences légèrement différentes : les étiquettes ne bougent pas en bloc
  useEffect(() => {
    etat.current.omegas = produits.map((_, i) => 2 * Math.PI * (0.78 + ((i * 37) % 10) / 40));
  }, [produits]);

  // petit balancement d'arrivée quand la tringle entre à l'écran
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || produits.length === 0 || prefereMoinsDeMouvement()) return undefined;
    const obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      produits.forEach((_, i) => {
        etat.current.angles[i] = (i % 2 ? 1 : -1) * (7 + (i % 3));
        etat.current.vitesses[i] = 0;
      });
      relancer();
    }, { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [produits, relancer]);

  useEffect(() => () => cancelAnimationFrame(etat.current.raf), []);

  // --- défilement : les étiquettes « traînent » derrière la tringle --------
  const onScroll = () => {
    if (prefereMoinsDeMouvement()) return;
    const el = scrollerRef.current;
    const s = etat.current;
    const now = performance.now();
    const dt = Math.max(now - (s.scrollT || now), 8);
    const vitesse = ((el.scrollLeft - s.scrollX) / dt) * 1000; // px/s
    s.scrollX = el.scrollLeft;
    s.scrollT = now;
    if (Math.abs(vitesse) < 1) return;
    const impulsion = Math.max(-45, Math.min(45, -vitesse * 0.035));
    pendulesRef.current.forEach((_, i) => { s.vitesses[i] = (s.vitesses[i] || 0) + impulsion * (0.8 + (i % 3) * 0.1); });
    relancer();
  };

  // --- glisser à la souris (le doigt utilise le défilement natif) -----------
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = scrollerRef.current;
    glisser.current = { actif: true, x: e.clientX, depart: el.scrollLeft, bouge: false };
  };
  const onPointerMove = (e) => {
    const g = glisser.current;
    if (!g.actif) return;
    const dx = e.clientX - g.x;
    if (!g.bouge && Math.abs(dx) > 5) {
      g.bouge = true;
      scrollerRef.current.style.scrollSnapType = 'none';
      scrollerRef.current.setPointerCapture?.(e.pointerId);
    }
    if (g.bouge) scrollerRef.current.scrollLeft = g.depart - dx;
  };
  const finGlisser = () => {
    const g = glisser.current;
    if (!g.actif) return;
    g.actif = false;
    scrollerRef.current.style.scrollSnapType = '';
    // le clic qui suit un glisser ne doit pas ouvrir la fiche produit
    if (g.bouge) setTimeout(() => { glisser.current.bouge = false; }, 0);
  };
  const onClickCapture = (e) => {
    if (glisser.current.bouge) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // --- clavier : flèches pour passer d'une étiquette à l'autre ---------------
  const onKeyDown = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    const liens = [...scrollerRef.current.querySelectorAll('a[href]')];
    const i = liens.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    const cible =
      e.key === 'Home' ? 0 : e.key === 'End' ? liens.length - 1 : Math.max(0, Math.min(liens.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
    liens[cible].focus({ preventScroll: true });
    liens[cible].scrollIntoView({ behavior: prefereMoinsDeMouvement() ? 'auto' : 'smooth', inline: 'nearest', block: 'nearest' });
  };

  const ajouter = (produit) => {
    addItem(produit);
    setAjouteId(produit.id);
    setTimeout(() => setAjouteId((id) => (id === produit.id ? null : id)), 1400);
  };

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finGlisser}
      onPointerCancel={finGlisser}
      onPointerLeave={finGlisser}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      className="-mx-4 sm:-mx-6 overflow-x-auto no-scrollbar snap-x snap-proximity scroll-pl-7 sm:scroll-pl-8 cursor-grab active:cursor-grabbing [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]"
    >
      {chargement ? (
        <TringleSquelette />
      ) : (
        <ul className="relative flex w-max min-w-full gap-4 sm:gap-6 px-7 sm:px-8 pb-6" aria-label="Produits populaires">
          {/* la tringle en bois, avec ses deux supports */}
          <li aria-hidden="true" className="absolute left-0 right-0 top-[12px] h-[7px] rounded-full bg-gradient-to-b from-clay to-clay-dark shadow-[0_3px_6px_-2px_rgba(27,36,48,0.4)]">
            <span className="absolute inset-x-3 top-[1px] h-px rounded-full bg-white/35" />
            <span className="absolute -top-[5px] left-1 h-[17px] w-[10px] rounded-[4px] bg-ink/80" />
            <span className="absolute -top-[5px] right-1 h-[17px] w-[10px] rounded-[4px] bg-ink/80" />
          </li>
          {produits.map((p, i) => (
            <li
              key={p.id}
              className="group relative shrink-0 w-[156px] sm:w-[176px] lg:w-[188px] pt-7 snap-start select-none"
              onMouseEnter={() => pousser(i, i % 2 ? 26 : -26)}
              onFocus={() => pousser(i, 18)}
            >
              <Crochet />
              <div
                ref={(el) => { pendulesRef.current[i] = el; }}
                className="relative origin-top will-change-transform"
              >
                {/* cordon entre le crochet et le trou de l'étiquette */}
                <span className="absolute left-1/2 top-0 z-10 h-[29px] w-px -translate-x-1/2 bg-ink/35" aria-hidden="true" />
                <div className="pt-4">
                  <Etiquette produit={p} onAjouter={ajouter} ajoute={ajouteId === p.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default TringleProduits;
