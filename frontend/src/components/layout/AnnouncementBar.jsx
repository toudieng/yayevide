const TICKER_ITEMS = [
  'Achetez des produits de qualité à moindre coût',
  'Rejoignez-nous en tant que vendeuse et vendez sans tracas',
];

export default function AnnouncementBar() {
  const ticker = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div>
      {/* Bandeau statique du haut — offre de lancement */}
      <div className="bg-orange text-white">
        <div className="flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 text-[12.5px] font-bold text-center">
          <span>🛍️ Offre de lancement 🎉</span>
          <span className="opacity-60">|</span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
            Commission à 5% pour les 100 premières vendeuses (1er article)
          </span>
          <span className="opacity-60">|</span>
          <span>Premières 100 vendeuses ! 🚀</span>
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
