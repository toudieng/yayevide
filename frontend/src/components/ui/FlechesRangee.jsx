// frontend/src/components/ui/FlechesRangee.jsx
// Deux petites flèches discrètes sous une rangée qui défile de côté
// (téléphone seulement : dès 640 px les rangées redeviennent des grilles).
function Fleche({ direction, onClick, disabled, libelle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={libelle}
      className="h-11 w-11 rounded-full border border-line bg-white flex items-center justify-center text-ink enabled:active:bg-sable disabled:opacity-35 transition-opacity"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
        <path d={direction < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}

export default function FlechesRangee({ bords, defiler, precedent, suivant, className = '' }) {
  return (
    <div className={`sm:hidden mt-3 flex justify-center gap-3 ${className}`}>
      <Fleche direction={-1} onClick={() => defiler(-1)} disabled={bords.debut} libelle={precedent} />
      <Fleche direction={1} onClick={() => defiler(1)} disabled={bords.fin} libelle={suivant} />
    </div>
  );
}
