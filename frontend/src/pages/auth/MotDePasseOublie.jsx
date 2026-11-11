// frontend/src/pages/auth/MotDePasseOublie.jsx
// Étape 1 : demander un lien de réinitialisation par e-mail.
import { useState } from 'react';
import CarteAuth from '../../components/auth/CarteAuth';
import { apiFetch } from '../../utils/api';

export default function MotDePasseOublie() {
  const [identifiant, setIdentifiant] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const envoyer = async (e) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const res = await apiFetch('/mot-de-passe-oublie/', { method: 'POST', body: { identifiant } });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMessage(data.message);
      else setErreur(data.identifiant || data.general || 'Une erreur est survenue. Réessayez dans un instant.');
    } catch {
      setErreur('Impossible de joindre le serveur. Vérifiez votre connexion.');
    }
    setEnvoi(false);
  };

  return (
    <CarteAuth>
      {message ? (
        <div className="text-center" role="status">
          <div className="h-14 w-14 mx-auto mb-5 rounded-full bg-teal/10 flex items-center justify-center text-teal-dark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <h1 className="font-impact font-extrabold text-2xl text-ink mb-2">Vérifiez vos e-mails</h1>
          <p className="text-sm text-ink-soft leading-relaxed">{message}</p>
          <p className="text-[13px] text-ink-soft/75 mt-4">Pensez à regarder dans vos courriers indésirables. Le lien est valable 2 heures.</p>
        </div>
      ) : (
        <>
          <h1 className="font-impact font-extrabold text-2xl text-ink mb-2 text-center">Mot de passe oublié ?</h1>
          <p className="text-sm text-ink-soft text-center leading-relaxed mb-7">
            Pas de souci ! Indiquez votre e-mail, votre identifiant ou votre numéro : nous vous envoyons un lien pour en choisir un nouveau.
          </p>
          {erreur && (
            <div className="mb-5 p-3.5 text-[13px] bg-red-50 text-red-700 rounded-btn border border-red-100" role="alert">
              {erreur}
            </div>
          )}
          <form onSubmit={envoyer} className="space-y-5">
            <div>
              <label htmlFor="identifiant" className="block text-xs font-bold text-ink mb-2">
                E-mail, identifiant ou numéro *
              </label>
              <input
                id="identifiant"
                type="text"
                required
                autoComplete="username"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className="w-full px-4 py-3.5 bg-sable border border-line rounded-btn text-[16px] sm:text-sm focus:outline-none focus:border-teal focus:bg-white transition-all text-ink"
                placeholder="Ex : awa@email.com ou 77XXXXXXX"
              />
            </div>
            <button
              type="submit"
              disabled={envoi}
              aria-busy={envoi}
              className="w-full min-h-[48px] bg-clay-dark hover:bg-ink text-white font-bold py-3.5 rounded-btn text-sm transition-colors disabled:opacity-60"
            >
              {envoi ? 'Envoi en cours…' : 'Recevoir le lien'}
            </button>
          </form>
        </>
      )}
    </CarteAuth>
  );
}
