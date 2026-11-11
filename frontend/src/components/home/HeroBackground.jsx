// frontend/src/components/home/HeroBackground.jsx
import { useRef } from 'react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1560707854-fb9a10eeaace?fm=jpg&q=80&w=2200&auto=format&fit=crop';

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
      <div ref={ref} className="absolute -inset-x-[2%] -inset-y-[4%] will-change-transform">
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover animate-kenburns [filter:saturate(.85)_contrast(1.05)]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(27,36,48,.55) 0%, rgba(27,36,48,.35) 40%, rgba(27,36,48,.5) 100%)',
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