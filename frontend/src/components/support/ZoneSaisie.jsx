// frontend/src/components/support/ZoneSaisie.jsx
// Champ de message : hauteur automatique, Entrée pour envoyer,
// Maj + Entrée pour aller à la ligne. `avant` = contenu affiché au-dessus
// (pièce jointe), `outils` = boutons à gauche du champ (ex. « Joindre »).
import { useEffect, useRef } from 'react';

const LONGUEUR_MAX = 2000;

export default function ZoneSaisie({ valeur, onChange, onEnvoyer, envoi, erreur, avant, outils, placeholder }) {
  const champRef = useRef(null);

  useEffect(() => {
    const champ = champRef.current;
    if (!champ) return;
    champ.style.height = 'auto';
    champ.style.height = `${Math.min(champ.scrollHeight, 140)}px`;
  }, [valeur]);

  const envoyer = async (e) => {
    e?.preventDefault();
    if (!valeur.trim() || envoi) return;
    await onEnvoyer();
    champRef.current?.focus();
  };

  return (
    <form onSubmit={envoyer} className="bg-white border-t border-line px-3 sm:px-5 py-3">
      {erreur && <p className="mb-2 text-[13px] text-red-700" role="alert">{erreur}</p>}
      {avant}
      <div className="flex items-end gap-2">
        {outils}
        <label htmlFor="champ-message" className="sr-only">Votre message</label>
        <textarea
          id="champ-message"
          ref={champRef}
          rows={1}
          maxLength={LONGUEUR_MAX}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              envoyer();
            }
          }}
          placeholder={placeholder || 'Écrivez votre message…'}
          className="flex-1 min-w-0 resize-none px-4 py-2.5 bg-sable border border-line rounded-[20px] text-[16px] sm:text-[14.5px] leading-relaxed focus:outline-none focus:border-teal"
        />
        <button
          type="submit"
          disabled={!valeur.trim() || envoi}
          aria-busy={envoi}
          aria-label="Envoyer le message"
          className="h-11 w-11 shrink-0 flex items-center justify-center rounded-full bg-clay-dark text-white hover:bg-ink transition-colors disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
      <p className="hidden sm:block mt-1.5 text-[11px] text-ink-soft/75">
        Entrée pour envoyer · Maj + Entrée pour aller à la ligne
        {valeur.length > LONGUEUR_MAX - 200 && ` · ${LONGUEUR_MAX - valeur.length} caractères restants`}
      </p>
    </form>
  );
}
