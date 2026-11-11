// frontend/src/pages/vendeuse/DashboardVendeuse.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellVendeuse, { NavIcon } from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

// Périodes du graphique « Bilan des revenus »
const PERIODES = [
  { id: 'mois', label: 'Mensuel' },
  { id: 'trimestre', label: 'Trimestriel' },
  { id: 'semestre', label: 'Semestriel' },
  { id: 'annee', label: 'Annuel' },
];
const NB_MOIS = { trimestre: 3, semestre: 6, annee: 12 };

/**
 * Revenus nets (commandes payées) découpés en barres selon la période :
 * - mensuel : les 4 semaines du mois en cours (S1…S4, la 4e va jusqu'à la fin du mois) ;
 * - trimestriel / semestriel / annuel : les 3, 6 ou 12 derniers mois, mois en cours inclus.
 */
function bilanPeriode(commandes, periode) {
  const maintenant = new Date();
  const payees = commandes.filter((c) => c.statut_paiement === 'paye' && c.date_paiement);
  const montant = (c) => Number(c.montant_net_vendeuse || 0);

  if (periode === 'mois') {
    const barres = ['S1', 'S2', 'S3', 'S4'].map((label) => ({ label, valeur: 0 }));
    let nb = 0;
    payees.forEach((c) => {
      const d = new Date(c.date_paiement);
      if (d.getFullYear() !== maintenant.getFullYear() || d.getMonth() !== maintenant.getMonth()) return;
      barres[Math.min(3, Math.floor((d.getDate() - 1) / 7))].valeur += montant(c);
      nb += 1;
    });
    const libelle = maintenant.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return { barres, nb, libelle, total: barres.reduce((t, b) => t + b.valeur, 0) };
  }

  const nbMois = NB_MOIS[periode];
  const mois = Array.from({ length: nbMois }, (_, i) => new Date(maintenant.getFullYear(), maintenant.getMonth() - (nbMois - 1 - i), 1));
  const barres = mois.map((d) => ({
    label: d.toLocaleDateString('fr-FR', { month: nbMois === 12 ? 'narrow' : 'short' }).replace('.', ''),
    titre: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    valeur: 0,
  }));
  let nb = 0;
  payees.forEach((c) => {
    const d = new Date(c.date_paiement);
    const i = mois.findIndex((m) => m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth());
    if (i === -1) return;
    barres[i].valeur += montant(c);
    nb += 1;
  });
  const fmt = (d) => d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  return { barres, nb, libelle: `${fmt(mois[0])} – ${fmt(mois[nbMois - 1])}`, total: barres.reduce((t, b) => t + b.valeur, 0) };
}

const LIBELLE_TOTAL = {
  mois: 'Revenus du mois',
  trimestre: 'Revenus sur 3 mois',
  semestre: 'Revenus sur 6 mois',
  annee: 'Revenus sur 12 mois',
};
const LIBELLE_NB = { mois: 'ce mois-ci', trimestre: 'sur 3 mois', semestre: 'sur 6 mois', annee: 'sur 12 mois' };

