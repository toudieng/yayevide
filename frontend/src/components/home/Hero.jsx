import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Hero3DShowcase from './Hero3DShowcase';
import HeroBackground from './HeroBackground';
import HeroSlideEco from './HeroSlideEco';
import HeroSlideExpress from './HeroSlideExpress';

function SlideActuel({ sectionRef, mediaRef }) {
  return (
    <div className="relative h-full w-full flex items-center overflow-hidden bg-ink">
      <HeroBackground mediaRef={mediaRef} />

      <Hero3DShowcase trackRef={sectionRef} />

      <div className="relative z-[2] w-full mx-auto max-w-[1280px] px-6 md:px-12">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-impact font-extrabold text-cream leading-[1.06] text-[38px] sm:text-[52px] lg:text-[68px]">
            La première marketplace
            <br />
            pour mamans
            <br />
            <span className="relative inline-block italic font-serif font-semibold text-clay">
              au Sénégal
              <svg
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
                className="absolute left-0 -bottom-2.5 w-full h-4.5 animate-draw"
              >
                <path
                  d="M2,12 C40,18 90,2 140,10 C160,13 180,9 198,11"
                  fill="none"
                  stroke="#C4602F"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="text-cream/80 text-[17px] leading-relaxed max-w-md my-6.5">
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
          mediaRef.current.style.transform = `translateY(${window.scrollY * 0.18}px)`;
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
      className="relative min-h-[96vh]"
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
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
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