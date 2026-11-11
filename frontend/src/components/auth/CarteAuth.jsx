// frontend/src/components/auth/CarteAuth.jsx
// Mise en page commune des petites pages de compte (mot de passe oublié,
// réinitialisation) : logo, carte centrée, liseré aux couleurs de la marque.
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

export default function CarteAuth({ children }) {
  return (
    <div className="min-h-screen bg-sable flex flex-col items-center justify-center px-4 sm:px-6 py-16">
      <Link to="/" className="mb-8" aria-label="Retour à l'accueil">
        <Logo className="h-10 w-auto" />
      </Link>
      <div className="w-full max-w-md bg-white rounded-m border border-line shadow-[0_18px_40px_-18px_rgba(27,36,48,0.3)] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-teal via-clay to-orange" />
        <div className="p-7 sm:p-10">{children}</div>
      </div>
      <Link to="/connexion" className="mt-6 text-[13px] font-semibold text-ink underline underline-offset-2 hover:text-clay-dark">
        Retour à la connexion
      </Link>
    </div>
  );
}
