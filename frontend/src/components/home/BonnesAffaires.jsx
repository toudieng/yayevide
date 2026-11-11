import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

const CHIPS = [
  { name: 'Tenues de fête', img: 'https://images.unsplash.com/photo-1684244160171-97f5dac39204?fm=jpg&q=70&w=500&auto=format&fit=crop' },
  { name: 'Chaussures de fête', img: 'https://images.unsplash.com/photo-1622290291720-ac961c43ee30?fm=jpg&q=70&w=500&auto=format&fit=crop' },
  { name: 'Sacs & accessoires', img: 'https://images.unsplash.com/photo-1635874714425-c342060a4c58?fm=jpg&q=70&w=500&auto=format&fit=crop' },
  { name: 'Déguisements', img: 'https://images.unsplash.com/photo-1642379831634-1eb6a4e2788d?fm=jpg&q=70&w=500&auto=format&fit=crop' },
  { name: "Décorations d'occasion", img: 'https://images.unsplash.com/photo-1632337948797-ba161d29532b?fm=jpg&q=70&w=500&auto=format&fit=crop' },
];

const WAVE_PATH = 'M0,64 C240,10 480,0 720,22 C960,44 1200,54 1440,18 L1440,0 L0,0 Z';

export default function BonnesAffaires() {
  return (
    <div className="relative bg-night">
      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="absolute -top-px left-0 w-full h-16 z-[1]"
      >
        <path fill="var(--color-sable)" d={WAVE_PATH} />
      </svg>

      <section className="relative z-[2] py-13 text-cream">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <SectionHeader
            eyebrow="Pépites"
            title="Bonnes affaires"
            description="Des trésors à petit prix pour les grandes occasions, comme pour le quotidien."
            className="[&_h2]:text-cream [&_p]:text-cream/65"
          />

          <Reveal as="div" className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1.5">
            {CHIPS.map((chip) => (
              <Link
                key={chip.name}
                to="/boutique?bonne_affaire=true"
                className="group relative shrink-0 w-50 aspect-square overflow-hidden rounded-m border border-white/14"
              >
                <img
                  src={chip.img}
                  alt={chip.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 to-transparent" />
                <span className="absolute left-3.5 bottom-3.5 text-[12.5px] font-semibold uppercase tracking-wide text-cream">
                  {chip.name}
                </span>
              </Link>
            ))}
          </Reveal>

          <Link
            to="/boutique?bonne_affaire=true"
            className="mt-7.5 inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide border-b border-cream/40 pb-1"
          >
            Voir toutes les bonnes affaires
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>

      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="absolute -bottom-px left-0 w-full h-16 z-[1] scale-y-[-1]"
      >
        <path fill="var(--color-sable)" d={WAVE_PATH} />
      </svg>
    </div>
  );
}
