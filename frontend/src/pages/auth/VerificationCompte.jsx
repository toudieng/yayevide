// frontend/src/pages/auth/VerificationCompte.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import { apiFetch } from '../../utils/api';

const WHATSAPP_SUPPORT_NUMBER = '221765879303'; // numéro de test (Xaali) — à remplacer par celui de la propriétaire au moment de la livraison finale

export default function VerificationCompte() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [renvoye, setRenvoye] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Si on arrive ici sans état (ex: lien direct, ou rechargement de page),
  // on redirige proprement vers l'inscription plutôt que d'afficher une page vide.
  if (!state?.username) {
    return (
      <div className="min-h-screen bg-sable flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-ink-soft/75 mb-4">Aucune inscription en cours.</p>
          <Link to="/inscription" className="text-teal-dark font-semibold hover:underline">Créer un compte</Link>
        </div>
      </div>
    );
  }

  const { username, token } = state;
  const messageWhatsapp = encodeURIComponent(
    `Bonjour Yaay Vidé, je confirme mon inscription en tant que vendeuse / loueuse.\nNom d'utilisateur : ${username}\nCode de vérification : ${token}`
  );
  const whatsappHref = `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${messageWhatsapp}`;

  const handleRenvoyer = async () => {
    setRenvoiEnCours(true);
    setErreur(null);
    try {
      const res = await apiFetch('/renvoyer-verification-email/', { method: 'POST', body: { username } });
      if (res.ok) {
        setRenvoye(true);
      } else {
        const data = await res.json();
        setErreur(data.general || 'Une erreur est survenue.');
      }
    } catch {
      setErreur('Impossible de joindre le serveur.');
    } finally {
      setRenvoiEnCours(false);
    }
  };

  return (
    <div className="min-h-screen bg-sable flex flex-col items-center justify-center px-6 py-16">
      <Link to="/" className="mb-8">
        <Logo className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-lg bg-cream rounded-m border border-ink shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-teal via-clay to-orange" />
        <div className="p-10 text-center">
          <div className="h-14 w-14 mx-auto mb-5 rounded-full bg-teal/10 flex items-center justify-center text-teal-dark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-ink mb-2">Plus qu'une étape !</h1>
          <p className="text-sm text-ink-soft/75 mb-8 leading-relaxed">
            Pour activer votre boutique <span className="font-semibold text-ink">{username}</span>, confirmez votre compte par WhatsApp ou par email.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {/* OPTION WHATSAPP */}
            <div className="border border-line rounded-btn p-5 flex flex-col">
              <div className="h-9 w-9 rounded-full bg-teal/10 text-teal-dark flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                  <path d="M3 21l1.65-4.95A8 8 0 1 1 9 19.5L3 21z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-ink mb-1.5">Par WhatsApp</h3>
              <p className="text-[12.5px] text-ink-soft/75 mb-4 flex-1">
                Envoyez votre code à notre équipe, qui validera votre boutique sous peu.
              </p>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="text-center px-4 py-2.5 bg-teal text-white rounded-btn text-[12.5px] font-bold uppercase tracking-wide hover:bg-teal-dark transition-colors">
                Envoyer mon code
              </a>
            </div>

            {/* OPTION EMAIL */}
            <div className="border border-line rounded-btn p-5 flex flex-col">
              <div className="h-9 w-9 rounded-full bg-orange/10 text-orange flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-ink mb-1.5">Par email</h3>
              <p className="text-[12.5px] text-ink-soft/75 mb-4 flex-1">
                {renvoye
                  ? 'Email envoyé ! Cliquez sur le lien reçu pour activer votre compte instantanément.'
                  : 'Recevez un lien de confirmation immédiat, sans attendre.'}
              </p>
              <button
                type="button"
                onClick={handleRenvoyer}
                disabled={renvoiEnCours || renvoye}
                className="px-4 py-2.5 bg-clay-dark text-white rounded-btn text-[12.5px] font-bold uppercase tracking-wide hover:bg-orange-dark transition-colors disabled:opacity-60"
              >
                {renvoye ? 'Email envoyé ✓' : renvoiEnCours ? 'Envoi...' : "Recevoir l'email"}
              </button>
            </div>
          </div>

          {erreur && <p className="text-[12.5px] text-red-500 mt-4">{erreur}</p>}

          <button
            type="button"
            onClick={() => navigate('/connexion')}
            className="text-[12.5px] font-semibold text-ink-soft/75 hover:text-ink mt-7"
          >
            J'ai déjà validé mon compte → Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
