// frontend/src/pages/vendeuse/Ventes.jsx
import { useEffect, useMemo, useState } from 'react';
import ShellVendeuse from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDateHeure(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}\n${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

const STATUT_STYLE = {
  en_attente_confirmation: 'bg-orange/10 text-orange',
  confirme: 'bg-teal/10 text-teal-dark',
  en_cours_livraison: 'bg-teal/10 text-teal-dark',
  livre: 'bg-teal/15 text-teal-dark',
  terminee: 'bg-teal/15 text-teal-dark',
  indisponible: 'bg-red-50 text-red-500',
  annule: 'bg-red-50 text-red-500',
};

const STATUT_LABEL = {
  en_attente_confirmation: 'Paiement en attente',
  confirme: 'En préparation',
  en_cours_livraison: 'En livraison',
  livre: 'Livré',
  terminee: 'Terminée',
  indisponible: 'Annulée',
  annule: 'Annulée',
};

const ONGLETS = [
  { id: 'toutes', label: 'Toutes', test: () => true },
  { id: 'en_attente', label: 'En attente', test: (c) => c.statut === 'en_attente_confirmation' },
  { id: 'en_preparation', label: 'En préparation', test: (c) => c.statut === 'confirme' },
  { id: 'livrees', label: 'Livrées', test: (c) => c.statut === 'livre' },
  { id: 'payees', label: 'Payées', test: (c) => c.statut_paiement === 'paye' },
  { id: 'annulees', label: 'Annulées', test: (c) => ['indisponible', 'annule'].includes(c.statut) },
];

export default function Ventes() {
  const { moi, chargementSession } = useVendeuseSession();

  const [commandes, setCommandes] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [onglet, setOnglet] = useState('toutes');

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/mes-ventes/')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCommandes(data.commandes || []);
        setStats(data.stats || null);
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  }, [chargementSession]);

  const compteurs = useMemo(() => {
    const c = {};
    ONGLETS.forEach((o) => { c[o.id] = commandes.filter(o.test).length; });
    return c;
  }, [commandes]);

  const commandesFiltrees = useMemo(
    () => commandes.filter(ONGLETS.find((o) => o.id === onglet)?.test || (() => true)),
    [commandes, onglet],
  );

  const exporterCSV = () => {
    const lignes = [
      ['Article', 'Date', 'Montant', 'Statut'],
      ...commandes.map((c) => [c.produit_titre, formatDateHeure(c.date_commande).replace('\n', ' '), c.montant_net_vendeuse || c.prix_total_paye, STATUT_LABEL[c.statut] || c.statut]),
    ];
    const csv = lignes.map((l) => l.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-ventes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (chargementSession || chargement) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellVendeuse active="ventes" moi={moi} titre="Ventes">

      <div className="flex items-start justify-between gap-4 flex-wrap -mt-2">
        <p className="text-[13px] text-ink-soft/75">Suivez vos ventes, revenus et paiements en toute simplicité.</p>
        <button
          type="button"
          onClick={exporterCSV}
          className="flex items-center gap-2 text-[13px] font-bold text-ink border border-line px-4 py-2 rounded-btn hover:border-teal hover:text-teal-dark transition-colors shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
          Exporter mes ventes
        </button>
      </div>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Revenus totaux', valeur: formatFCFA(stats?.revenu_net_total), icone: 'wallet' },
          { label: 'Revenus du mois', valeur: formatFCFA(stats?.revenu_net_mois), icone: 'bars' },
          { label: 'Articles vendus ce mois', valeur: stats?.nb_ventes_mois ?? 0, icone: 'bag' },
          { label: 'Paiements en attente', valeur: stats?.nb_commandes_en_attente ?? 0, icone: 'clock' },
        ].map((s, i) => {
          const g = GRADIENT_CARDS[i % GRADIENT_CARDS.length];
          return (
          <div key={s.label} className={`${g.bg} p-5 rounded-m ${SHADOW_CARD} flex items-start gap-3.5`}>
            <span className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${g.iconBg} ${g.iconColor}`}>
              {s.icone === 'wallet' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M3 7a2 2 0 012-2h13a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path d="M17 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>}
              {s.icone === 'bars' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M6 20V10M12 20V4M18 20v-7" /></svg>}
              {s.icone === 'bag' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>}
              {s.icone === 'clock' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>}
            </span>
            <div className="min-w-0">
              <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 leading-tight ${g.label}`}>{s.label}</p>
              <p className={`text-xl font-serif font-bold truncate ${g.text}`}>{s.valeur}</p>
            </div>
          </div>
          );
        })}
      </div>

      {/* ONGLETS + PERIODE */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-cream rounded-btn p-1 flex-wrap">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all whitespace-nowrap ${
                onglet === o.id ? 'bg-teal text-white' : 'text-ink-soft/75 hover:text-ink'
              }`}
            >
              {o.label} <span className="opacity-70">({compteurs[o.id]})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft/75 border border-line rounded-btn px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
          Ce mois
        </div>
      </div>

      {/* TABLE */}
      {commandesFiltrees.length === 0 ? (
        <div className={`bg-white rounded-m ${SHADOW_CARD} p-16 text-center`}>
          <EtatVide compact bordure={false} icone="boite" texte="Aucune vente dans cette catégorie pour le moment." />
        </div>
      ) : (
        <div className={`bg-white rounded-m ${SHADOW_CARD} overflow-hidden`}>
          <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1.2fr_1fr] gap-4 px-5 py-3 border-b border-line text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wider">
            <span>Article</span><span>Date</span><span>Montant</span><span>Statut</span><span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-line">
            {commandesFiltrees.map((c) => (
              <div key={c.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_1.2fr_1fr] gap-3 md:gap-4 items-center px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                    {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <p className="text-sm font-bold text-ink truncate">{c.produit_titre}</p>
                </div>
                <p className="text-[12.5px] text-ink-soft/75 whitespace-pre-line">{formatDateHeure(c.date_commande)}</p>
                <p className="text-sm font-bold text-ink">{formatFCFA(c.montant_net_vendeuse || c.prix_total_paye)}</p>
                <span className={`inline-flex w-fit text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUT_STYLE[c.statut] || 'bg-line text-ink-soft/75'}`}>
                  {STATUT_LABEL[c.statut] || c.statut}
                </span>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Commande ${c.produit_titre}`)}`} className="text-teal-dark font-semibold text-[13px] flex items-center gap-1 md:justify-end hover:underline">
                  Voir les détails
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {commandes.length === 0 && (
        <div className={`bg-white rounded-m ${SHADOW_CARD} p-6 flex items-center gap-5 flex-wrap`}>
          <span className="h-14 w-14 rounded-full bg-orange/10 text-orange flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6"><path d="M3 9l9-6 9 6M4 10v10h16V10" /><path d="M9 20v-6h6v6" /></svg>
          </span>
          <div className="flex-1 min-w-[220px]">
            <p className="font-bold text-ink">Vous n'avez pas encore de ventes ?</p>
            <p className="text-[13px] text-ink-soft/75 mt-0.5">Publiez davantage d'articles pour augmenter vos chances d'être visible auprès des mamans.</p>
          </div>
          <a
            href="/vendeuse/ajouter-produit"
            className="bg-clay-dark hover:bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-btn transition-colors whitespace-nowrap"
          >
            + Ajouter un article
          </a>
        </div>
      )}

    </ShellVendeuse>
  );
}
