// frontend/src/pages/auth/VerifierEmail.jsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import { apiFetch } from '../../utils/api';

export default function VerifierEmail() {
  const { username, token } = useParams();
  const [statut, setStatut] = useState('chargement'); // chargement | succes | erreur
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch(`/verifier-email/${username}/${token}/`)
      .then(async (res) => {
        const data = await res.json();
        setMessage(data.message || data.general || '');
        setStatut(res.ok ? 'succes' : 'erreur');
      })
      .catch(() => {
        setStatut('erreur');
        setMessage('Impossible de joindre le serveur.');
      });
  }, [username, token]);

  return (
    <div className="min-h-screen bg-sable flex flex-col items-center justify-center px-6 py-16">
      <Link to="/" className="mb-8">
        <Logo className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-md bg-cream rounded-m border border-ink shadow-2xl overflow-hidden text-center">
        <div className="h-1.5 bg-gradient-to-r from-teal via-clay to-orange" />
        <div className="p-10">
          {statut === 'chargement' && (
            <div className="h-9 w-9 mx-auto rounded-full border-2 border-line border-t-teal animate-spin" />
          )}

          {statut === 'succes' && (
            <>
              <div className="h-14 w-14 mx-auto mb-5 rounded-full bg-teal/10 flex items-center justify-center text-teal-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
                  <path d="M5 12l4.5 4.5L19 7" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl text-ink mb-2">Compte vérifié !</h1>
              <p className="text-sm text-ink-soft/75 mb-8">{message}</p>
              <Link to="/connexion" className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-cream rounded-btn text-sm font-bold uppercase tracking-wide hover:bg-clay transition-colors">
                Se connecter
              </Link>
            </>
          )}

          {statut === 'erreur' && (
            <>
              <div className="h-14 w-14 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
                  <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl text-ink mb-2">Lien invalide</h1>
              <p className="text-sm text-ink-soft/75 mb-8">{message}</p>
              <Link to="/connexion" className="text-teal-dark font-semibold hover:underline">Retour à la connexion</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
