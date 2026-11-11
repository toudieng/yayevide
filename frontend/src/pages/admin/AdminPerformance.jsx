// frontend/src/pages/admin/AdminPerformance.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ShellAdmin from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD as SHADOW } from '../../utils/gradientCards';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

const PERIODES = [
  { id: '7j', label: '7 jours' },
  { id: '30j', label: '30 jours' },
  { id: '90j', label: '90 jours' },
];

function Variation({ valeur, suffixe = '% vs période précédente' }) {
  if (valeur === null || valeur === undefined) {
    return <span className="text-[11px] font-semibold text-ink-soft/75">— vs période précédente</span>;
  }
  const positif = valeur >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${positif ? 'text-green-600' : 'text-red-500'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-3 w-3 shrink-0 ${positif ? '' : 'rotate-180'}`}>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {positif ? '+' : ''}{valeur}{suffixe}
    </span>
  );
}

function Sparkline({ points }) {
  const max = Math.max(1, ...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 32 - ((p - min) / range) * 28;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-10">
      <polyline points={coords} fill="none" stroke="#2E8B8B" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function AdminPerformance() {
  const { moi, chargementSession } = useSession('admin');

  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [periode, setPeriode] = useState('30j');

  useEffect(() => {
    if (chargementSession) return;
    setChargement(true);
    apiFetch(`/admin/performance/?periode=${periode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setChargement(false));
  }, [chargementSession, periode]);

  if (chargementSession || chargement || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  const v = data.vision_360 || {};
  const rep = data.repartition || {};
  const act = data.activite_plateforme || {};
  const com = data.communaute || {};
  const eng = data.engagement_detail || {};
  const maxEvolution = Math.max(1, ...data.evolution_gmv.map((e) => e.montant));
  const maxCategorie = Math.max(1, ...data.ventes_par_categorie.map((c) => c.total));
  const sparkPoints = data.evolution_gmv.map((e) => e.montant);

  return (
    <ShellAdmin active="performance" moi={moi} titre="Performance">

      <div className="flex items-center justify-between gap-4 flex-wrap -mt-2">
        <p className="text-[13px] text-ink-soft/75">Vue d'ensemble de la santé financière et de l'activité de Yaay Vidé.</p>
        <div className="flex items-center gap-2 bg-cream border border-line rounded-btn p-1">
          {PERIODES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriode(p.id)}
              className={`px-4 py-2 rounded-btn text-sm font-semibold transition-all ${
                periode === p.id ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* PERFORMANCE FINANCIÈRE + COMMISSION + RÉPARTITION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`${GRADIENT_CARDS[0].bg} rounded-m ${SHADOW} p-6`}>
          <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-2 ${GRADIENT_CARDS[0].label}`}>Performance financière · Chiffre d'affaires brut</p>
          <p className={`text-3xl font-serif font-bold mb-2 ${GRADIENT_CARDS[0].text}`}>{formatFCFA(v.gmv)}</p>
          <Variation valeur={v.gmv_variation} />
          <div className="mt-3 opacity-70">
            <Sparkline points={sparkPoints} />
          </div>
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <p className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide mb-2">Commission Yaay Vidé</p>
          <p className="text-3xl font-serif font-bold text-ink mb-2">{formatFCFA(v.commission)}</p>
          <p className="text-[11px] text-ink-soft/75 mb-3">{v.gmv ? Math.round((v.commission / v.gmv) * 100) : 0}% du CA brut</p>
          <div className="h-2 bg-line rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-orange rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (v.gmv ? (v.commission / v.gmv) * 100 : 0) / (v.commission_taux_standard || 10) * 100)}%` }} />
          </div>
          <p className="text-[10.5px] text-ink-soft/75">Taux standard configuré : {v.commission_taux_standard}%</p>
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <p className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide mb-4">Répartition des revenus</p>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-[10.5px] font-bold text-teal-dark uppercase tracking-wide mb-1">Valeur des ventes</p>
              <p className="text-lg font-serif font-bold text-ink">{formatFCFA(rep.ventes?.montant)}</p>
              <p className="text-[10.5px] text-ink-soft/75">{rep.ventes?.pct_total ?? 0}% du total</p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold text-orange uppercase tracking-wide mb-1">Valeur des locations</p>
              <p className="text-lg font-serif font-bold text-ink">{formatFCFA(rep.locations?.montant)}</p>
              <p className="text-[10.5px] text-ink-soft/75">{rep.locations?.pct_total ?? 0}% du total</p>
            </div>
          </div>
          <div className="h-2.5 bg-line rounded-full overflow-hidden flex">
            <div className="h-full bg-teal" style={{ width: `${rep.ventes?.pct_total ?? 0}%` }} />
            <div className="h-full bg-orange" style={{ width: `${rep.locations?.pct_total ?? 0}%` }} />
          </div>
        </div>
      </div>

      {/* ACTIVITÉ DE LA PLATEFORME + COMMUNAUTÉ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <h3 className="font-serif text-lg text-ink mb-1 flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-teal/10 text-teal-dark flex items-center justify-center text-sm">📦</span>
            Activité de la plateforme
          </h3>
          <p className="text-[12.5px] text-ink-soft/75 mb-5">Volume et cycle des transactions.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {[
              { label: 'Nombre de commandes', valeur: act.nb_commandes, variation: act.nb_commandes_variation },
              { label: 'Ventes finalisées', valeur: act.ventes_finalisees, variation: act.ventes_finalisees_variation },
              { label: 'Locations en cours', valeur: act.locations_en_cours, variation: act.locations_en_cours_variation },
              { label: 'Locations terminées', valeur: act.locations_terminees, variation: act.locations_terminees_variation },
              { label: 'Taux finalisé', valeur: `${act.taux_finalise ?? 0}%`, variation: act.taux_finalise_variation, suffixe: ' pts vs période préc.' },
              { label: 'Produits actifs', valeur: act.produits_actifs, variation: null },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-2xl font-serif font-bold text-ink">{m.valeur}</p>
                <p className="text-[11px] text-ink-soft/75 mb-1.5">{m.label}</p>
                <Variation valeur={m.variation} suffixe={m.suffixe || '% vs période précédente'} />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">Nouveaux produits publiés</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-serif font-bold text-ink">{act.nouveaux_produits}</span>
              <Variation valeur={act.nouveaux_produits_variation} />
            </div>
          </div>
        </div>

        <div className={`${GRADIENT_CARDS[0].bg} rounded-m ${SHADOW} p-6`}>
          <h3 className={`font-serif text-lg mb-1 flex items-center gap-2 ${GRADIENT_CARDS[0].text}`}>
            <span className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-sm">👥</span>
            Communauté
          </h3>
          <p className={`text-[12.5px] mb-5 ${GRADIENT_CARDS[0].label}`}>Base active de la plateforme.</p>
          <p className={`text-3xl font-serif font-bold mb-1 ${GRADIENT_CARDS[0].text}`}>{com.utilisateurs_inscrits?.toLocaleString('fr-FR')}</p>
          <p className={`text-[11px] mb-1.5 ${GRADIENT_CARDS[0].label}`}>Utilisateurs inscrits</p>
          <Variation valeur={com.nouveaux_utilisateurs_variation} />

          <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/10">
            <div>
              <p className={`text-xl font-serif font-bold ${GRADIENT_CARDS[0].text}`}>{com.nouveaux_utilisateurs}</p>
              <p className={`text-[10.5px] ${GRADIENT_CARDS[0].label}`}>Nouvelles inscriptions</p>
            </div>
            <div>
              <p className={`text-xl font-serif font-bold ${GRADIENT_CARDS[0].text}`}>{com.vendeuses_actives}</p>
              <p className={`text-[10.5px] ${GRADIENT_CARDS[0].label}`}>Vendeuses actives</p>
            </div>
            <div>
              <p className={`text-xl font-serif font-bold ${GRADIENT_CARDS[0].text}`}>{com.livreurs_actifs}</p>
              <p className={`text-[10.5px] ${GRADIENT_CARDS[0].label}`}>Livreurs actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* ENGAGEMENT + PRODUITS VEDETTES */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
        <div className={`${GRADIENT_CARDS[2].bg} rounded-m ${SHADOW} p-6`}>
          <h3 className="font-serif text-lg text-ink mb-1 flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-orange/15 text-orange flex items-center justify-center text-sm">👁️</span>
            Engagement
          </h3>
          <p className="text-[12.5px] text-ink-soft/75 mb-5">Intérêt → conversion, cumulé depuis le lancement.</p>
          <p className="text-2xl font-serif font-bold text-ink">{eng.nb_vues_total?.toLocaleString('fr-FR')}</p>
          <p className="text-[11px] text-ink-soft/75 mb-4">Nombre total de vues produits</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-lg font-serif font-bold text-ink">{eng.taux_conversion}%</p>
              <p className="text-[10.5px] text-ink-soft/75">Taux de conversion</p>
            </div>
            <div>
              <p className="text-lg font-serif font-bold text-ink">{eng.ratio_commandes_vues ? `1 sur ${eng.ratio_commandes_vues}` : '—'}</p>
              <p className="text-[10.5px] text-ink-soft/75">Vues → commandes</p>
            </div>
          </div>

          {eng.categorie_plus_consultee && (
            <div className="pt-4 border-t border-orange/15">
              <p className="text-[10.5px] font-bold text-orange uppercase tracking-wide mb-1">Catégorie la plus consultée</p>
              <p className="text-sm font-bold text-ink">{eng.categorie_plus_consultee.nom}</p>
              <p className="text-[11px] text-ink-soft/75">{eng.categorie_plus_consultee.nb_vues?.toLocaleString('fr-FR')} vues</p>
            </div>
          )}
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif text-lg text-ink">Produits vedettes</h3>
              <p className="text-[12.5px] text-ink-soft/75">Les plus consultés, toutes périodes confondues.</p>
            </div>
            <span className="text-[11px] font-bold text-ink-soft/75">{data.produits_vedettes.length}</span>
          </div>
          {data.produits_vedettes.length === 0 ? (
            <p className="text-ink-soft/75 text-sm text-center py-8">Pas encore de données de vues.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.produits_vedettes.map((p, i) => (
                <div key={p.titre + i} className="rounded-btn overflow-hidden border border-line">
                  <div className="relative h-28 bg-line/30">
                    {p.image && <img loading="lazy" decoding="async" src={p.image} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute top-2 left-2 h-6 w-6 rounded-full bg-ink text-white text-[11px] font-bold flex items-center justify-center">#{i + 1}</span>
                    <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${p.type_offre === 'location' ? 'bg-clay text-white' : 'bg-teal text-white'}`}>
                      {p.type_offre === 'location' ? 'Location' : 'Vente'}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[12.5px] font-semibold text-ink truncate mb-1.5">{p.titre}</p>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft/75">
                      <span>{p.nb_vues.toLocaleString('fr-FR')} vues</span>
                      <span>{p.nb_transactions} {p.type_offre === 'location' ? 'locations' : 'commandes'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`bg-white rounded-m ${SHADOW} p-6`}>
        <h3 className="font-serif text-lg text-ink mb-1">Évolution du GMV</h3>
        <p className="text-[12.5px] text-ink-soft/75 mb-6">Chiffre d'affaires total généré, 6 derniers mois.</p>
        <div className="flex items-end gap-4 h-40">
          {data.evolution_gmv.map((e) => (
            <div key={e.mois} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-ink-soft/75">{e.montant > 0 ? formatFCFA(e.montant) : ''}</span>
              <div
                className={`w-full rounded-t-s transition-all duration-700 ${e.montant > 0 ? 'bg-teal' : 'bg-line'}`}
                style={{ height: `${Math.max(4, (e.montant / maxEvolution) * 120)}px` }}
              />
              <span className="text-[10.5px] text-ink-soft/75 font-semibold capitalize">{e.mois}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <h3 className="font-serif text-lg text-ink mb-1">Top vendeuses</h3>
          <p className="text-[12.5px] text-ink-soft/75 mb-5">Classées par revenu net généré.</p>
          {data.top_vendeuses.length === 0 ? (
            <p className="text-ink-soft/75 text-sm text-center py-8">Aucune vente pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {data.top_vendeuses.map((vd, i) => (
                <Link
                  key={vd.id}
                  to={`/boutique/${vd.slug}`}
                  target="_blank"
                  className="flex items-center gap-3.5 p-3 rounded-btn hover:bg-sable transition-colors"
                >
                  <span className="h-7 w-7 rounded-full bg-ink text-cream text-[12px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{vd.nom_boutique}</p>
                    <p className="text-[11.5px] text-ink-soft/75">{vd.nb_ventes} vente{vd.nb_ventes > 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-sm font-bold text-teal-dark whitespace-nowrap">{formatFCFA(vd.revenu_net)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <h3 className="font-serif text-lg text-ink mb-1">Ventes par catégorie</h3>
          <p className="text-[12.5px] text-ink-soft/75 mb-5">Répartition du chiffre d'affaires.</p>
          {data.ventes_par_categorie.length === 0 ? (
            <p className="text-ink-soft/75 text-sm text-center py-8">Aucune vente pour le moment.</p>
          ) : (
            <div className="space-y-3.5">
              {data.ventes_par_categorie.map((c) => (
                <div key={c.produit__categorie__nom || 'sans-categorie'}>
                  <div className="flex items-center justify-between text-[13px] mb-1">
                    <span className="font-semibold text-ink">{c.produit__categorie__nom || 'Sans catégorie'}</span>
                    <span className="text-ink-soft/75">{formatFCFA(c.total)} · {c.nb}</span>
                  </div>
                  <div className="h-2 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-orange rounded-full transition-all duration-700" style={{ width: `${(c.total / maxCategorie) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </ShellAdmin>
  );
}
