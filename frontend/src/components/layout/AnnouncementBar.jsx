const TICKER_ITEMS = [
  'Achetez des produits de qualité à moindre coût',
  'Rejoignez-nous en tant que vendeuse et vendez sans tracas',
];

export default function AnnouncementBar() {
  const ticker = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div>
      {/* Bandeau statique du haut — offre de lancement */}
      <div className="bg-orange text-ink">
        <div className="flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 text-[12.5px] font-bold text-center">
          <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7M7.5 8a2.5 2.5 0 010-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 010 5" /></svg>Offre de lancement</span>
          <span className="opacity-50" aria-hidden="true">|</span>
          <span className="inline-flex items-center gap-1.5 bg-white/30 rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-ink animate-pulse-dot" />
            Commission à 5% pour les 100 premières vendeuses (1er article)
          </span>
          <span className="opacity-50" aria-hidden="true">|</span>
          <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>Premières 100 vendeuses !</span>
        </div>
      </div>

      {/* Ticker défilant du bas */}
      <div className="bg-ink overflow-hidden whitespace-nowrap pause-on-hover">
        <div className="animate-marquee flex w-max py-2">
          {ticker.map((text, i) => (
            <span
              key={i}
              className="flex items-center gap-6 px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-sable/85 after:h-1 after:w-1 after:rounded-full after:bg-clay"
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
