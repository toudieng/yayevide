// frontend/src/pages/vendeuse/LocationsVendeuse.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShellVendeuse from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD } from '../../utils/gradientCards';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function joursRestants(iso) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

const STATUT_STYLE = {
  en_attente_confirmation: { label: 'Demande', couleur: 'bg-orange/10 text-orange' },
  confirme: { label: 'À venir', couleur: 'bg-teal/10 text-teal-dark' },
  en_cours_livraison: { label: 'En cours', couleur: 'bg-teal/15 text-teal-dark' },
  livre: { label: 'En cours', couleur: 'bg-teal/15 text-teal-dark' },
  terminee: { label: 'Terminée', couleur: 'bg-line text-ink-soft/75' },
  indisponible: { label: 'Annulée', couleur: 'bg-red-50 text-red-500' },
  annule: { label: 'Annulée', couleur: 'bg-red-50 text-red-500' },
};

const ONGLETS = [
  { id: 'toutes', label: 'Toutes', test: () => true },
  { id: 'demandes', label: 'Demandes', test: (c) => c.statut === 'en_attente_confirmation' },
  { id: 'a_venir', label: 'À venir', test: (c) => c.statut === 'confirme' },
  { id: 'en_cours', label: 'En cours', test: (c) => ['en_cours_livraison', 'livre'].includes(c.statut) },
  { id: 'terminees', label: 'Terminées', test: (c) => c.statut === 'terminee' },
];

const FONCTIONNALITES_A_VENIR = [
  { titre: 'Calendrier de disponibilité', desc: 'Bloquer les dates et prévenir les doubles réservations.' },
  { titre: 'Gestion de la caution', desc: 'Suivre les cautions reçues, rendues ou retenues.' },
  { titre: 'Prolongation', desc: 'Accepter ou refuser une demande de prolongation.' },
  { titre: 'Retard et litige', desc: "Signaler un incident, appliquer des frais et conserver l'historique." },
];

