// frontend/src/pages/livreur/LivreurMesLivraisons.jsx
import { useEffect, useMemo, useState } from 'react';
import ShellLivreur from '../../components/livreur/ShellLivreur';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

const PROCHAIN_STATUT = {
  confirme: { valeur: 'en_cours_livraison', label: 'Démarrer la livraison' },
  en_cours_livraison: { valeur: 'livre', label: 'Marquer comme livrée' },
};

const STATUT_INFO = {
  confirme: { label: 'À récupérer', couleur: 'bg-orange/10 text-orange' },
  en_cours_livraison: { label: 'En cours', couleur: 'bg-teal/10 text-teal-dark' },
  livre: { label: 'Livrée', couleur: 'bg-teal text-white' },
  annule: { label: 'Annulée', couleur: 'bg-red-50 text-red-500' },
  indisponible: { label: 'Annulée', couleur: 'bg-red-50 text-red-500' },
};

const ONGLETS = [
  { id: 'toutes', label: 'Toutes', test: () => true },
  { id: 'a_recuperer', label: 'À récupérer', test: (c) => c.statut === 'confirme' },
  { id: 'en_cours', label: 'En cours', test: (c) => c.statut === 'en_cours_livraison' },
  { id: 'livree', label: 'Livrée', test: (c) => c.statut === 'livre' },
  { id: 'annulee', label: 'Annulée', test: (c) => ['annule', 'indisponible'].includes(c.statut) },
];

const SHADOW = `${SHADOW_CARD}`;

