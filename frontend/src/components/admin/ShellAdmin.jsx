// frontend/src/components/admin/ShellAdmin.jsx
import { useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import { apiFetch } from '../../utils/api';
import { useCompteur } from '../../hooks/useFilMessages';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Actions prioritaires', path: '/admin' },
  { id: 'performance', label: 'Performance', path: '/admin/performance' },
  { id: 'utilisateurs', label: 'Utilisateurs', path: '/admin/utilisateurs' },
  { id: 'commandes', label: 'Commandes & Activités', path: '/admin/commandes' },
  { id: 'produits', label: 'Produits', path: '/admin/produits' },
  { id: 'categories', label: 'Catégories', path: '/admin/categories' },
  { id: 'plaintes', label: 'Plaintes', path: '/admin/plaintes' },
  { id: 'questions', label: 'Questions', path: '/admin/questions' },
  { id: 'ebook', label: 'E-book', path: '/admin/ebook' },
];

const ICONS = {
  dashboard: <path d="M13 2L3 14h7l-1 8 11-14h-8l1-6z" />,
  performance: <path d="M3 17l5-5 4 4 7-7M14 9h5v5" />,
  commandes: <path d="M3 7h18M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2M4 7l1 13a2 2 0 002 2h10a2 2 0 002-2l1-13" />,
  produits: <path d="M4 7h16M4 12h16M4 17h10" />,
  categories: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  questions: <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12zM9.5 9.5a2.5 2.5 0 114 2c-.9.5-1.5 1-1.5 2M12 16.5h.01" />,
  plaintes: <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />,
  ebook: <path d="M4 19.5V6a2 2 0 012-2h11a1 1 0 011 1v13M6 22h13M4 19.5A1.5 1.5 0 015.5 18H18" />,
  utilisateurs: <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  logout: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
};

export function AdminIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
      {ICONS[id]}
    </svg>
  );
}

export default function ShellAdmin({ active, moi, titre, children }) {
  const navigate = useNavigate();

  // Questions des utilisatrices en attente de réponse (badge du menu)
  const nbQuestions = useCompteur('/admin/support/en-attente/');

  const handleLogout = async () => {
    await apiFetch('/deconnexion/', { method: 'POST' }).catch(() => {});
    navigate('/connexion');
  };

  return (
    <div className="min-h-screen bg-white flex">

      <aside className="w-64 bg-white border-r border-line hidden md:flex flex-col">
        <div className="p-8">
          <Logo className="h-9 w-auto mb-2" />
          <p className="text-[10px] text-ink-soft/75 uppercase tracking-widest mt-1">Administration</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-btn text-sm font-semibold transition-all ${
                active === item.id ? 'bg-teal/10 text-teal-dark' : 'text-ink-soft/75 hover:bg-cream hover:text-ink'
              }`}
            >
              <AdminIcon id={item.id} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'questions' && nbQuestions > 0 && (
                <span className="h-5 min-w-5 px-1 rounded-full bg-clay-dark text-white text-[10.5px] font-bold flex items-center justify-center">
                  {nbQuestions}
                  <span className="sr-only"> question{nbQuestions > 1 ? 's' : ''} sans réponse</span>
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
            <AdminIcon id="logout" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-line flex items-center justify-between px-8">
          <h2 className="text-xl font-impact font-extrabold text-ink">
            {titre || (<>Bonjour, <span className="text-orange-dark">{moi?.username}</span></>)}
          </h2>
          <div className="h-10 w-10 bg-ink rounded-full border-2 border-white shadow-sm flex items-center justify-center text-cream font-serif font-bold">
            {(moi?.username || '?').charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="p-8 space-y-8 flex-1 bg-white">
          {children}
        </div>
      </main>

    </div>
  );
}
