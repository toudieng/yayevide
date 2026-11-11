// frontend/src/pages/auth/Connexion.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import { apiFetch } from '../../utils/api';

export default function Connexion({ onLoginSuccess }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (erreur) setErreur(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);

    try {
      const response = await apiFetch('/connexion/', { method: 'POST', body: credentials });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data);
        // Retour vers la messagerie quand on y était envoyé (bouton
        // « Contacter la vendeuse », icône Messages…), quel que soit le rôle
        if (location.state?.from?.startsWith('/messages')) {
          navigate(location.state.from);
        } else if (data.role === 'vendeur') {
          navigate('/dashboard');
        } else if (data.role === 'admin') {
          navigate('/admin');
        } else if (data.role === 'livreur') {
          navigate('/livreur');
        } else {
          navigate(location.state?.from || '/');
        }
      } else {
        setErreur(data.general || "Une erreur est survenue lors de la connexion.");
      }
    } catch {
      setErreur("Impossible de joindre le serveur. Vérifiez que Django est lancé.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center px-4 lg:px-0">
      {/* Logo + en-tête textuel — bloc centré, logo agrandi pour l'équilibre
          avec "Bon retour !", qui reprend la police display en italique
          pour un rendu plus chic/signature */}
      <div className="mb-8 flex flex-col items-center">
        <Logo className="h-14 w-auto mb-6" />
        <h2 className="text-3xl font-serif italic font-bold text-ink tracking-tight">Bon retour !</h2>
        <p className="text-sm text-ink-soft/75 mt-2">Connectez-vous pour vendre et louer vos articles.</p>
      </div>

      {erreur && (
        <div className="mb-5 p-4 text-[13px] bg-red-50 text-red-700 rounded-btn border border-red-100 text-center font-medium">
          {erreur}
        </div>
      )}

      {/* Formulaire épuré */}
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        <div>
          <label className="block text-xs font-bold text-ink mb-2">
            Numéro de téléphone ou identifiant *
          </label>
          <input
            type="text"
            name="username"
            required
            value={credentials.username}
            onChange={handleChange}
            className="w-full px-4 py-3.5 bg-sable border border-line rounded-btn text-[16px] sm:text-sm focus:outline-none focus:border-orange focus:ring-4 focus:ring-orange/15 focus:bg-white shadow-sm transition-all text-ink"
            placeholder="Ex: 77XXXXXXX"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-ink">
              Mot de passe *
            </label>
          </div>
          <div className="relative">
            <input
              type={afficherMotDePasse ? 'text' : 'password'}
              name="password"
              required
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-4 py-3.5 pr-11 bg-sable border border-line rounded-btn text-[16px] sm:text-sm focus:outline-none focus:border-orange focus:ring-4 focus:ring-orange/15 focus:bg-white shadow-sm transition-all text-ink"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setAfficherMotDePasse((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft/75 hover:text-orange transition-colors"
              aria-label={afficherMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {afficherMotDePasse ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5.5 0-9.5-4.5-10.5-7 .58-1.47 2.02-3.6 4.13-5.19M9.9 4.24A10.6 10.6 0 0 1 12 4c5.5 0 9.5 4.5 10.5 7-.4 1.02-1.1 2.24-2.14 3.4M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                  <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              className="h-4 w-4 text-orange border-line rounded focus:ring-orange"
            />
            <label htmlFor="remember_me" className="ml-2 text-xs text-ink-soft/75 select-none">
              Se souvenir de moi
            </label>
          </div>
          <Link to="/mot-de-passe-oublie" className="text-xs text-ink-soft/75 hover:text-clay-dark underline underline-offset-2 font-medium py-1">
            Mot de passe perdu ?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full min-h-[48px] bg-clay-dark hover:bg-ink text-white font-bold py-4 rounded-btn text-sm transition-all shadow-md tracking-wide mt-4"
        >
          Se connecter
        </button>
      </form>

      <p className="text-xs text-center text-ink-soft/75 mt-8">
        Pas encore de compte ? <a href="/inscription" className="text-teal-dark font-semibold hover:underline">S'inscrire</a>
      </p>
    </div>
  );
}
