const ITEMS = [
  {
    label: '+15 000 pépites vérifiées',
    icon: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z',
  },
  {
    label: 'Wave · Orange Money · Free Money',
    icon: 'M3 10h18M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M5 10v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
  },
  {
    label: 'Livraison Express 24–48h',
    icon: 'M2 8h13v8H2zM15 11h4l3 3v2h-7z',
  },
  {
    label: 'Dès 5% pour les 100 premières vendeuses',
    icon: 'M12 21s-7-4.5-9.5-9C.5 8 2 4 6 4c2 0 4 1.5 6 4 2-2.5 4-4 6-4 4 0 5.5 4 3.5 8-2.5 4.5-9.5 9-9.5 9z',
  },
];

export default function TrustStrip() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div className="bg-cream overflow-hidden whitespace-nowrap pause-on-hover">
      <div className="animate-marquee-reverse flex w-max py-3.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 px-7 text-[12.5px] font-semibold tracking-wide text-ink-soft"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className={`h-4 w-4 shrink-0 ${i % 2 === 0 ? 'text-teal-dark' : 'text-clay'}`}
            >
              <path d={item.icon} />
            </svg>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
