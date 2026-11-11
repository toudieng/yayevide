// frontend/src/components/boutique/FilterSidebar.jsx
import { CATEGORIES } from '../../data/categories';

const ETATS = [
  { value: 'neuf', label: 'Neuf avec étiquette' },
  { value: 'excellent', label: 'Excellent état' },
  { value: 'bon', label: 'Bon état' },
];

export default function FilterSidebar({ filters, onChange, counts, onReset }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <aside className="space-y-8">
      {/* CATÉGORIES */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink mb-3.5">Catégorie</h3>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => set({ categorie: '' })}
            className={`flex items-center justify-between text-left px-1 py-1.5 text-[13.5px] rounded-btn transition-colors ${
              !filters.categorie ? 'text-teal-dark font-semibold' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Toutes les catégories
            <span className="text-[11px] text-ink-soft/75">{counts.total ?? 0}</span>
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => set({ categorie: cat.slug })}
              className={`flex items-center justify-between text-left px-1 py-1.5 text-[13.5px] rounded-btn transition-colors ${
                filters.categorie === cat.slug ? 'text-teal-dark font-semibold' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {cat.name}
              <span className="text-[11px] text-ink-soft/75">{counts[cat.slug] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TYPE D'OFFRE */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink mb-3.5">Type d'offre</h3>
        <div className="flex gap-2">
          {[
            { value: '', label: 'Tous' },
            { value: 'vente', label: 'À vendre' },
            { value: 'location', label: 'À louer' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set({ typeOffre: opt.value })}
              className={`px-3.5 py-2 rounded-btn text-[12.5px] font-semibold border transition-colors ${
                filters.typeOffre === opt.value
                  ? 'bg-ink text-cream border-ink'
                  : 'border-line text-ink-soft hover:border-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ÉTAT */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink mb-3.5">État</h3>
        <div className="flex flex-col gap-2">
          {ETATS.map((e) => (
            <label key={e.value} className="flex items-center gap-2.5 text-[13.5px] text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={filters.etats.includes(e.value)}
                onChange={(ev) => {
                  const next = ev.target.checked
                    ? [...filters.etats, e.value]
                    : filters.etats.filter((v) => v !== e.value);
                  set({ etats: next });
                }}
                className="h-3.5 w-3.5 accent-teal"
              />
              {e.label}
            </label>
          ))}
        </div>
      </div>

      {/* PRIX */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink mb-3.5">Prix (FCFA)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.prixMin}
            onChange={(e) => set({ prixMin: e.target.value })}
            className="w-full px-3 py-2 bg-cream border border-line rounded-btn text-[13px] focus:outline-none focus:border-teal"
          />
          <span className="text-ink-soft/75 text-xs">—</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.prixMax}
            onChange={(e) => set({ prixMax: e.target.value })}
            className="w-full px-3 py-2 bg-cream border border-line rounded-btn text-[13px] focus:outline-none focus:border-teal"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="text-[12.5px] font-semibold text-clay hover:underline"
      >
        Réinitialiser les filtres
      </button>
    </aside>
  );
}
