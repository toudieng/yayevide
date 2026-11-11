// frontend/src/components/vendeuse/ShellVendeuse.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import { apiFetch } from '../../utils/api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', path: '/dashboard' },
  { id: 'ajouter', label: 'Ajouter un produit', path: '/vendeuse/ajouter-produit' },
  { id: 'articles', label: 'Mes articles', path: '/vendeuse/mes-articles' },
  { id: 'commandes', label: 'Commandes', path: '/vendeuse/commandes' },
  { id: 'ventes', label: 'Ventes', path: '/vendeuse/ventes' },
  { id: 'locations', label: 'Locations', path: '/vendeuse/locations' },
  { id: 'commentaires', label: 'Commentaires', path: '/vendeuse/commentaires' },
  { id: 'boutique', label: 'Ma boutique', path: '/vendeuse/boutique' },
];

const ICONS = {
  dashboard: <path d="M4 4h7v7H4V4zm9 0h7v4h-7V4zm0 7h7v9h-7v-9zM4 14h7v6H4v-6z" />,
  ajouter: <path d="M12 5v14M5 12h14" />,
  articles: <path d="M4 7h16M4 12h16M4 17h10" />,
  commandes: <path d="M3 7h18M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2M4 7l1 13a2 2 0 002 2h10a2 2 0 002-2l1-13" />,
  ventes: <path d="M3 17l5-5 4 4 7-7M14 9h5v5" />,
  locations: <path d="M3 4h18v13H3zM8 21h8M12 17v4" />,
  commentaires: <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />,
  boutique: <path d="M3 10l1.5-6h15L21 10M3 10v9a1 1 0 001 1h16a1 1 0 001-1v-9M3 10h18M9 14h6v6H9z" />,
  bell: <path d="M6 9a6 6 0 1 1 12 0v5l2 3H4l2-3V9zM10 20a2 2 0 0 0 4 0" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
};

export function NavIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
      {ICONS[id]}
    </svg>
  );
}

/**
 * Coquille commune à toutes les pages de l'espace vendeuse (sidebar +
 * topbar). `active` doit correspondre à l'id d'un NAV_ITEMS pour surligner
 * l'entrée courante. Le contenu de la page passe en children, déjà dans le
 * conteneur `<div className="p-8 space-y-8">`.
 */
export default function ShellVendeuse({ active, moi, titre, children }) {
  const navigate = useNavigate();
  const [nbEnAttente, setNbEnAttente] = useState(0);

  useEffect(() => {
    const charger = () => {
      apiFetch('/mes-commandes-vendeuse/')
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setNbEnAttente(data.length))
        .catch(() => {});
    };
    charger();
    // Un simple sondage périodique — pas de notification push en temps réel
    // pour l'instant, mais ça évite d'avoir à recharger la page pour voir
    // une nouvelle commande arriver.
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await apiFetch('/deconnexion/', { method: 'POST' }).catch(() => {});
    navigate('/connexion');
  };

  return (
    <div className="min-h-screen bg-white flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-line hidden md:flex flex-col">
        <div className="p-8">
          <Logo className="h-9 w-auto mb-2" />
          <p className="text-[10px] text-ink-soft/75 uppercase tracking-widest mt-1">Espace Vendeuse</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-btn text-sm font-semibold transition-all ${
                active === item.id
                  ? 'bg-teal/10 text-teal-dark'
                  : 'text-ink-soft/75 hover:bg-cream hover:text-ink'
              }`}
            >
              <NavIcon id={item.id} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'commandes' && nbEnAttente > 0 && (
                <span className="h-5 min-w-5 px-1 rounded-full bg-clay-dark text-white text-[10.5px] font-bold flex items-center justify-center">
                  {nbEnAttente}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-line">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-50 rounded-btn text-sm font-semibold transition-all"
          >
            <NavIcon id="logout" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">

        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-line flex items-center justify-between px-8">
          <div>
            <h2 className="text-xl font-impact font-extrabold text-ink">
              {titre || (
                <>Bonjour, <span className="text-orange-dark">{moi?.nom_boutique || moi?.username}</span></>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/vendeuse/commandes')}
              className="relative h-9 w-9 flex items-center justify-center bg-white border border-line rounded-full hover:border-teal transition-colors"
            >
              <NavIcon id="bell" />
              {nbEnAttente > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-clay-dark text-white text-[10px] font-bold flex items-center justify-center">
                  {nbEnAttente}
                </span>
              )}
            </button>
            <div className="h-10 w-10 bg-teal rounded-full border-2 border-white shadow-sm flex items-center justify-center text-cream font-serif font-bold">
              {(moi?.nom_boutique || moi?.username || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 flex-1 bg-white">
          {children}
        </div>
      </main>

    </div>
  );
}
