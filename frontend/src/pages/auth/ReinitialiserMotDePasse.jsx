// frontend/src/pages/auth/ReinitialiserMotDePasse.jsx
// Étape 2 : lien reçu par e-mail → choisir un nouveau mot de passe.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CarteAuth from '../../components/auth/CarteAuth';
import { apiFetch } from '../../utils/api';

export default function ReinitialiserMotDePasse() {
  const { uid, token } = useParams();
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [afficher, setAfficher] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreurs, setErreurs] = useState([]);

  const envoyer = async (e) => {
    e.preventDefault();
    if (motDePasse !== confirmation) {
      setErreurs(['Les deux mots de passe ne sont pas identiques.']);
      return;
    }
    setErreurs([]);
    setEnvoi(true);
    try {
      const res = await apiFetch('/reinitialiser-mot-de-passe/', {
        method: 'POST',
        body: { uid, token, mot_de_passe: motDePasse },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setSucces(data.message);
      else setErreurs(data.mot_de_passe || [data.general || 'Une erreur est survenue. Réessayez.']);
    } catch {
      setErreurs(['Impossible de joindre le serveur. Vérifiez votre connexion.']);
    }
    setEnvoi(false);
  };

  const champ =
    'w-full px-4 py-3.5 bg-sable border border-line rounded-btn text-[16px] sm:text-sm focus:outline-none focus:border-teal focus:bg-white transition-all text-ink';

  return (
    <CarteAuth>
      {succes ? (
        <div className="text-center" role="status">
          <div className="h-14 w-14 mx-auto mb-5 rounded-full bg-teal/10 flex items-center justify-center text-teal-dark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7" aria-hidden="true">
              <path d="M5 12l4.5 4.5L19 7" />
            </svg>
          </div>
          <h1 className="font-impact font-extrabold text-2xl text-ink mb-2">C'est fait !</h1>
          <p className="text-sm text-ink-soft mb-7">{succes}</p>
          <Link
            to="/connexion"
            className="inline-flex items-center justify-center min-h-[48px] px-7 bg-clay-dark hover:bg-ink text-white font-bold rounded-btn text-sm transition-colors"
          >
            Se connecter
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-impact font-extrabold text-2xl text-ink mb-2 text-center">Nouveau mot de passe</h1>
          <p className="text-sm text-ink-soft text-center mb-7">
            Choisissez un mot de passe d'au moins 8 caractères, facile à retenir pour vous mais difficile à deviner.
          </p>
          {erreurs.length > 0 && (
            <div className="mb-5 p-3.5 text-[13px] bg-red-50 text-red-700 rounded-btn border border-red-100 space-y-1" role="alert">
              {erreurs.map((m) => (
                <p key={m}>{m}</p>
              ))}
              {erreurs.some((m) => m.includes('plus valable')) && (
                <Link to="/mot-de-passe-oublie" className="inline-block mt-1 font-semibold underline underline-offset-2">
                  Recevoir un nouveau lien
                </Link>
              )}
            </div>
          )}
          <form onSubmit={envoyer} className="space-y-5">
            <div>
              <label htmlFor="mdp" className="block text-xs font-bold text-ink mb-2">Nouveau mot de passe *</label>
              <div className="relative">
                <input
                  id="mdp"
                  type={afficher ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className={`${champ} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setAfficher((v) => !v)}
                  aria-label={afficher ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-ink-soft/75 hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
                    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
                    <circle cx="12" cy="12" r="3" />
                    {afficher && <path d="M2 2l20 20" />}
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="mdp2" className="block text-xs font-bold text-ink mb-2">Confirmez le mot de passe *</label>
              <input
                id="mdp2"
                type={afficher ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className={champ}
              />
            </div>
            <button
              type="submit"
              disabled={envoi}
              aria-busy={envoi}
              className="w-full min-h-[48px] bg-clay-dark hover:bg-ink text-white font-bold py-3.5 rounded-btn text-sm transition-colors disabled:opacity-60"
            >
              {envoi ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}
            </button>
          </form>
        </>
      )}
    </CarteAuth>
  );
}