export default function LocationsVendeuse() {
  const { moi, chargementSession } = useVendeuseSession();

  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [onglet, setOnglet] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [enCours, setEnCours] = useState(null);

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/mes-ventes/')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCommandes((data.commandes || []).filter((c) => c.produit_type_offre === 'location'));
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  }, [chargementSession]);

  const stats = useMemo(() => {
    const maintenant = new Date();
    const dans7j = new Date(maintenant.getTime() + 7 * 86400000);
    return {
      actives: commandes.filter((c) => ['en_cours_livraison', 'livre'].includes(c.statut)).length,
      retours: commandes.filter((c) => ['en_cours_livraison', 'livre'].includes(c.statut) && c.date_fin_location && new Date(c.date_fin_location) <= dans7j).length,
      demandes: commandes.filter((c) => c.statut === 'en_attente_confirmation').length,
      revenus: commandes
        .filter((c) => c.statut_paiement === 'paye' && new Date(c.date_paiement || c.date_commande).getMonth() === maintenant.getMonth())
        .reduce((s, c) => s + Number(c.montant_net_vendeuse || 0), 0),
    };
  }, [commandes]);

  const commandesFiltrees = useMemo(() => {
    const test = ONGLETS.find((o) => o.id === onglet)?.test || (() => true);
    return commandes.filter(test).filter((c) => !recherche || c.produit_titre.toLowerCase().includes(recherche.toLowerCase()));
  }, [commandes, onglet, recherche]);

  const marquerRetournee = async (commande) => {
    setEnCours(commande.id);
    const res = await apiFetch(`/commandes/${commande.id}/marquer-retournee/`, { method: 'PATCH' });
    if (res.ok) {
      const updated = await res.json();
      setCommandes((prev) => prev.map((c) => (c.id === commande.id ? updated : c)));
    }
    setEnCours(null);
  };

  if (chargementSession || chargement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  return (
    <ShellVendeuse active="locations" moi={moi} titre="Locations">

      <div className="flex items-start justify-between gap-4 flex-wrap -mt-2">
        <p className="text-[13px] text-ink-soft/75">Suivez les locations en toute sécurité : les échanges passent par la modération Yaay Vidé.</p>
        <Link
          to="/vendeuse/ajouter-produit"
          className="bg-orange hover:bg-orange-dark text-white font-bold text-sm px-5 py-2.5 rounded-btn transition-colors shrink-0 whitespace-nowrap"
        >
          + Ajouter un article
        </Link>
      </div>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Locations actives', valeur: stats.actives, note: 'En cours' },
          { label: 'Retours cette semaine', valeur: stats.retours, note: 'À préparer' },
          { label: 'Demandes reçues', valeur: stats.demandes, note: 'À valider' },
          { label: 'Revenus du mois', valeur: formatFCFA(stats.revenus), note: 'FCFA' },
        ].map((s, i) => {
          const g = GRADIENT_CARDS[i % GRADIENT_CARDS.length];
          return (
          <div key={s.label} className={`${g.bg} rounded-m ${SHADOW_CARD} p-5`}>
            <p className={`text-[10.5px] font-bold uppercase tracking-wide mb-2 ${g.label}`}>{s.label}</p>
            <div className="flex items-end justify-between gap-2">
              <p className={`text-2xl font-serif font-bold ${g.text}`}>{s.valeur}</p>
              <span className={`text-[10.5px] font-bold ${g.iconColor}`}>{s.note}</span>
            </div>
          </div>
          );
        })}
      </div>

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
              {o.label} <span className="opacity-70">({commandes.filter(o.test).length})</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une location..."
          className="px-4 py-2 rounded-btn border border-line text-[13px] focus:outline-none focus:border-teal w-full sm:w-56"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink uppercase tracking-widest">Suivi des locations</h3>
          <span className="text-[12px] text-ink-soft/75">{commandes.length} location{commandes.length > 1 ? 's' : ''} au total</span>
        </div>

        {commandesFiltrees.length === 0 ? (
          <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-14 text-center">
            <p className="text-ink-soft/75 text-sm mb-4">Aucune location dans cette catégorie pour le moment.</p>
            <Link to="/vendeuse/ajouter-produit" className="text-teal-dark font-semibold text-sm hover:underline">
              Ajouter un article à louer
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {commandesFiltrees.map((c) => {
              const st = STATUT_STYLE[c.statut] || STATUT_STYLE.terminee;
              const restants = joursRestants(c.date_fin_location);
              const enCoursLocation = ['en_cours_livraison', 'livre'].includes(c.statut);
              return (
                <div key={c.id} className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-12 w-12 rounded-btn bg-line/40 overflow-hidden shrink-0">
                        {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${st.couleur}`}>{st.label}</span>
                          {enCoursLocation && restants !== null && restants >= 0 && (
                            <span className="text-[10.5px] font-bold text-orange">Retour dans {restants} jour{restants > 1 ? 's' : ''}</span>
                          )}
                        </div>
                        <p className="font-bold text-ink truncate">{c.produit_titre}</p>
                        <p className="text-[11.5px] text-ink-soft/75">Location YV-L-{String(c.id).padStart(4, '0')} · {c.nb_jours_location || '—'} jours</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10.5px] font-bold text-ink-soft/75 uppercase tracking-wide">Locataire</p>
                      <p className="text-[13px] font-semibold text-ink">{c.acheteur_nom}</p>
                      <p className="text-[10.5px] text-ink-soft/75">Coordonnées masquées</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-sable rounded-btn p-4 mb-4 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-ink-soft/75 uppercase tracking-wide mb-1">Début</p>
                      <p className="text-[12.5px] font-semibold text-ink">{formatDate(c.date_debut_location)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-ink-soft/75 uppercase tracking-wide mb-1">Aujourd'hui</p>
                      <p className="text-[12.5px] font-semibold text-teal-dark">{formatDate(new Date().toISOString())}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-ink-soft/75 uppercase tracking-wide mb-1">Retour prévu</p>
                      <p className="text-[12.5px] font-semibold text-ink">{formatDate(c.date_fin_location)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-6 flex-wrap">
                      <div>
                        <p className="text-[10px] font-bold text-ink-soft/75 uppercase tracking-wide">Montant location</p>
                        <p className="text-sm font-bold text-ink">{formatFCFA(c.prix_total_paye)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ink-soft/75 uppercase tracking-wide">Caution</p>
                        <p className="text-sm font-bold text-ink">{formatFCFA(c.caution_demandee)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ink-soft/75 uppercase tracking-wide">Paiement</p>
                        <p className={`text-sm font-bold ${c.statut_paiement === 'paye' ? 'text-teal-dark' : 'text-orange'}`}>
                          {c.statut_paiement === 'paye' ? 'Confirmé' : 'En attente'}
                        </p>
                      </div>
                    </div>
                    {enCoursLocation && (
                      <button
                        type="button"
                        disabled={enCours === c.id}
                        onClick={() => marquerRetournee(c)}
                        className="bg-teal hover:bg-teal-dark text-white text-[12.5px] font-bold px-4 py-2.5 rounded-btn transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        Marquer comme retourné
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink uppercase tracking-widest">Fonctionnalités à venir</h3>
          <span className="text-[10px] font-bold text-orange bg-orange/10 px-2.5 py-1 rounded-full">Bientôt disponible</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FONCTIONNALITES_A_VENIR.map((f) => (
            <div key={f.titre} className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-4">
              <p className="text-[13px] font-bold text-ink mb-1">{f.titre}</p>
              <p className="text-[11.5px] text-ink-soft/75 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </ShellVendeuse>
  );
}
