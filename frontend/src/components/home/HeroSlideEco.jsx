// frontend/src/components/home/HeroSlideEco.jsx
import Button from '../ui/Button';
import HeroBackground from './HeroBackground';

export default function HeroSlideEco({ mediaRef }) {
  return (
    <div className="relative h-full w-full flex items-center overflow-hidden bg-ink">
      <HeroBackground mediaRef={mediaRef} />

      <div className="relative z-[2] w-full mx-auto max-w-[1280px] px-6 md:px-12">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-impact font-extrabold text-cream leading-[1.06] text-[38px] sm:text-[52px] lg:text-[56px] 2xl:text-[68px]">
            Consommer mieux,
            <br />
            <span className="relative inline-block italic font-serif font-semibold text-clay">
              pour nos petits
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