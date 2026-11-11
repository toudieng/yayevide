// frontend/src/pages/admin/AdminUtilisateurs.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ShellAdmin from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD as SHADOW } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

const ROLES = [
  { value: '', label: 'Tous' },
  { value: 'acheteur', label: 'Acheteuse' },
  { value: 'vendeur', label: 'Vendeur' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_LABEL = { acheteur: 'Acheteuse', vendeur: 'Vendeuse', livreur: 'Livreur', admin: 'Admin' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminUtilisateurs() {
  const { moi, chargementSession } = useSession('admin');
  const [searchParams, setSearchParams] = useSearchParams();

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [filtreRole, setFiltreRole] = useState(searchParams.get('role') || '');
  const [filtreStatut, setFiltreStatut] = useState('actif');
  const [filtreVerif, setFiltreVerif] = useState(searchParams.get('statut') === 'a_valider' ? 'non_verifie' : '');
  const [recherche, setRecherche] = useState('');
  const [selectionne, setSelectionne] = useState(null);
  const [enCours, setEnCours] = useState(null);

  const charger = () => {
    setChargement(true);
    const params = new URLSearchParams();
    if (filtreRole) params.set('role', filtreRole);
    if (filtreStatut) params.set('statut', filtreStatut);
    if (filtreVerif) params.set('verification', filtreVerif);
    if (recherche) params.set('q', recherche);
    apiFetch(`/admin/utilisateurs/?${params.toString()}`)
      .then(async (res) => {
        const data = res.ok ? await res.json() : [];
        setUtilisateurs(data);
        setSelectionne((prev) => data.find((u) => u.id === prev?.id) || data[0] || null);
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    if (chargementSession) return;
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargementSession, filtreRole, filtreStatut, filtreVerif]);

  useEffect(() => {
    const t = setTimeout(() => { if (!chargementSession) charger(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  const changerRole = (role) => {
    setFiltreRole(role);
    setSearchParams(role ? { role } : {});
  };

  const toggleSuspension = async (u) => {
    setEnCours(u.id);
    const res = await apiFetch(`/admin/utilisateurs/${u.id}/suspendre/`, {
      method: 'PATCH',
      body: { is_active: !u.is_active },
    });
    if (res.ok) {
      const updated = await res.json();
      setUtilisateurs((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      setSelectionne((prev) => (prev?.id === u.id ? updated : prev));
    }
    setEnCours(null);
  };

  const valider = async (u) => {
    if (!u.boutique_slug) return;
    setEnCours(u.id);
    const res = await apiFetch(`/admin/vendeuses/${u.id}/valider/`, { method: 'PATCH' });
    if (res.ok) {
      setUtilisateurs((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_whatsapp_verified: true } : x)));
      setSelectionne((prev) => (prev?.id === u.id ? { ...prev, is_whatsapp_verified: true } : prev));
    }
    setEnCours(null);
  };

  const compteurs = useMemo(() => ({
    total: utilisateurs.length,
    verifies: utilisateurs.filter((u) => u.is_whatsapp_verified).length,
    suspendus: utilisateurs.filter((u) => !u.is_active).length,
  }), [utilisateurs]);

  if (chargementSession) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellAdmin active="utilisateurs" moi={moi} titre="Utilisateurs">

      <p className="text-[13px] text-ink-soft/75 -mt-2">Gérez les profils, les vérifications et les interventions sur les comptes.</p>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className={`${GRADIENT_CARDS[0].bg} rounded-m ${SHADOW} p-5`}>
          <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-1.5 ${GRADIENT_CARDS[0].label}`}>Résultats affichés</p>
          <p className={`text-2xl font-serif font-bold ${GRADIENT_CARDS[0].text}`}>{compteurs.total}</p>
        </div>
        <div className={`${GRADIENT_CARDS[1].bg} rounded-m ${SHADOW} p-5`}>
          <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-1.5 ${GRADIENT_CARDS[1].label}`}>Profils vérifiés</p>
          <p className={`text-2xl font-serif font-bold ${GRADIENT_CARDS[1].iconColor}`}>{compteurs.verifies}</p>
        </div>
        <div className={`${GRADIENT_CARDS[2].bg} rounded-m ${SHADOW} p-5`}>
          <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-1.5 ${GRADIENT_CARDS[2].label}`}>Comptes suspendus</p>
          <p className="text-2xl font-serif font-bold text-red-500">{compteurs.suspendus}</p>
        </div>
      </div>

      <div className={`bg-white rounded-m ${SHADOW} p-5 space-y-4`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide w-full sm:w-auto">Rôle</span>
          <div className="flex items-center gap-1 bg-cream rounded-btn p-1 flex-wrap">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => changerRole(r.value)}
                className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all ${
                  filtreRole === r.value ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide w-full sm:w-auto">Statut</span>
          <div className="flex items-center gap-1 bg-cream rounded-btn p-1">
            {[{ id: '', l: 'Tous' }, { id: 'actif', l: 'Actif' }, { id: 'suspendu', l: 'Suspendu' }].map((s) => (
              <button key={s.id} onClick={() => setFiltreStatut(s.id)} className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all ${filtreStatut === s.id ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'}`}>
                {s.l}
              </button>
            ))}
          </div>
          <span className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide ml-2">Vérification</span>
          <div className="flex items-center gap-1 bg-cream rounded-btn p-1">
            {[{ id: '', l: 'Tous' }, { id: 'verifie', l: 'Vérifié' }, { id: 'non_verifie', l: 'Non vérifié' }].map((s) => (
              <button key={s.id} onClick={() => setFiltreVerif(s.id)} className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all ${filtreVerif === s.id ? 'bg-ink text-cream' : 'text-ink-soft/75 hover:text-ink'}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="ID, nom, téléphone, e-mail ou nom de boutique..."
          className="w-full px-4 py-2.5 bg-cream border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className={`bg-white rounded-m ${SHADOW} overflow-hidden`}>
          {chargement ? (
            <div className="flex justify-center py-16">
              <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" role="status" aria-label="Chargement en cours" />
            </div>
          ) : utilisateurs.length === 0 ? (
            <EtatVide compact bordure={false} icone="recherche" texte="Aucun utilisateur ne correspond à ces filtres." />
          ) : (
            <div className="divide-y divide-line">
              {utilisateurs.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectionne(u)}
                  className={`w-full flex items-center gap-3.5 p-4 text-left transition-colors ${selectionne?.id === u.id ? 'bg-teal/5' : 'hover:bg-sable'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-ink/10 text-ink flex items-center justify-center font-serif font-bold shrink-0">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">
                      {u.username} {u.nom_boutique && <span className="text-ink-soft/75 font-normal">· {u.nom_boutique}</span>}
                    </p>
                    <p className="text-[11.5px] text-ink-soft/75 truncate">{u.email || u.phone_number}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-line text-ink-soft/75 whitespace-nowrap shrink-0">
                    {ROLE_LABEL[u.role] || u.role}
                  </span>
                  {!u.is_active && <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" title="Suspendu" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6 h-fit lg:sticky lg:top-6`}>
          {!selectionne ? (
            <p className="text-ink-soft/75 text-sm text-center py-10">Sélectionnez un utilisateur.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-ink/10 text-ink flex items-center justify-center font-serif font-bold text-lg shrink-0">
                    {selectionne.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-serif font-bold text-ink flex items-center gap-1.5">
                      {selectionne.username}
                      {selectionne.is_whatsapp_verified && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-teal"><circle cx="12" cy="12" r="9" /><path d="M8 12l2.5 2.5L16 9" /></svg>
                      )}
                    </p>
                    <p className="text-[11.5px] text-ink-soft/75">USR-{String(selectionne.id).padStart(6, '0')} · {ROLE_LABEL[selectionne.role]}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0 ${selectionne.is_active ? 'bg-teal/10 text-teal-dark' : 'bg-red-50 text-red-500'}`}>
                  {selectionne.is_active ? 'Actif' : 'Suspendu'}
                </span>
              </div>

              <div className="space-y-3 text-[13px] border-t border-line pt-4">
                {selectionne.nom_boutique && (
                  <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Boutique</span><span className="font-semibold text-ink">{selectionne.nom_boutique}</span></div>
                )}
                {selectionne.email && (
                  <div className="flex justify-between gap-3"><span className="text-ink-soft/75">E-mail</span><span className="font-semibold text-ink">{selectionne.email}</span></div>
                )}
                {selectionne.phone_number && (
                  <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Téléphone</span><span className="font-semibold text-ink">{selectionne.phone_number}</span></div>
                )}
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Inscription</span><span className="font-semibold text-ink">{formatDate(selectionne.date_joined)}</span></div>
                {selectionne.note_moyenne !== null && selectionne.note_moyenne !== undefined && (
                  <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Note moyenne</span><span className="font-semibold text-ink">⭐ {Number(selectionne.note_moyenne).toFixed(1)}</span></div>
                )}
                {selectionne.nb_produits !== null && selectionne.nb_produits !== undefined && (
                  <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Articles publiés</span><span className="font-semibold text-ink">{selectionne.nb_produits}</span></div>
                )}
                {selectionne.nb_ventes !== null && selectionne.nb_ventes !== undefined && (
                  <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Ventes réalisées</span><span className="font-semibold text-ink">{selectionne.nb_ventes}</span></div>
                )}
                {selectionne.nb_commandes !== null && selectionne.nb_commandes !== undefined && (
                  <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Commandes passées</span><span className="font-semibold text-ink">{selectionne.nb_commandes}</span></div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 mt-6">
                {selectionne.nom_boutique && !selectionne.is_whatsapp_verified && (
                  <button
                    disabled={enCours === selectionne.id}
                    onClick={() => valider(selectionne)}
                    className="text-[12.5px] font-bold px-4 py-3 rounded-btn bg-teal text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
                  >
                    Valider la boutique
                  </button>
                )}
                <button
                  disabled={enCours === selectionne.id}
                  onClick={() => toggleSuspension(selectionne)}
                  className={`text-[12.5px] font-bold px-4 py-3 rounded-btn border transition-colors disabled:opacity-50 ${
                    selectionne.is_active
                      ? 'border-red-300 text-red-500 hover:bg-red-50'
                      : 'border-teal text-teal-dark hover:bg-teal hover:text-white'
                  }`}
                >
                  {selectionne.is_active ? 'Suspendre le compte' : 'Réactiver le compte'}
                </button>
              </div>

              <div className="bg-orange/5 border border-orange/15 rounded-btn p-3.5 mt-4">
                <p className="text-[11px] text-ink-soft leading-relaxed">
                  Ces coordonnées sont réservées à l'équipe Yaay Vidé — ne les partagez jamais avec un tiers.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

    </ShellAdmin>
  );
}