export default function DashboardVendeuse() {
  const navigate = useNavigate();
  const { moi, chargementSession } = useVendeuseSession();

  const [produits, setProduits] = useState([]);
  const [ventesData, setVentesData] = useState({ commandes: [], stats: {} });
  const [chargementProduits, setChargementProduits] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (chargementSession) return;
    Promise.all([
      apiFetch('/mes-produits/').then((r) => (r.ok ? r.json() : [])),
      apiFetch('/mes-ventes/').then((r) => (r.ok ? r.json() : { commandes: [], stats: {} })),
    ])
      .then(([p, v]) => {
        setProduits(p);
        setVentesData(v);
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargementProduits(false));
  }, [chargementSession]);

  const stats = useMemo(() => {
    const enLigne = produits.filter((p) => p.disponible).length;
    const enLocation = produits.filter((p) => p.disponible && p.type_offre === 'location').length;
    const valeurCatalogue = produits
      .filter((p) => p.disponible)
      .reduce((sum, p) => sum + Number(p.prix_final_public || 0), 0);
    return { enLigne, enLocation, valeurCatalogue };
  }, [produits]);

  const [periode, setPeriode] = useState('mois');
  const bilan = useMemo(() => bilanPeriode(ventesData.commandes || [], periode), [ventesData, periode]);
  const maxBarre = Math.max(1, ...bilan.barres.map((b) => b.valeur));

  const enLigneAnim = useCountUp(stats.enLigne);
  const enLocationAnim = useCountUp(stats.enLocation);
  const valeurAnim = useCountUp(stats.valeurCatalogue);
  const bilanNetAnim = useCountUp(ventesData.stats?.revenu_net_total || 0);

  const toggleLocationStatus = async (produit) => {
    const res = await apiFetch(`/mes-produits/${produit.id}/disponibilite/`, {
      method: 'PATCH',
      body: { disponible: !produit.disponible },
    });
    if (res.ok) {
      const updated = await res.json();
      setProduits((prev) => prev.map((p) => (p.id === produit.id ? updated : p)));
    }
  };

  if (chargementSession || chargementProduits) {
    return (
      <SqueletteTableau />
    );
  }

  const STAT_CARDS = [
    { label: 'Articles en ligne', valeur: enLigneAnim, sousTexte: stats.enLigne === 0 ? 'Aucun article publié' : `${stats.enLigne} en ligne`, icone: 'articles', couleur: 'teal' },
    { label: 'Articles en location', valeur: enLocationAnim, sousTexte: stats.enLocation === 0 ? 'Aucune location active' : `${stats.enLocation} en location`, icone: 'ventes', couleur: 'orange' },
    { label: 'Valeur du catalogue', valeur: formatFCFA(valeurAnim), sousTexte: 'Valeur totale estimée', icone: 'dashboard', couleur: 'teal' },
    { label: 'Bilan net', valeur: formatFCFA(bilanNetAnim), sousTexte: 'Ventes + locations terminées', couleurLettre: 'F', couleur: 'orange' },
  ];

  return (
    <ShellVendeuse active="dashboard" moi={moi}>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <div className={`relative overflow-hidden rounded-m p-6 sm:p-8 text-cream ${SHADOW_CARD} ${GRADIENT_CARDS[0].bg}`}>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-serif font-bold">Prête à faire vivre une seconde histoire à vos articles ?</h3>
            <p className="text-sm text-cream/60 mt-1.5">Publiez une annonce et développez vos ventes ou locations.</p>
          </div>
          <button
            onClick={() => navigate('/vendeuse/ajouter-produit')}
            className="bg-clay-dark hover:bg-ink text-white px-6 py-3 rounded-btn font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter un article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAT_CARDS.map((s, i) => {
          const g = GRADIENT_CARDS[i % GRADIENT_CARDS.length];
          return (
          <div
            key={s.label}
            className={`${g.bg} p-5 rounded-m ${SHADOW_CARD} hover:-translate-y-0.5 transition-transform`}
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${g.label}`}>{s.label}</span>
              <div className={`h-7 w-7 rounded-btn flex items-center justify-center shrink-0 ${g.iconBg} ${g.iconColor}`}>
                {s.couleurLettre ? (
                  <span className="text-[11px] font-bold">{s.couleurLettre}</span>
                ) : (
                  <NavIcon id={s.icone} />
                )}
              </div>
            </div>
            <div className={`text-2xl font-serif font-bold ${g.text}`}>{s.valeur}</div>
            <p className={`text-[11.5px] mt-1 ${g.label}`}>{s.sousTexte}</p>
          </div>
          );
        })}
      </div>

      <div className={`bg-white rounded-m ${SHADOW_CARD} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="font-impact font-extrabold text-lg text-ink">Bilan des revenus</h3>
            <p className="text-[12.5px] text-ink-soft/75 mt-0.5">Vue consolidée de vos ventes et locations.</p>
          </div>
          {/* Choix de la période : le graphique et le total suivent */}
          <div className="flex flex-wrap gap-1 rounded-full bg-sable border border-line p-1" role="tablist" aria-label="Période du bilan">
            {PERIODES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={periode === p.id}
                onClick={() => setPeriode(p.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                  periode === p.id ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11.5px] font-semibold text-ink-soft/75 capitalize mb-5">{bilan.libelle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 sm:gap-6 items-end">
          <div>
            <p className="text-[11px] font-bold text-ink-soft/75 uppercase tracking-wider">{LIBELLE_TOTAL[periode]}</p>
            <p className="text-2xl font-impact font-extrabold text-ink mt-1 whitespace-nowrap">{formatFCFA(bilan.total)}</p>
            <p className="text-[11px] text-ink-soft/75 mt-0.5">
              {bilan.nb} vente{bilan.nb > 1 ? 's' : ''} {LIBELLE_NB[periode]}
            </p>
          </div>
          <div className="flex items-end gap-1.5 sm:gap-2.5 h-28" role="img" aria-label={`Revenus ${LIBELLE_NB[periode]} : ${bilan.barres.map((b) => `${b.titre || b.label} ${formatFCFA(b.valeur)}`).join(', ')}`}>
            {bilan.barres.map((b, i) => (
              <div key={`${periode}-${i}`} className="flex-1 min-w-0 flex flex-col items-center gap-1.5" title={`${b.titre || b.label} : ${formatFCFA(b.valeur)}`}>
                <div
                  className={`w-full rounded-t-[4px] transition-all duration-700 ${b.valeur > 0 ? 'bg-orange' : 'bg-line'}`}
                  style={{ height: `${Math.max(6, (b.valeur / maxBarre) * 88)}px` }}
                />
                <span className="text-[10px] text-ink-soft/75 font-semibold capitalize truncate max-w-full">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.enLocation > 0 || produits.some((p) => p.type_offre === 'location') ? (
        <div className={`bg-white rounded-m ${SHADOW_CARD} p-6`}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif text-lg text-ink flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-teal/10 text-teal-dark flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M3 4h18v13H3zM8 21h8M12 17v4" /></svg>
              </span>
              Module location
            </h3>
            <span className="text-[11px] font-bold text-teal-dark bg-teal/10 px-3 py-1.5 rounded-full">
              {stats.enLocation} disponible{stats.enLocation > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[12.5px] text-ink-soft/75 mb-5">Suivez la disponibilité de vos articles en location en un coup d'œil.</p>

          {produits.filter((p) => p.type_offre === 'location').length === 0 ? (
            <div className="bg-sable rounded-btn border border-dashed border-line p-8 text-center">
              <EtatVide compact bordure={false} icone="boite" texte="Aucun article en location pour le moment." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {produits.filter((p) => p.type_offre === 'location').slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-sable rounded-btn border border-line p-3.5">
                  <div className="h-11 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                    {p.image_principale && <img loading="lazy" decoding="async" src={p.image_principale} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{p.titre}</p>
                    <p className="text-[11px] text-ink-soft/75">{formatFCFA(p.prix_final_public)} /jour</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleLocationStatus(p)}
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full whitespace-nowrap ${
                      p.disponible ? 'bg-teal/10 text-teal-dark' : 'bg-orange/10 text-orange'
                    }`}
                  >
                    {p.disponible ? 'Disponible' : 'Loué'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-widest">Derniers articles ajoutés</h3>
          {produits.length > 0 && (
            <button
              onClick={() => navigate('/vendeuse/mes-articles')}
              className="text-[12px] font-semibold text-teal-dark hover:text-ink transition-colors"
            >
              Voir tous mes articles →
            </button>
          )}
        </div>

        {produits.length === 0 ? (
          <div className={`bg-white rounded-m ${SHADOW_CARD} p-12 text-center`}>
            <p className="text-ink-soft/75 text-sm">
              Aucun article pour le moment. Commencez par en ajouter un !
            </p>
          </div>
        ) : (
          <div className={`bg-white rounded-m ${SHADOW_CARD} divide-y divide-line overflow-hidden`}>
            {produits.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-btn bg-line/40 overflow-hidden shrink-0">
                  {p.image_principale && (
                    <img loading="lazy" decoding="async" src={p.image_principale} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{p.titre}</p>
                  <p className="text-[12px] text-ink-soft/75">{p.categorie_nom || 'Sans catégorie'}</p>
                </div>
                <p className="text-sm font-bold text-ink whitespace-nowrap">
                  {formatFCFA(p.prix_final_public)}{p.type_offre === 'location' && <span className="text-ink-soft/75 font-normal"> /jour</span>}
                </p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    p.disponible ? 'bg-teal/10 text-teal-dark' : 'bg-line text-ink-soft/75'
                  }`}
                >
                  {p.disponible ? 'En ligne' : 'Masqué'}
                </span>
                {p.type_offre === 'location' && (
                  <button
                    type="button"
                    onClick={() => toggleLocationStatus(p)}
                    className={`text-[10.5px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-btn border transition-colors whitespace-nowrap ${
                      p.disponible
                        ? 'border-orange text-clay-dark hover:bg-clay-dark hover:text-white'
                        : 'border-teal text-teal-dark hover:bg-teal hover:text-white'
                    }`}
                  >
                    {p.disponible ? 'Marquer loué' : 'Marquer disponible'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </ShellVendeuse>
  );
}
