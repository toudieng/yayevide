// frontend/src/pages/vendeuse/DashboardVendeuse.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellVendeuse, { NavIcon } from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD } from '../../utils/gradientCards';

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

function calculerRevenuParSemaine(commandes) {
  const maintenant = new Date();
  const semaines = [0, 0, 0, 0];
  commandes
    .filter((c) => c.statut_paiement === 'paye' && c.date_paiement)
    .forEach((c) => {
      const d = new Date(c.date_paiement);
      if (d.getFullYear() !== maintenant.getFullYear() || d.getMonth() !== maintenant.getMonth()) return;
      const semaine = Math.min(3, Math.floor((d.getDate() - 1) / 7));
      semaines[semaine] += Number(c.montant_net_vendeuse || 0);
    });
  return semaines;
}

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

  const revenuSemaines = useMemo(() => calculerRevenuParSemaine(ventesData.commandes || []), [ventesData]);
  const maxSemaine = Math.max(1, ...revenuSemaines);

  const enLigneAnim = useCountUp(stats.enLigne);
  const enLocationAnim = useCountUp(stats.enLocation);
  const valeurAnim = useCountUp(stats.valeurCatalogue);
  const bilanNetAnim = useCountUp(ventesData.stats?.revenu_net_total || 0);

  const nomMoisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
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

      <div className="relative overflow-hidden rounded-m p-8 text-cream shadow-xl bg-gradient-to-br from-ink to-[#2a1f1a]">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-serif font-bold">Prête à faire vivre une seconde histoire à vos articles ?</h3>
            <p className="text-sm text-cream/60 mt-1.5">Publiez une annonce et développez vos ventes ou locations.</p>
          </div>
          <button
            onClick={() => navigate('/vendeuse/ajouter-produit')}
            className="bg-orange hover:bg-orange-dark text-white px-6 py-3 rounded-btn font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2"
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

      <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-lg text-ink">Bilan des revenus du mois</h3>
          <span className="text-[11px] font-bold text-ink-soft/60 bg-sable px-3 py-1.5 rounded-full capitalize">{nomMoisActuel}</span>
        </div>
        <p className="text-[12.5px] text-ink-soft/50 mb-5">Vue consolidée de vos ventes et locations.</p>

        <div className="grid grid-cols-[auto_1fr] gap-6 items-end">
          <div>
            <p className="text-[11px] font-bold text-ink-soft/50 uppercase tracking-wider">Revenus du mois</p>
            <p className="text-2xl font-serif font-bold text-ink mt-1">{formatFCFA(ventesData.stats?.revenu_net_mois)}</p>
            <p className="text-[11px] text-ink-soft/50 mt-0.5">{ventesData.stats?.nb_ventes_mois || 0} vente{(ventesData.stats?.nb_ventes_mois || 0) > 1 ? 's' : ''} ce mois-ci</p>
          </div>
          <div className="flex items-end gap-2.5 h-24">
            {revenuSemaines.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-t-s transition-all duration-700 ${v > 0 ? 'bg-orange' : 'bg-line'}`}
                  style={{ height: `${Math.max(6, (v / maxSemaine) * 80)}px` }}
                />
                <span className="text-[10px] text-ink-soft/40 font-semibold">S{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.enLocation > 0 || produits.some((p) => p.type_offre === 'location') ? (
        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif text-lg text-ink flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-teal/10 text-teal flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M3 4h18v13H3zM8 21h8M12 17v4" /></svg>
              </span>
              Module location
            </h3>
            <span className="text-[11px] font-bold text-teal bg-teal/10 px-3 py-1.5 rounded-full">
              {stats.enLocation} disponible{stats.enLocation > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[12.5px] text-ink-soft/50 mb-5">Suivez la disponibilité de vos articles en location en un coup d'œil.</p>

          {produits.filter((p) => p.type_offre === 'location').length === 0 ? (
            <div className="bg-sable rounded-btn border border-dashed border-line p-8 text-center">
              <p className="text-ink-soft/60 text-sm">Aucun article en location pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {produits.filter((p) => p.type_offre === 'location').slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-sable rounded-btn border border-line p-3.5">
                  <div className="h-11 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                    {p.image_principale && <img src={p.image_principale} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{p.titre}</p>
                    <p className="text-[11px] text-ink-soft/50">{formatFCFA(p.prix_final_public)} /jour</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleLocationStatus(p)}
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full whitespace-nowrap ${
                      p.disponible ? 'bg-teal/10 text-teal' : 'bg-orange/10 text-orange'
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
              className="text-[12px] font-semibold text-teal hover:text-teal-dark transition-colors"
            >
              Voir tous mes articles →
            </button>
          )}
        </div>

        {produits.length === 0 ? (
          <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-12 text-center">
            <p className="text-ink-soft/60 text-sm">
              Aucun article pour le moment. Commencez par en ajouter un !
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] divide-y divide-line overflow-hidden">
            {produits.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-btn bg-line/40 overflow-hidden shrink-0">
                  {p.image_principale && (
                    <img src={p.image_principale} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{p.titre}</p>
                  <p className="text-[12px] text-ink-soft/60">{p.categorie_nom || 'Sans catégorie'}</p>
                </div>
                <p className="text-sm font-bold text-ink whitespace-nowrap">
                  {formatFCFA(p.prix_final_public)}{p.type_offre === 'location' && <span className="text-ink-soft/50 font-normal"> /jour</span>}
                </p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    p.disponible ? 'bg-teal/10 text-teal' : 'bg-line text-ink-soft/60'
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
                        ? 'border-orange text-orange hover:bg-orange hover:text-white'
                        : 'border-teal text-teal hover:bg-teal hover:text-white'
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
