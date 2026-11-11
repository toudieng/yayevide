import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Hero3DShowcase, { HeroShowcaseCompact } from './Hero3DShowcase';
import HeroBackground from './HeroBackground';
import HeroSlideEco from './HeroSlideEco';
import HeroSlideExpress from './HeroSlideExpress';

function SlideActuel({ sectionRef, mediaRef }) {
  return (
    <div className="relative h-full w-full flex flex-col sm:flex-row sm:items-center overflow-hidden bg-ink">
      <HeroBackground mediaRef={mediaRef} />

      <Hero3DShowcase trackRef={sectionRef} />

      {/* Titre toujours centré : entre 1024 et 1279 px, sa taille suit la
          largeur de l'écran pour laisser la place au bloc produit à droite */}
      <div className="relative z-[2] w-full mx-auto max-w-[1280px] px-6 md:px-12 pt-4 pb-12 sm:py-0">
        <div className="flex flex-col items-center text-center">
          <HeroShowcaseCompact />
          <h1 className="font-impact font-extrabold text-cream leading-[1.06] text-[31px] sm:text-[52px] lg:text-[clamp(40px,calc(8vw-42px),56px)] xl:text-[56px] 2xl:text-[68px]">
            La première marketplace
            <br />
            pour mamans
            <br />
            <span className="relative inline-block italic font-serif font-medium text-peche pb-3.5">
              au Sénégal
              <span aria-hidden="true" className="absolute left-1/2 bottom-0 -translate-x-1/2 h-px w-20 sm:w-24 bg-gradient-to-r from-transparent via-peche to-transparent" />
            </span>
          </h1>
          <p className="text-cream/80 text-[15px] sm:text-[17px] leading-relaxed max-w-md my-4 sm:my-6.5">
            Achetez, vendez et louez des articles pour bébés, enfants et mamans en toute sécurité.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <Button to="/boutique" variant="primary" shine pulse>
              Découvrir les articles
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Button>
            <Button to="/vendeuse/ajouter-produit" variant="outline-light" className="border-2 border-white">
              Vendre / Louer mes articles
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SLIDE_COUNT = 3;
const AUTOPLAY_MS = 7000;

export default function Hero() {
  const sectionRef = useRef(null);
  const mediaRef = useRef(null);
  const [slide, setSlide] = useState(0);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (mediaRef.current) {
          // Sur téléphone, la photo est posée au-dessus du texte : pas de
          // parallaxe, sinon elle glisserait sur le titre.
          mediaRef.current.style.transform =
            window.innerWidth < 640 ? '' : `translateY(${window.scrollY * 0.18}px)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (pause) return;
    const interval = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDE_COUNT);
    }, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [pause]);

  const allerA = (i) => {
    setSlide(i);
    setPause(true);
    setTimeout(() => setPause(false), AUTOPLAY_MS);
  };

  return (
    <section
      ref={sectionRef}
      className="relative grid sm:block sm:min-h-[96vh]"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      {[
        <SlideActuel key="actuel" sectionRef={sectionRef} mediaRef={mediaRef} />,
        <HeroSlideEco key="eco" />,
        <HeroSlideExpress key="express" />,
      ].map((content, i) => (
        <div
          key={i}
          className={`col-start-1 row-start-1 sm:absolute sm:inset-0 transition-opacity duration-700 ease-out ${
            i === slide ? 'opacity-100 z-[1]' : 'opacity-0 pointer-events-none z-0'
          }`}
        >
          {content}
        </div>
      ))}

      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-[3] flex items-center gap-2.5">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Aller à la diapositive ${i + 1}`}
            onClick={() => allerA(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === slide ? 'w-7 bg-cream' : 'w-2 bg-cream/40 hover:bg-cream/70'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Diapositive précédente"
        onClick={() => allerA((slide - 1 + SLIDE_COUNT) % SLIDE_COUNT)}
        className="hidden lg:flex absolute left-5 top-1/2 -translate-y-1/2 z-[3] h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-cream backdrop-blur-sm transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Diapositive suivante"
        onClick={() => allerA((slide + 1) % SLIDE_COUNT)}
        className="hidden lg:flex absolute right-5 top-1/2 -translate-y-1/2 z-[3] h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-cream backdrop-blur-sm transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </section>
  );
}