export default function LivreurMesLivraisons() {
  const { moi, chargementSession } = useSession('livreur');

  const [commandes, setCommandes] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [zones, setZones] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(null);
  const [onglet, setOnglet] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [filtreZone, setFiltreZone] = useState('');
  const [filtreDate, setFiltreDate] = useState('');
  const [selectionnee, setSelectionnee] = useState(null);

  const charger = () => {
    Promise.all([
      apiFetch('/livreur/mes-livraisons/?statut=tous'),
      apiFetch('/livreur/livraisons-disponibles/'),
      apiFetch('/zones-livraison/'),
    ])
      .then(async ([resLivraisons, resDisponibles, resZones]) => {
        const liste = resLivraisons.ok ? await resLivraisons.json() : [];
        setCommandes(liste);
        setDisponibles(resDisponibles.ok ? await resDisponibles.json() : []);
        setZones(resZones.ok ? await resZones.json() : []);
        setSelectionnee((prev) => prev || liste[0] || null);
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    if (chargementSession) return;
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargementSession]);

  const commandesFiltrees = useMemo(() => {
    const test = ONGLETS.find((o) => o.id === onglet)?.test || (() => true);
    return commandes
      .filter(test)
      .filter((c) => !recherche || c.produit_titre.toLowerCase().includes(recherche.toLowerCase()) || c.acheteur_username?.toLowerCase().includes(recherche.toLowerCase()))
      .filter((c) => !filtreZone || c.zone_livraison === filtreZone)
      .filter((c) => !filtreDate || c.date_commande?.slice(0, 10) === filtreDate);
  }, [commandes, onglet, recherche, filtreZone, filtreDate]);

  const prendreEnCharge = async (commande) => {
    setEnCours(commande.id);
    const res = await apiFetch(`/livreur/commandes/${commande.id}/prendre-en-charge/`, { method: 'PATCH' });
    if (res.ok) {
      const updated = await res.json();
      setDisponibles((prev) => prev.filter((c) => c.id !== commande.id));
      setCommandes((prev) => [...prev, updated]);
      setSelectionnee(updated);
    }
    setEnCours(null);
  };

  const avancer = async (commande) => {
    const prochain = PROCHAIN_STATUT[commande.statut];
    if (!prochain) return;
    setEnCours(commande.id);
    const res = await apiFetch(`/livreur/commandes/${commande.id}/statut/`, {
      method: 'PATCH',
      body: { statut: prochain.valeur },
    });
    if (res.ok) {
      const updated = await res.json();
      if (updated.statut === 'livre') {
        setCommandes((prev) => prev.filter((c) => c.id !== commande.id));
        setSelectionnee((prev) => (prev?.id === commande.id ? null : prev));
      } else {
        setCommandes((prev) => prev.map((c) => (c.id === commande.id ? updated : c)));
        setSelectionnee((prev) => (prev?.id === commande.id ? updated : prev));
      }
    }
    setEnCours(null);
  };

  if (chargementSession || chargement) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellLivreur active="livraisons" moi={moi} titre="Mes livraisons">

      <p className="text-[13px] text-ink-soft/75 -mt-2">Suivez et gérez vos tournées du jour.</p>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      {disponibles.length > 0 && (
        <div className={`bg-teal/5 border border-teal/20 rounded-m p-5`}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif text-base text-ink">Livraisons disponibles dans ma zone</h3>
            <span className="text-[11px] font-bold text-teal-dark bg-white px-3 py-1.5 rounded-full">{disponibles.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {disponibles.map((c) => (
              <div key={c.id} className="bg-white rounded-btn p-3.5 flex items-center gap-3">
                <p className="flex-1 text-[13px] font-semibold text-ink truncate">{c.produit_titre}</p>
                <button
                  type="button"
                  disabled={enCours === c.id}
                  onClick={() => prendreEnCharge(c)}
                  className="shrink-0 text-[11px] font-bold uppercase px-3 py-2 rounded-btn bg-teal text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
                >
                  Prendre en charge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-cream rounded-btn p-1">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all ${
                onglet === o.id ? 'bg-teal text-white' : 'text-ink-soft/75 hover:text-ink'
              }`}
            >
              {o.label} <span className="opacity-70">({commandes.filter(o.test).length})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filtreZone}
            onChange={(e) => setFiltreZone(e.target.value)}
            className="px-3 py-2 rounded-btn border border-line text-[13px] focus:outline-none focus:border-teal"
          >
            <option value="">Toutes zones</option>
            {zones.map((z) => <option key={z.code} value={z.code}>{z.nom}</option>)}
          </select>
          <input
            type="date"
            value={filtreDate}
            onChange={(e) => setFiltreDate(e.target.value)}
            className="px-3 py-2 rounded-btn border border-line text-[13px] focus:outline-none focus:border-teal"
          />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="N° de livraison ou cliente..."
            className="px-4 py-2 rounded-btn border border-line text-[13px] focus:outline-none focus:border-teal w-full sm:w-56"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className={`bg-white rounded-m ${SHADOW} overflow-hidden`}>
          {commandesFiltrees.length === 0 ? (
            <EtatVide compact bordure={false} icone="camion" texte="Aucune livraison dans cette catégorie." />
          ) : (
            <div className="divide-y divide-line">
              {commandesFiltrees.map((c) => {
                const st = STATUT_INFO[c.statut] || STATUT_INFO.confirme;
                return (
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
                      <p className="text-[13px] font-bold text-ink truncate">{c.acheteur_username}</p>
                      <p className="text-[11.5px] text-ink-soft/75 truncate">{c.zone_livraison_nom || c.boutique_nom}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${st.couleur}`}>{st.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6 h-fit lg:sticky lg:top-6`}>
          {!selectionnee ? (
            <p className="text-ink-soft/75 text-sm text-center py-10">Sélectionnez une livraison pour voir le détail.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${(STATUT_INFO[selectionnee.statut] || STATUT_INFO.confirme).couleur}`}>
                  {(STATUT_INFO[selectionnee.statut] || STATUT_INFO.confirme).label}
                </span>
                <button type="button" onClick={() => setSelectionnee(null)} className="text-ink-soft/75 hover:text-ink transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <p className="font-serif font-bold text-lg text-ink mb-1">{selectionnee.produit_titre}</p>
              <p className="text-[12.5px] text-ink-soft/75 mb-5">Chez {selectionnee.boutique_nom}</p>

              <div className="space-y-3.5 text-[13px] border-t border-line pt-4">
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Cliente</span><span className="font-semibold text-ink">{selectionnee.acheteur_username}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">WhatsApp</span><span className="font-semibold text-ink">{selectionnee.acheteur_telephone}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Adresse</span><span className="font-semibold text-ink text-right">{selectionnee.adresse_livraison}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Zone</span><span className="font-semibold text-ink">{selectionnee.zone_livraison_nom}</span></div>
                <div className="flex justify-between gap-3"><span className="text-ink-soft/75">Frais de livraison</span><span className="font-semibold text-ink">{formatFCFA(selectionnee.frais_livraison)}</span></div>
              </div>

              <div className="flex flex-col gap-2.5 mt-6">
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(selectionnee.adresse_livraison || '')}`}
                  target="_blank" rel="noreferrer"
                  className="text-center text-[12.5px] font-bold px-4 py-3 rounded-btn border border-line text-ink hover:border-teal hover:text-teal-dark transition-colors"
                >
                  Voir l'itinéraire
                </a>
                <a
                  href={`https://wa.me/${(selectionnee.acheteur_telephone || '').replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="text-center text-[12.5px] font-bold px-4 py-3 rounded-btn border border-line text-ink hover:border-teal hover:text-teal-dark transition-colors"
                >
                  Contacter la cliente
                </a>
                {PROCHAIN_STATUT[selectionnee.statut] && (
                  <button
                    disabled={enCours === selectionnee.id}
                    onClick={() => avancer(selectionnee)}
                    className="text-[12.5px] font-bold px-4 py-3 rounded-btn bg-teal text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
                  >
                    {enCours === selectionnee.id ? '...' : PROCHAIN_STATUT[selectionnee.statut].label}
                  </button>
                )}
              </div>

              <div className="bg-orange/5 border border-orange/15 rounded-btn p-3.5 mt-4">
                <p className="text-[11px] text-ink-soft leading-relaxed">
                  <span className="font-bold">Coordonnées protégées.</span> Ne partagez jamais ces informations. Les incidents passent par Yaay Vidé.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

    </ShellLivreur>
  );
}
