// frontend/src/pages/livreur/LivreurHistorique.jsx
import { useEffect, useState } from 'react';
import ShellLivreur from '../../components/livreur/ShellLivreur';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LivreurHistorique() {
  const { moi, chargementSession } = useSession('livreur');

  const [commandes, setCommandes] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/livreur/historique/')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCommandes(data.commandes || []);
        setStats(data.stats || null);
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  }, [chargementSession]);

  if (chargementSession || chargement) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellLivreur active="historique" moi={moi} titre="Historique">

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className={`bg-white p-6 rounded-m ${SHADOW_CARD}`}>
          <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">Livraisons (ce mois)</div>
          <div className="text-2xl font-serif font-bold mt-1 text-ink">{stats?.nb_livraisons_mois ?? 0}</div>
        </div>
        <div className={`bg-white p-6 rounded-m ${SHADOW_CARD}`}>
          <div className="text-xs text-ink-soft/75 uppercase font-bold tracking-wider">Livraisons au total</div>
          <div className="text-2xl font-serif font-bold mt-1 text-ink">{stats?.nb_livraisons_total ?? 0}</div>
        </div>
      </div>

      {commandes.length === 0 ? (
        <div className={`bg-white rounded-m ${SHADOW_CARD} p-16 text-center`}>
          <EtatVide compact bordure={false} icone="camion" texte="Aucune livraison effectuée pour le moment." />
        </div>
      ) : (
        <div className={`bg-white rounded-m ${SHADOW_CARD} divide-y divide-line overflow-hidden`}>
          {commandes.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4 flex-wrap md:flex-nowrap">
              <div className="h-11 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-ink truncate">{c.produit_titre}</p>
                <p className="text-[12px] text-ink-soft/75">{c.acheteur_username} · {formatDate(c.date_commande)}</p>
              </div>
              <p className="text-sm font-bold text-ink whitespace-nowrap">{formatFCFA(c.prix_total_paye)}</p>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-teal text-white whitespace-nowrap">
                Livrée
              </span>
            </div>
          ))}
        </div>
      )}

    </ShellLivreur>
  );
}
