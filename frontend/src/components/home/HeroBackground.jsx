// frontend/src/components/home/HeroBackground.jsx
import { useRef } from 'react';
// Photo locale (WebP ~80 Ko) : plus de dépendance à un site externe pour l'image principale
import HERO_IMAGE from '../../assets/hero-maman-bebe.webp';

const MOTIFS = [
  {
    className: 'w-9 top-[16%] left-[6%] text-teal animate-drift-1',
    path: 'M9 2h6M10 2v4l-3 3v9a2 2 0 002 2h6a2 2 0 002-2v-9l-3-3V2',
  },
  {
    className: 'w-7 top-[10%] right-[30%] text-clay animate-drift-2',
    path: 'M12 21s-7-4.5-9.5-9C.5 8 2 4 6 4c2 0 4 1.5 6 4 2-2.5 4-4 6-4 4 0 5.5 4 3.5 8-2.5 4.5-9.5 9-9.5 9z',
  },
  {
    className: 'w-8 top-[68%] left-[38%] text-teal animate-drift-3',
    path: 'M12 2l2.6 6.6L21 9l-5.2 4.3L17.4 21 12 17l-5.4 4 1.6-7.7L3 9l6.4-.4z',
  },
  {
    className: 'w-6 top-[42%] right-[7%] text-clay animate-drift-4',
    path: 'M6 3h9l3 4-7 14L4 7z',
  },
];

export default function HeroBackground({ mediaRef }) {
  const localRef = useRef(null);
  const ref = mediaRef || localRef;

  return (
    <>
      {/* Téléphone : photo entière (format d'origine 1504 × 992) posée en haut,
          le texte passe dessous. Dès 640 px : photo en fond derrière le texte. */}
      <div
        ref={ref}
        className="relative w-full aspect-[1504/992] overflow-hidden sm:overflow-visible sm:aspect-auto sm:w-auto sm:absolute sm:-inset-x-[2%] sm:-inset-y-[4%] sm:will-change-transform"
      >
        <img
          src={HERO_IMAGE}
          alt=""
          width="1504"
          height="992"
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover animate-kenburns max-sm:[animation:none]! [filter:saturate(.85)_contrast(1.05)]"
        />
        {/* fondu vers le fond du texte, sur téléphone seulement */}
        <div aria-hidden="true" className="sm:hidden absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-ink" />
        <div
          className="hidden sm:block absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(27,36,48,.55) 0%, rgba(27,36,48,.45) 40%, rgba(27,36,48,.58) 100%)',
          }}
        />
      </div>

      <div className="hidden sm:block absolute inset-0 z-[1] pointer-events-none">
        {MOTIFS.map((m, i) => (
          <span key={i} className={`absolute opacity-45 ${m.className}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d={m.path} />
            </svg>
          </span>
        ))}
      </div>
    </>
  );
}