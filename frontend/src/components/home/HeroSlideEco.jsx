// frontend/src/components/home/HeroSlideEco.jsx
import Button from '../ui/Button';
import HeroBackground from './HeroBackground';

export default function HeroSlideEco({ mediaRef }) {
  return (
    <div className="relative h-full w-full flex flex-col sm:flex-row sm:items-center overflow-hidden bg-ink">
      <HeroBackground mediaRef={mediaRef} />

      <div className="relative z-[2] w-full mx-auto max-w-[1280px] px-6 md:px-12 pt-4 pb-12 sm:py-0">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-impact font-extrabold text-cream leading-[1.06] text-[31px] sm:text-[52px] lg:text-[clamp(40px,calc(8vw-42px),56px)] xl:text-[56px] 2xl:text-[68px]">
            Consommer mieux,
            <br />
            <span className="relative inline-block italic font-serif font-medium text-peche pb-3.5">
              pour nos petits
              <span aria-hidden="true" className="absolute left-1/2 bottom-0 -translate-x-1/2 h-px w-20 sm:w-24 bg-gradient-to-r from-transparent via-peche to-transparent" />
            </span>
          </h1>
          <p className="text-cream/80 text-[15px] sm:text-[17px] leading-relaxed max-w-md my-4 sm:my-6.5">
            Chaque article vendu sur Yaay Vidé prolonge la vie d'un objet et réduit notre empreinte. Ensemble, agissons pour un Sénégal plus vert.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <Button to="/a-propos" variant="primary" shine pulse>
              En savoir plus
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}