// frontend/src/pages/admin/AdminCommandes.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GestionLocationAdmin from '../../components/location/GestionLocationAdmin';
import ShellAdmin from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { LIBELLES_PAIEMENT } from '../../utils/paiement';
import { GRADIENT_CARDS, SHADOW_CARD as SHADOW } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'en_attente_confirmation', label: 'En attente' },
  { value: 'confirme', label: 'Confirmé' },
  { value: 'en_cours_livraison', label: 'En cours' },
  { value: 'contre_proposition', label: 'Dates proposées' },
  { value: 'livre', label: 'Livré / location en cours' },
  { value: 'retour_a_collecter', label: 'Retour à récupérer' },
  { value: 'retour_en_cours', label: 'Retour en cours' },
  { value: 'retour_controle', label: 'Contrôle de retour' },
  { value: 'terminee', label: 'Location terminée' },
  { value: 'indisponible', label: 'Indisponible' },
  { value: 'annule', label: 'Annulé' },
];

const STATUT_STYLE = {
  en_attente_confirmation: 'bg-orange/15 text-clay-dark',
  confirme: 'bg-teal/10 text-teal-dark',
  indisponible: 'bg-red-50 text-red-500',
  en_cours_livraison: 'bg-clay/10 text-clay',
  livre: 'bg-teal text-white',
  terminee: 'bg-line text-ink',
  contre_proposition: 'bg-orange/15 text-clay-dark',
  retour_a_collecter: 'bg-teal/10 text-teal-dark',
  retour_en_cours: 'bg-teal/10 text-teal-dark',
  retour_controle: 'bg-orange/15 text-clay-dark',
  annule: 'bg-red-50 text-red-500',
};

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateHeure(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

const TYPE_INFO = {
  inscription_vendeuse: { couleur: 'bg-teal', label: 'Boutique' },
  commande: { couleur: 'bg-orange', label: 'Commande' },
  plainte: { couleur: 'bg-red-500', label: 'Plainte' },
  produit: { couleur: 'bg-clay', label: 'Article' },
};

const FILTRES_ACTIVITE = [
  { id: '', label: 'Tout' },
  { id: 'inscription_vendeuse', label: 'Boutiques' },
  { id: 'commande', label: 'Commandes' },
  { id: 'plainte', label: 'Plaintes' },
  { id: 'produit', label: 'Articles' },
];

export default function AdminCommandes() {
  const { moi, chargementSession } = useSession('admin');
  const [searchParams, setSearchParams] = useSearchParams();

  const [vue, setVue] = useState(searchParams.get('vue') === 'activites' ? 'activites' : 'commandes');
  const [evenements, setEvenements] = useState([]);
  const [filtreActivite, setFiltreActivite] = useState('');
  const [chargementActivites, setChargementActivites] = useState(true);

  const changerVue = (v) => {
    setVue(v);
    setSearchParams(v === 'activites' ? { vue: 'activites' } : {});
  };

  useEffect(() => {
    if (chargementSession || vue !== 'activites') return;
    setChargementActivites(true);
    apiFetch('/admin/activites/')
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvenements)
      .finally(() => setChargementActivites(false));
  }, [chargementSession, vue]);

  const evenementsFiltres = filtreActivite ? evenements.filter((e) => e.type === filtreActivite) : evenements;

  const [commandes, setCommandes] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState(searchParams.get('statut') || '');
  const [filtreType, setFiltreType] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [recherche, setRecherche] = useState('');
  const [selectionnee, setSelectionnee] = useState(null);
  const [enCours, setEnCours] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = () => {
    setChargement(true);
    const params = new URLSearchParams();
    if (filtreStatut) params.set('statut', filtreStatut);
    if (filtreType) params.set('type', filtreType);
    if (filtrePeriode) params.set('periode', filtrePeriode);
    if (recherche) params.set('q', recherche);
    Promise.all([
      apiFetch(`/admin/commandes/?${params.toString()}`),
      apiFetch('/admin/livreurs/'),
    ])
      .then(async ([resCommandes, resLivreurs]) => {
        const data = resCommandes.ok ? await resCommandes.json() : [];
        setCommandes(data);
        setLivreurs(resLivreurs.ok ? await resLivreurs.json() : []);
        setSelectionnee((prev) => data.find((c) => c.id === prev?.id) || data[0] || null);
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    if (chargementSession) return;
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargementSession, filtreStatut, filtreType, filtrePeriode]);

  useEffect(() => {
    const t = setTimeout(() => { if (!chargementSession) charger(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  const changerStatut = (v) => {
    setFiltreStatut(v);
    setSearchParams(v ? { statut: v } : {});
  };

  const mettreAJour = async (commande, patch) => {
    setEnCours(commande.id);
    const res = await apiFetch(`/admin/commandes/${commande.id}/`, { method: 'PATCH', body: patch });
    if (res.ok) {
      const updated = await res.json();
      setCommandes((prev) => prev.map((c) => (c.id === commande.id ? updated : c)));
      setSelectionnee((prev) => (prev?.id === commande.id ? updated : prev));
    }
    setEnCours(null);
  };

  const stats = useMemo(() => ({
    total: commandes.length,
    ventes: commandes.filter((c) => c.produit_type_offre === 'vente').length,
    locations: commandes.filter((c) => c.produit_type_offre === 'location').length,
    terminees: commandes.filter((c) => ['livre', 'terminee'].includes(c.statut)).length,
  }), [commandes]);

  if (chargementSession) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellAdmin active="commandes" moi={moi} titre="Commandes & Activités">

      <p className="text-[13px] text-ink-soft/75 -mt-2">Suivez les ventes, locations et transactions associées sur toute la plateforme.</p>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <div className={`flex items-center gap-2 bg-white rounded-btn p-1 w-fit ${SHADOW}`}>
        <button
          onClick={() => changerVue('commandes')}
          className={`px-4 py-2 rounded-btn text-sm font-semibold transition-all ${vue === 'commandes' ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'}`}
        >
          Commandes
        </button>
        <button
          onClick={() => changerVue('activites')}
          className={`px-4 py-2 rounded-btn text-sm font-semibold transition-all ${vue === 'activites' ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'}`}
        >
          Fil d'activités
        </button>
      </div>

      {vue === 'activites' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {FILTRES_ACTIVITE.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltreActivite(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
                  filtreActivite === f.id ? 'bg-ink text-cream' : 'bg-cream text-ink-soft/75 hover:bg-line/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {chargementActivites ? (
            <div className="flex justify-center py-16">
              <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" role="status" aria-label="Chargement en cours" />
            </div>
          ) : evenementsFiltres.length === 0 ? (
            <div className={`bg-white rounded-m ${SHADOW} p-16 text-center`}>
              <EtatVide compact bordure={false} icone="boite" texte="Aucune activité pour le moment." />
            </div>
          ) : (
            <div className={`bg-white rounded-m ${SHADOW} p-6`}>
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-line" />
                {evenementsFiltres.map((e, i) => {
                  const info = TYPE_INFO[e.type] || TYPE_INFO.commande;
                  return (
                    <div key={i} className="relative">
                      <span className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${info.couleur}`} />
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft/75">{info.label}</span>
                      </div>
                      <p className="text-[13.5px] text-ink">{e.texte}</p>
                      <p className="text-[11px] text-ink-soft/75 mt-0.5">{formatDateHeure(e.date)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Commandes (résultats)', valeur: stats.total },
          { label: 'Ventes', valeur: stats.ventes },
          { label: 'Locations', valeur: stats.locations },
          { label: 'Terminées', valeur: stats.terminees },
        ].map((s, i) => {
          const g = GRADIENT_CARDS[i % GRADIENT_CARDS.length];
          return (
          <div key={s.label} className={`${g.bg} rounded-m ${SHADOW} p-5`}>
            <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-1.5 ${g.label}`}>{s.label}</p>
            <p className={`text-2xl font-serif font-bold ${g.text}`}>{s.valeur}</p>
          </div>
          );
        })}
      </div>

      <div className={`bg-white rounded-m ${SHADOW} p-5 space-y-4`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide w-full sm:w-auto">Type</span>
          <div className="flex items-center gap-1 bg-cream rounded-btn p-1">
            {[{ id: '', l: 'Toutes' }, { id: 'vente', l: 'Vente' }, { id: 'location', l: 'Location' }].map((t) => (
              <button key={t.id} onClick={() => setFiltreType(t.id)} className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all ${filtreType === t.id ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'}`}>
                {t.l}
              </button>
            ))}
          </div>
          <span className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide ml-2">Période</span>
          <div className="flex items-center gap-1 bg-cream rounded-btn p-1">
            {[{ id: '', l: 'Tout' }, { id: '7j', l: '7 jours' }, { id: '30j', l: '30 jours' }].map((p) => (
              <button key={p.id} onClick={() => setFiltrePeriode(p.id)} className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all ${filtrePeriode === p.id ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'}`}>
                {p.l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide w-full sm:w-auto">Statut</span>
          <div className="flex items-center gap-1 bg-cream rounded-btn p-1 flex-wrap">
            {STATUTS.map((s) => (
              <button key={s.value} onClick={() => changerStatut(s.value)} className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all ${filtreStatut === s.value ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="N° commande, produit, acheteuse, boutique..."
          className="w-full px-4 py-2.5 bg-cream border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className={`bg-white rounded-m ${SHADOW} overflow-hidden`}>
          {chargement ? (
            <div className="flex justify-center py-16">
              <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" role="status" aria-label="Chargement en cours" />
            </div>
          ) : commandes.length === 0 ? (
            <EtatVide compact bordure={false} icone="boite" texte="Aucune commande ne correspond à ces filtres." />
          ) : (
            <div className="divide-y divide-line">
              {commandes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectionnee(c)}
                  className={`w-full flex items-center gap-3.5 p-4 text-left transition-colors ${selectionnee?.id === c.id ? 'bg-teal/5' : 'hover:bg-sable'}`}
                >
                  <div className="h-11 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                    {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink truncate">CMD-{String(c.id).padStart(6, '0')} · {c.produit_titre}</p>
                    <p className="text-[11.5px] text-ink-soft/75 truncate">{c.boutique_nom} → {c.acheteur_username} · {formatDate(c.date_commande)}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${c.produit_type_offre === 'location' ? 'bg-clay/10 text-clay' : 'bg-teal/10 text-teal-dark'}`}>
                    {c.produit_type_offre === 'location' ? 'Location' : 'Vente'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${STATUT_STYLE[c.statut] || 'bg-line text-ink-soft/75'}`}>
                    {STATUTS.find((s) => s.value === c.statut)?.label || c.statut}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6 h-fit lg:sticky lg:top-6`}>
          {!selectionnee ? (
            <p className="text-ink-soft/75 text-sm text-center py-10">Sélectionnez une commande.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <p className="font-serif font-bold text-lg text-ink">CMD-{String(selectionnee.id).padStart(6, '0')}</p>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${STATUT_STYLE[selectionnee.statut] || 'bg-line text-ink-soft/75'}`}>
                  {STATUTS.find((s) => s.value === selectionnee.statut)?.label || selectionnee.statut}
                </span>
              </div>
              <p className="text-[13px] text-ink-soft/75 mb-5">{selectionnee.produit_titre}</p>

              <div className="space-y-3 text-[13px] border-t border-line pt-4">
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Boutique</span><span className="font-semibold text-ink">{selectionnee.boutique_nom}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Acheteuse</span><span className="font-semibold text-ink">{selectionnee.acheteur_username}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Montant</span><span className="font-semibold text-ink">{formatFCFA(selectionnee.prix_total_paye)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Commission Yaay Vidé</span><span className="font-semibold text-ink">{formatFCFA(selectionnee.commission_plateforme)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Paiement</span><span className="font-semibold text-ink">{LIBELLES_PAIEMENT[selectionnee.mode_paiement_choisi] || selectionnee.mode_paiement_choisi || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Zone</span><span className="font-semibold text-ink">{selectionnee.zone_livraison_nom || '—'}</span></div>
              </div>

              <div className="pt-4 border-t border-line mt-4 space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-ink-soft/75 uppercase tracking-wide mb-1.5">Changer le statut</p>
                  <select
                    value={selectionnee.statut}
                    disabled={enCours === selectionnee.id}
                    onChange={(e) => mettreAJour(selectionnee, { statut: e.target.value })}
                    className="w-full text-[13px] px-3 py-2.5 bg-sable border border-line rounded-btn focus:outline-none focus:border-teal disabled:opacity-50"
                  >
                    {STATUTS.filter((s) => s.value).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-ink-soft/75 uppercase tracking-wide mb-1.5">Assigner un livreur</p>
                  <select
                    value={selectionnee.livreur || ''}
                    disabled={enCours === selectionnee.id}
                    onChange={(e) => mettreAJour(selectionnee, { livreur_id: e.target.value || null })}
                    className="w-full text-[13px] px-3 py-2.5 bg-sable border border-line rounded-btn focus:outline-none focus:border-teal disabled:opacity-50"
                  >
                    <option value="">Aucun livreur</option>
                    {[...livreurs]
                      .sort((a, b) => (a.zone_livreur === selectionnee.zone_livraison ? 0 : 1) - (b.zone_livreur === selectionnee.zone_livraison ? 0 : 1))
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.username}{l.zone_livreur === selectionnee.zone_livraison ? ' · ✓ sa zone' : l.zone_nom ? ` · ${l.zone_nom}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {selectionnee.produit_type_offre === 'location' && (
                <GestionLocationAdmin
                  key={selectionnee.id}
                  c={selectionnee}
                  livreurs={livreurs}
                  onMaj={(maj) => {
                    setCommandes((prev) => prev.map((x) => (x.id === maj.id ? maj : x)));
                    setSelectionnee(maj);
                  }}
                />
              )}

              <div className="pt-4 border-t border-line mt-4">
                <p className="text-[11px] font-bold text-ink-soft/75 uppercase tracking-wide mb-2">Chronologie</p>
                <div className="space-y-2 text-[12.5px]">
                  <div className="flex justify-between"><span className="text-ink-soft/75">Commandée</span><span className="text-ink">{formatDateHeure(selectionnee.date_commande)}</span></div>
                  {selectionnee.date_paiement && (
                    <div className="flex justify-between"><span className="text-ink-soft/75">Payée</span><span className="text-ink">{formatDateHeure(selectionnee.date_paiement)}</span></div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </>
      )}

    </ShellAdmin>
  );
}
