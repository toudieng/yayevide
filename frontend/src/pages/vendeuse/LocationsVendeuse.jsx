// frontend/src/pages/vendeuse/LocationsVendeuse.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShellVendeuse from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';
import { ETAPES_LOCATION } from '../../components/location/statutsLocation';
import { ajouterJoursISO, dansJoursISO, formatJour, joursEntre } from '../../utils/dates';

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

const demandeEnAttente = (c) =>
  c.statut === 'en_attente_confirmation' || (c.statut === 'livre' && c.prolongation_statut === 'demandee');

const ONGLETS = [
  { id: 'toutes', label: 'Toutes', test: () => true },
  { id: 'demandes', label: 'À traiter', test: demandeEnAttente },
  { id: 'a_venir', label: 'À venir', test: (c) => ['contre_proposition', 'confirme'].includes(c.statut) },
  { id: 'en_cours', label: 'En cours', test: (c) => ['en_cours_livraison', 'livre'].includes(c.statut) },
  { id: 'retours', label: 'Retours', test: (c) => ['retour_a_collecter', 'retour_en_cours', 'retour_controle'].includes(c.statut) },
  { id: 'terminees', label: 'Terminées', test: (c) => c.statut === 'terminee' },
];

/** Actions de la vendeuse selon l'étape (accepter, refuser, proposer
 *  d'autres dates, répondre à une prolongation). */
function ActionsLocation({ c, onMaj }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [proposer, setProposer] = useState(false);
  const [debut, setDebut] = useState(c.date_debut_location || '');
  const [fin, setFin] = useState(c.date_fin_location || '');

  const appeler = async (url, methode, body) => {
    setEnCours(true);
    setErreur('');
    try {
      const res = await apiFetch(url, { method: methode, body });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onMaj(data);
        setProposer(false);
      } else {
        setErreur(data.dates || data.general || 'Une erreur est survenue. Réessayez.');
      }
    } catch {
      setErreur('Impossible de joindre le serveur.');
    }
    setEnCours(false);
  };

  const bouton = 'min-h-[40px] px-4 rounded-btn text-[13px] font-bold transition-colors disabled:opacity-50';
  const champ = 'px-3 py-2 bg-sable border border-line rounded-btn text-[16px] sm:text-[13px] focus:outline-none focus:border-teal';

  if (c.statut === 'en_attente_confirmation') {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-ink">
          Dates demandées : <strong>du {formatJour(c.date_debut_location)} au {formatJour(c.date_fin_location)}</strong> — ces dates vous conviennent ?
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={enCours} onClick={() => appeler(`/commandes/${c.id}/confirmer-disponibilite/`, 'PATCH', { disponible: true })} className={`${bouton} bg-clay-dark text-white hover:bg-ink`}>
            Accepter
          </button>
          <button type="button" disabled={enCours} onClick={() => setProposer((v) => !v)} aria-expanded={proposer} className={`${bouton} bg-ink text-white hover:bg-teal-dark`}>
            Proposer d'autres dates
          </button>
          <button type="button" disabled={enCours} onClick={() => appeler(`/commandes/${c.id}/confirmer-disponibilite/`, 'PATCH', { disponible: false })} className={`${bouton} border border-ink/20 text-ink hover:border-ink`}>
            Refuser
          </button>
        </div>
        {proposer && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              appeler(`/locations/${c.id}/contre-proposition/`, 'POST', { date_debut: debut, date_fin: fin });
            }}
            className="flex flex-wrap items-end gap-2 rounded-btn bg-sable/70 border border-line p-3"
          >
            <div>
              <label htmlFor={`deb-${c.id}`} className="block text-[12px] font-semibold text-ink mb-1">Du</label>
              <input id={`deb-${c.id}`} type="date" required min={dansJoursISO(1)} value={debut} onChange={(e) => setDebut(e.target.value)} className={champ} />
            </div>
            <div>
              <label htmlFor={`fin-${c.id}`} className="block text-[12px] font-semibold text-ink mb-1">Au</label>
              <input id={`fin-${c.id}`} type="date" required min={debut ? ajouterJoursISO(debut, 1) : dansJoursISO(2)} value={fin} onChange={(e) => setFin(e.target.value)} className={champ} />
            </div>
            <button type="submit" disabled={enCours} className={`${bouton} bg-clay-dark text-white hover:bg-ink`}>
              Envoyer la proposition
            </button>
            <p className="basis-full text-[12px] text-ink-soft">La locataire est prévenue et accepte ou refuse. Si elle refuse, l'article redevient disponible.</p>
          </form>
        )}
        {erreur && <p className="text-[13px] text-red-700" role="alert">{erreur}</p>}
      </div>
    );
  }

  if (c.statut === 'contre_proposition') {
    return (
      <p className="text-[13px] text-ink">
        Vous avez proposé <strong>du {formatJour(c.date_debut_proposee)} au {formatJour(c.date_fin_proposee)}</strong> : en attente de la réponse de la locataire.
      </p>
    );
  }

  if (c.statut === 'livre' && c.prolongation_statut === 'demandee') {
    const jours = joursEntre(c.date_fin_location, c.prolongation_date_fin);
    return (
      <div className="space-y-3 rounded-btn bg-peche/70 border border-orange/20 p-3.5">
        <p className="text-[13.5px] text-ink">
          <strong>Demande de prolongation</strong> jusqu'au {formatJour(c.prolongation_date_fin)} (+{jours} jour{jours > 1 ? 's' : ''},
          {' '}soit {formatFCFA(c.produit_prix_jour * jours)} encaissés au retour).
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={enCours} onClick={() => appeler(`/locations/${c.id}/prolongation/reponse/`, 'POST', { accepter: true })} className={`${bouton} bg-clay-dark text-white hover:bg-ink`}>
            Accepter la prolongation
          </button>
          <button type="button" disabled={enCours} onClick={() => appeler(`/locations/${c.id}/prolongation/reponse/`, 'POST', { accepter: false })} className={`${bouton} border border-ink/20 text-ink hover:border-ink`}>
            Refuser
          </button>
        </div>
        {erreur && <p className="text-[13px] text-red-700" role="alert">{erreur}</p>}
      </div>
    );
  }

  const infos = {
    confirme: 'Location confirmée : Yaay Vidé organise la livraison.',
    en_cours_livraison: "L'article est en cours de livraison chez la locataire.",
    livre: "Location en cours. À la date de fin, Yaay Vidé récupère l'article.",
    retour_a_collecter: 'Location terminée : un livreur va récupérer l\'article.',
    retour_en_cours: "L'article revient chez Yaay Vidé pour être contrôlé.",
    retour_controle: "L'article est contrôlé chez Yaay Vidé avant de vous être rendu.",
  };
  if (infos[c.statut]) return <p className="text-[13px] text-ink-soft">{infos[c.statut]}</p>;
  if (c.statut === 'terminee' && Number(c.caution_retenue) > 0) {
    return <p className="text-[13px] text-ink-soft">Caution partiellement retenue ({formatFCFA(c.caution_retenue)}) : {c.motif_retenue}</p>;
  }
  return null;
}

