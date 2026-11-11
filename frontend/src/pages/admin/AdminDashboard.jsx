// frontend/src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellAdmin, { AdminIcon } from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { moi, chargementSession } = useSession('admin');

  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/admin/stats/')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setStats(await res.json());
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  }, [chargementSession]);

  if (chargementSession || chargement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  const ACTIONS = [
    {
      condition: stats?.nb_boutiques_a_valider > 0,
      icone: 'vendeuses', couleur: 'orange',
      texte: `${stats?.nb_boutiques_a_valider} boutique${stats?.nb_boutiques_a_valider > 1 ? 's' : ''} en attente de validation`,
      to: '/admin/utilisateurs?role=vendeur&statut=a_valider',
    },
    {
      condition: stats?.nb_plaintes_nouvelles > 0,
      icone: 'plaintes', couleur: 'red',
      texte: `${stats?.nb_plaintes_nouvelles} nouvelle${stats?.nb_plaintes_nouvelles > 1 ? 's' : ''} plainte${stats?.nb_plaintes_nouvelles > 1 ? 's' : ''} à traiter`,
      to: '/admin/plaintes',
    },
    {
      condition: stats?.nb_commandes_expirant_bientot > 0,
      icone: 'commandes', couleur: 'orange',
      texte: `${stats?.nb_commandes_expirant_bientot} commande${stats?.nb_commandes_expirant_bientot > 1 ? 's' : ''} expire${stats?.nb_commandes_expirant_bientot > 1 ? 'nt' : ''} dans moins de 2h (vendeuse sans réponse)`,
      to: '/admin/commandes?statut=en_attente_confirmation',
    },
    {
      condition: stats?.nb_commandes_expirees > 0,
      icone: 'commandes', couleur: 'red',
      texte: `${stats?.nb_commandes_expirees} commande${stats?.nb_commandes_expirees > 1 ? 's' : ''} en attente depuis plus de 24h`,
      to: '/admin/commandes?statut=en_attente_confirmation',
    },
    {
      condition: stats?.nb_livraisons_non_assignees > 0,
      icone: 'commandes', couleur: 'teal',
      texte: `${stats?.nb_livraisons_non_assignees} commande${stats?.nb_livraisons_non_assignees > 1 ? 's' : ''} confirmée${stats?.nb_livraisons_non_assignees > 1 ? 's' : ''} sans livreur assigné`,
      to: '/admin/commandes',
    },
  ].filter((a) => a.condition);

  const COULEURS = {
    orange: { bg: 'bg-orange/10', border: 'border-orange/30', hover: 'hover:bg-orange/15', icon: 'bg-orange', text: 'text-orange' },
    red: { bg: 'bg-red-50', border: 'border-red-200', hover: 'hover:bg-red-100/70', icon: 'bg-red-500', text: 'text-red-500' },
    teal: { bg: 'bg-teal/10', border: 'border-teal/30', hover: 'hover:bg-teal/15', icon: 'bg-teal', text: 'text-teal-dark' },
  };

  return (
    <ShellAdmin active="dashboard" moi={moi}>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">
          Actions prioritaires {ACTIONS.length > 0 && `(${ACTIONS.length})`}
        </h3>

        {ACTIONS.length === 0 ? (
          <div className="bg-teal/5 border border-teal/20 rounded-m p-6 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-teal text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 12l4.5 4.5L19 7" /></svg>
            </div>
            <p className="text-sm font-semibold text-ink">Tout est à jour — aucune action urgente pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ACTIONS.map((a, i) => {
              const c = COULEURS[a.couleur];
              return (
                <button
                  key={i}
                  onClick={() => navigate(a.to)}
                  className={`w-full text-left ${c.bg} border ${c.border} rounded-m p-5 flex items-center justify-between gap-4 ${c.hover} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${c.icon} text-white flex items-center justify-center shrink-0`}>
                      <AdminIcon id={a.icone} />
                    </div>
                    <p className="text-sm font-semibold text-ink">{a.texte}</p>
                  </div>
                  <span className={`text-xs font-bold ${c.text} uppercase tracking-wide whitespace-nowrap`}>Voir →</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Vue d'ensemble</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]">
            <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">GMV total</div>
            <div className="text-2xl font-serif font-bold mt-1 text-ink">{formatFCFA(stats?.gmv_total)}</div>
          </div>
          <div className="bg-white p-6 rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]">
            <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">Commission totale</div>
            <div className="text-2xl font-serif font-bold mt-1 text-teal-dark">{formatFCFA(stats?.commission_totale)}</div>
          </div>
          <div className="bg-white p-6 rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]">
            <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">GMV (ce mois)</div>
            <div className="text-2xl font-serif font-bold mt-1 text-ink">{formatFCFA(stats?.gmv_mois)}</div>
          </div>
          <div className="bg-white p-6 rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]">
            <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">Commission (ce mois)</div>
            <div className="text-2xl font-serif font-bold mt-1 text-teal-dark">{formatFCFA(stats?.commission_mois)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]">
          <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">Commandes (ce mois)</div>
          <div className="text-2xl font-serif font-bold mt-1 text-ink">{stats?.nb_commandes_mois ?? 0}</div>
        </div>
        <div className="bg-white p-6 rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]">
          <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">Commandes en attente</div>
          <div className="text-2xl font-serif font-bold mt-1 text-orange">{stats?.nb_commandes_en_attente ?? 0}</div>
        </div>
        <div className="bg-white p-6 rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]">
          <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">Boutiques actives</div>
          <div className="text-2xl font-serif font-bold mt-1 text-ink">{stats?.nb_boutiques ?? 0}</div>
        </div>
        <div className="bg-white p-6 rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]">
          <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">Articles en ligne</div>
          <div className="text-2xl font-serif font-bold mt-1 text-ink">{stats?.nb_produits_en_ligne ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-ink text-cream p-6 rounded-m flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-cream/60">Acheteuses</div>
            <div className="text-2xl font-serif font-bold mt-1">{stats?.nb_acheteurs ?? 0}</div>
          </div>
          <AdminIcon id="utilisateurs" />
        </div>
        <div className="bg-ink text-cream p-6 rounded-m flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-cream/60">Livreurs actifs</div>
            <div className="text-2xl font-serif font-bold mt-1">{stats?.nb_livreurs ?? 0}</div>
          </div>
          <AdminIcon id="commandes" />
        </div>
      </div>

    </ShellAdmin>
  );
}
