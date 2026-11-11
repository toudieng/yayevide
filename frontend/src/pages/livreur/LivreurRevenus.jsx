// frontend/src/pages/livreur/LivreurRevenus.jsx
import { useEffect, useState } from 'react';
import ShellLivreur from '../../components/livreur/ShellLivreur';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD as SHADOW } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LivreurRevenus() {
  const { moi, chargementSession } = useSession('livreur');

  const [stats, setStats] = useState(null);
  const [livraisons, setLivraisons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [periode, setPeriode] = useState('mois');

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/livreur/mes-revenus/')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setStats(data.stats);
        setLivraisons(data.livraisons || []);
      })
      .finally(() => setChargement(false));
  }, [chargementSession]);

  if (chargementSession || chargement || !stats) {
    return (
      <SqueletteTableau />
    );
  }

  const PERIODES = [
    { id: 'jour', label: "Aujourd'hui", valeur: stats.revenu_jour },
    { id: 'mois', label: 'Ce mois-ci', valeur: stats.revenu_mois },
    { id: 'total', label: 'Depuis le début', valeur: stats.revenu_total },
  ];
  const active = PERIODES.find((p) => p.id === periode);

  const prochainVersement = (() => {
    const d = new Date();
    const jours = (8 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + jours);
    return d.toISOString();
  })();

  return (
    <ShellLivreur active="revenus" moi={moi} titre="Mes revenus">

      <p className="text-[13px] text-ink-soft/75 -mt-2">Consultez vos frais de livraison et l'historique de vos revenus.</p>

      <div className={`bg-white rounded-m ${SHADOW} p-1.5 flex items-center gap-1 w-fit`}>
        {PERIODES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriode(p.id)}
            className={`px-4 py-2 rounded-btn text-[12.5px] font-bold transition-all ${
              periode === p.id ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Aperçu des revenus</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className={`${GRADIENT_CARDS[0].bg} rounded-m ${SHADOW} p-6`}>
            <span className={`h-9 w-9 rounded-full flex items-center justify-center mb-4 ${GRADIENT_CARDS[0].iconBg} ${GRADIENT_CARDS[0].iconColor}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><circle cx="12" cy="12" r="9" /><path d="M9 9h4a2 2 0 010 4H9m0-4v8m0-4h5" /></svg>
            </span>
            <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-1.5 ${GRADIENT_CARDS[0].label}`}>{active.label}</p>
            <p className={`text-2xl font-serif font-bold ${GRADIENT_CARDS[0].text}`}>{formatFCFA(active.valeur)}</p>
          </div>
          <div className={`${GRADIENT_CARDS[1].bg} rounded-m ${SHADOW} p-6`}>
            <span className={`h-9 w-9 rounded-full flex items-center justify-center mb-4 ${GRADIENT_CARDS[1].iconBg} ${GRADIENT_CARDS[1].iconColor}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5"><path d="M5 12l4.5 4.5L19 7" /></svg>
            </span>
            <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-1.5 ${GRADIENT_CARDS[1].label}`}>Total livraisons effectuées</p>
            <p className={`text-2xl font-serif font-bold ${GRADIENT_CARDS[1].text}`}>{stats.nb_livraisons_total}</p>
          </div>
          <div className={`${GRADIENT_CARDS[2].bg} rounded-m ${SHADOW} p-6`}>
            <span className={`h-9 w-9 rounded-full flex items-center justify-center mb-4 ${GRADIENT_CARDS[2].iconBg} ${GRADIENT_CARDS[2].iconColor}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M2 8h11v8H2zM13 11h4l3 3v2h-7z" /><circle cx="6.5" cy="18.5" r="1.6" /><circle cx="17.5" cy="18.5" r="1.6" /></svg>
            </span>
            <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-1.5 ${GRADIENT_CARDS[2].label}`}>Livraisons ce mois-ci</p>
            <p className={`text-2xl font-serif font-bold ${GRADIENT_CARDS[2].text}`}>{stats.nb_livraisons_mois}</p>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-m ${SHADOW} p-5 flex items-center gap-4 flex-wrap`}>
        <span className="h-11 w-11 rounded-full bg-clay/15 text-clay flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
        </span>
        <div className="flex-1 min-w-[220px]">
          <p className="text-sm font-bold text-ink">Prochain versement indicatif</p>
          <p className="text-[12.5px] text-ink-soft/75 mt-0.5">
            Les frais de livraison validés avant la clôture sont regroupés pour le prochain cycle — {formatDate(prochainVersement)} (estimation).
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide">Montant en attente</p>
          <p className="text-lg font-serif font-bold text-ink">{formatFCFA(stats.revenu_mois)}</p>
        </div>
      </div>

      <div className="bg-teal/5 border border-teal/15 rounded-btn p-4">
        <p className="text-[12.5px] text-ink-soft leading-relaxed">
          Vous touchez <span className="font-bold">75% des frais de livraison</span> de chaque commande que vous livrez — les 25% restants couvrent la logistique et l'assurance des litiges Yaay Vidé.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Historique des revenus</h3>
        {livraisons.length === 0 ? (
          <div className={`bg-white rounded-m ${SHADOW} p-16 text-center`}>
            <EtatVide compact bordure={false} icone="camion" texte="Aucune livraison effectuée pour le moment." />
          </div>
        ) : (
          <div className={`bg-white rounded-m ${SHADOW} overflow-hidden`}>
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-line text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wider">
              <span>Livraison</span><span>Montant</span><span>Date</span><span>Statut</span>
            </div>
            <div className="divide-y divide-line">
              {livraisons.map((c) => (
                <div key={c.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 md:gap-4 items-center px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-btn bg-line/40 overflow-hidden shrink-0">
                      {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <p className="text-sm font-semibold text-ink truncate">{c.produit_titre}</p>
                  </div>
                  <p className="text-sm font-bold text-teal-dark">+{formatFCFA(c.part_livreur)}</p>
                  <p className="text-[12.5px] text-ink-soft/75">{formatDate(c.date_paiement)}</p>
                  <span className="inline-flex w-fit text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal/10 text-teal-dark">Livrée</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </ShellLivreur>
  );
}