export default function LocationsVendeuse() {
  const { moi, chargementSession } = useVendeuseSession();

  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [onglet, setOnglet] = useState('toutes');
  const [recherche, setRecherche] = useState('');

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
      demandes: commandes.filter(demandeEnAttente).length,
      revenus: commandes
        .filter((c) => c.statut_paiement === 'paye' && new Date(c.date_paiement || c.date_commande).getMonth() === maintenant.getMonth())
        .reduce((s, c) => s + Number(c.montant_net_vendeuse || 0), 0),
    };
  }, [commandes]);

  const commandesFiltrees = useMemo(() => {
    const test = ONGLETS.find((o) => o.id === onglet)?.test || (() => true);
    return commandes.filter(test).filter((c) => !recherche || c.produit_titre.toLowerCase().includes(recherche.toLowerCase()));
  }, [commandes, onglet, recherche]);

  const majCommande = (maj) => setCommandes((prev) => prev.map((c) => (c.id === maj.id ? { ...c, ...maj } : c)));

  if (chargementSession || chargement) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellVendeuse active="locations" moi={moi} titre="Locations">

      <div className="flex items-start justify-between gap-4 flex-wrap -mt-2">
        <p className="text-[13px] text-ink-soft/75">Suivez les locations en toute sécurité : les échanges passent par la modération Yaay Vidé.</p>
        <Link
          to="/vendeuse/ajouter-produit"
          className="bg-clay-dark hover:bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-btn transition-colors shrink-0 whitespace-nowrap"
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
          { label: 'À traiter', valeur: stats.demandes, note: 'Demandes et prolongations' },
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
                onglet === o.id ? 'bg-teal-dark text-white' : 'text-ink-soft/75 hover:text-ink'
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
          <div className={`bg-white rounded-m ${SHADOW_CARD} p-14 text-center`}>
            <EtatVide compact bordure={false} icone="boite" texte="Aucune location dans cette catégorie pour le moment." className="mb-2" />
            <Link to="/vendeuse/ajouter-produit" className="text-teal-dark font-semibold text-sm hover:underline">
              Ajouter un article à louer
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {commandesFiltrees.map((c) => {
              const st = ETAPES_LOCATION[c.statut] || ETAPES_LOCATION.annule;
              const restants = joursRestants(c.date_fin_location);
              const enCoursLocation = ['en_cours_livraison', 'livre'].includes(c.statut);
              return (
                <div key={c.id} className={`bg-white rounded-m ${SHADOW_CARD} p-5`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-12 w-12 rounded-btn bg-line/40 overflow-hidden shrink-0">
                        {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st.couleur}`}>{st.label}</span>
                          {enCoursLocation && restants !== null && restants >= 0 && (
                            <span className="text-[10.5px] font-bold text-clay-dark">Retour dans {restants} jour{restants > 1 ? 's' : ''}</span>
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

                  <div className="mb-4">
                    <ActionsLocation c={c} onMaj={majCommande} />
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
                        <p className={`text-sm font-bold ${c.statut_paiement === 'paye' ? 'text-teal-dark' : 'text-clay-dark'}`}>
                          {c.statut_paiement === 'paye' ? 'Confirmé' : 'En attente'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </ShellVendeuse>
  );
}
