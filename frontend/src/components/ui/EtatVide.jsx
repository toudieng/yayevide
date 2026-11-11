// frontend/src/components/ui/EtatVide.jsx
// État vide chaleureux et homogène : pastille d'icône douce, titre, petite
// phrase et action facultative. Purement visuel (aucune logique).
const ICONES = {
  boite: (
    <>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </>
  ),
  panier: (
    <>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V5a3 3 0 016 0v2" />
    </>
  ),
  coeur: (
    <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z" />
  ),
  recherche: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  message: (
    <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
  ),
  camion: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
};

export default function EtatVide({ icone = 'boite', titre, texte, action, compact = false, bordure = true, className = '' }) {
  return (
    <div
      className={`text-center ${bordure ? 'rounded-m border border-dashed border-line' : ''} ${compact ? 'py-6 px-4' : 'py-14 px-6'} ${className}`}
    >
      <span
        className={`mx-auto mb-4 flex items-center justify-center rounded-full bg-teal/10 text-teal-dark ${compact ? 'h-11 w-11' : 'h-14 w-14'}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={compact ? 'h-5 w-5' : 'h-6 w-6'}>
          {ICONES[icone] || ICONES.boite}
        </svg>
      </span>
      {titre && (
        <p className={`font-impact font-extrabold text-ink ${compact ? 'text-[16px]' : 'text-[20px]'} mb-1.5`}>{titre}</p>
      )}
      {texte && <p className="text-sm text-ink-soft/75 leading-relaxed max-w-sm mx-auto">{texte}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
