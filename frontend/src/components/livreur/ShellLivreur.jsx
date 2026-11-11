// frontend/src/components/livreur/ShellLivreur.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import { apiFetch } from '../../utils/api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', path: '/livreur' },
  { id: 'livraisons', label: 'Mes livraisons', path: '/livreur/mes-livraisons' },
  { id: 'historique', label: 'Historique', path: '/livreur/historique' },
  { id: 'revenus', label: 'Mes revenus', path: '/livreur/revenus' },
  { id: 'notifications', label: 'Notifications', path: '/livreur/notifications' },
  { id: 'profil', label: 'Mon profil', path: '/livreur/profil' },
];

const ICONS = {
  dashboard: <path d="M4 4h7v7H4V4zm9 0h7v4h-7V4zm0 7h7v9h-7v-9zM4 14h7v6H4v-6z" />,
  livraisons: <path d="M3 7h13v9H3zM16 10h3l2 3v3h-5zM6 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z" />,
  historique: <path d="M3 3v5h5M3.05 13a9 9 0 106.3-8.6M12 7v5l3 3" />,
  revenus: <path d="M3 17l5-5 4 4 7-7M14 9h5v5" />,
  notifications: <path d="M6 9a6 6 0 1 1 12 0v5l2 3H4l2-3V9zM10 20a2 2 0 0 0 4 0" />,
  profil: <path d="M4 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />,
  logout: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
};

export function LivreurIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
      {ICONS[id]}
    </svg>
  );
}

export default function ShellLivreur({ active, moi, titre, children }) {
  const navigate = useNavigate();
  const [nbNotifs, setNbNotifs] = useState(0);

  useEffect(() => {
    apiFetch('/livreur/mes-livraisons/')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNbNotifs(data.length))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await apiFetch('/deconnexion/', { method: 'POST' }).catch(() => {});
    navigate('/connexion');
  };

  return (
    <div className="min-h-screen bg-white flex">

      <aside className="w-64 bg-white border-r border-line hidden md:flex flex-col">
        <div className="p-8">
          <Logo className="h-9 w-auto mb-2" />
          <p className="text-[10px] text-ink-soft/75 uppercase tracking-widest mt-1">Espace Livreur</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-btn text-sm font-semibold transition-all ${
                active === item.id ? 'bg-teal/10 text-teal-dark' : 'text-ink-soft/75 hover:bg-sable hover:text-ink'
              }`}
            >
              <LivreurIcon id={item.id} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'livraisons' && nbNotifs > 0 && (
                <span className="h-5 min-w-5 px-1 rounded-full bg-orange text-white text-[10.5px] font-bold flex items-center justify-center">
                  {nbNotifs}
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
            <LivreurIcon id="logout" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-line flex items-center justify-between px-8">
          <h2 className="text-lg font-serif font-bold text-ink">
            {titre || (<>Bonjour, <span className="text-orange">{moi?.username}</span></>)}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/livreur/notifications')}
              className="relative h-9 w-9 flex items-center justify-center bg-white border border-line rounded-full hover:border-teal transition-colors"
            >
              <LivreurIcon id="notifications" />
              {nbNotifs > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center">
                  {nbNotifs}
                </span>
              )}
            </button>
            <div className="h-10 w-10 bg-teal rounded-full border-2 border-white shadow-sm flex items-center justify-center text-cream font-serif font-bold">
              {(moi?.username || '?').charAt(0).toUpperCase()}
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
