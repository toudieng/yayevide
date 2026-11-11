// frontend/src/pages/MonCompte.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { apiFetch } from '../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD } from '../utils/gradientCards';
import SqueletteTableau from '../components/ui/SqueletteTableau';
import EtatVide from '../components/ui/EtatVide';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateHeure(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUT_INFO = {
  en_attente_confirmation: { label: 'En attente', couleur: 'bg-orange/10 text-orange', point: 'bg-orange' },
  confirme: { label: 'Confirmée', couleur: 'bg-teal/10 text-teal-dark', point: 'bg-teal' },
  indisponible: { label: 'Indisponible', couleur: 'bg-red-50 text-red-500', point: 'bg-red-400' },
  en_cours_livraison: { label: 'En cours de livraison', couleur: 'bg-teal/10 text-teal-dark', point: 'bg-teal' },
  livre: { label: 'Livrée', couleur: 'bg-green-50 text-green-600', point: 'bg-green-500' },
  annule: { label: 'Annulée', couleur: 'bg-line text-ink-soft/75', point: 'bg-ink-soft/40' },
};

const FILTRES_STATUT = [
  { id: 'tous', label: 'Toutes' },
  { id: 'en_attente_confirmation', label: 'En attente' },
  { id: 'confirme', label: 'Confirmée' },
  { id: 'en_cours_livraison', label: 'En cours de livraison' },
  { id: 'livre', label: 'Livrée' },
  { id: 'annule', label: 'Annulée' },
];

const SECTIONS = [
  { id: 'resume', label: 'Résumé', icone: 'M4 4h7v7H4zM13 4h7v7h-7zM13 13h7v7h-7zM4 13h7v7H4z' },
  { id: 'commandes', label: 'Commandes', icone: 'M3 7h18M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2M4 7l1 13a2 2 0 002 2h10a2 2 0 002-2l1-13' },
  { id: 'locations', label: 'Locations', icone: 'M3 4h18v13H3zM8 21h8M12 17v4' },
  { id: 'favoris', label: 'Favoris', icone: 'M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z' },
  { id: 'plaintes', label: 'Centre de plainte', icone: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
  { id: 'notifications', label: 'Notifications', icone: 'M6 9a6 6 0 1 1 12 0v5l2 3H4l2-3V9zM10 20a2 2 0 0 0 4 0' },
];

const PLAINTE_STATUT_INFO = {
  nouvelle: { label: 'Nouvelle', couleur: 'bg-orange/10 text-orange' },
  en_cours: { label: 'En cours de traitement', couleur: 'bg-teal/10 text-teal-dark' },
  resolue: { label: 'Résolue', couleur: 'bg-green-50 text-green-600' },
  rejetee: { label: 'Rejetée', couleur: 'bg-line text-ink-soft/75' },
};

const MODE_PAIEMENT_LABELS = { wave: 'Wave', orange_money: 'Orange Money', especes: 'Espèces' };

function CommandeLigne({ c, onOuvrir }) {
  const statutInfo = STATUT_INFO[c.statut] || STATUT_INFO.annule;
  return (
    <button
      type="button"
      onClick={() => onOuvrir(c)}
      className={`w-full flex items-center gap-4 bg-white rounded-m p-4 ${SHADOW_CARD} hover:-translate-y-0.5 transition-transform text-left`}
    >
      <div className="h-14 w-14 rounded-btn bg-line/40 overflow-hidden shrink-0">
        {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ink truncate">{c.produit_titre}</p>
        <p className="text-[12px] text-ink-soft/75 mt-0.5">
          {formatDate(c.date_commande)} · {c.boutique_nom}
        </p>
      </div>
      <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${statutInfo.couleur}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${statutInfo.point}`} />
        {statutInfo.label}
      </span>
      <p className="text-sm font-bold text-ink whitespace-nowrap">{formatFCFA(c.prix_total_paye)}</p>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-ink-soft/40 shrink-0"><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}

function CommandeDetailModal({ c, onFermer }) {
  if (!c) return null;
  const statutInfo = STATUT_INFO[c.statut] || STATUT_INFO.annule;
  const lignes = [
    { label: 'Boutique', valeur: c.boutique_nom },
    { label: 'Quantité', valeur: c.quantite },
    { label: 'Zone de livraison', valeur: c.zone_livraison_nom },
    { label: 'Adresse', valeur: [c.adresse_livraison, c.complement_adresse].filter(Boolean).join(' — ') || '—' },
    { label: 'Moyen de paiement', valeur: MODE_PAIEMENT_LABELS[c.mode_paiement_choisi] || c.mode_paiement_choisi || '—' },
    { label: 'Frais de livraison', valeur: formatFCFA(c.frais_livraison) },
    ...(c.produit_type_offre === 'location'
      ? [
          { label: 'Début de location', valeur: c.date_debut_location ? formatDate(c.date_debut_location) : '—' },
          { label: 'Fin de location', valeur: c.date_fin_location ? formatDate(c.date_fin_location) : '—' },
          { label: 'Caution demandée', valeur: formatFCFA(c.caution_demandee) },
        ]
      : []),
    { label: 'Commandée le', valeur: formatDateHeure(c.date_commande) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50" onClick={onFermer}>
      <div
        className="bg-white rounded-m shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-6 border-b border-line">
          <div className="h-16 w-16 rounded-btn bg-line/40 overflow-hidden shrink-0">
            {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif font-bold text-lg text-ink leading-snug">{c.produit_titre}</p>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mt-1.5 ${statutInfo.couleur}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statutInfo.point}`} />
              {statutInfo.label}
            </span>
          </div>
          <button type="button" onClick={onFermer} aria-label="Fermer" className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-cream transition-colors shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-3">
          {lignes.map((l) => (
            <div key={l.label} className="flex items-center justify-between gap-4 text-[13.5px]">
              <span className="text-ink-soft/75">{l.label}</span>
              <span className="font-semibold text-ink text-right">{l.valeur}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-line">
            <span className="font-bold text-ink">Total payé</span>
            <span className="font-serif font-bold text-lg text-ink">{formatFCFA(c.prix_total_paye)}</span>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Link
            to={`/produit/${c.produit}`}
            className="flex items-center justify-center gap-2 w-full bg-ink hover:bg-teal text-white font-bold text-sm py-3 rounded-full transition-colors"
          >
            Voir le produit
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MonCompte() {
  const navigate = useNavigate();
  const [moi, setMoi] = useState(null);
  const [section, setSection] = useState('resume');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [commandes, setCommandes] = useState([]);
  const [favoris, setFavoris] = useState([]);
  const [plaintes, setPlaintes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formPlainte, setFormPlainte] = useState({ commande: '', sujet: '', description: '' });
  const [envoiPlainteEnCours, setEnvoiPlainteEnCours] = useState(false);
  const [messagePlainte, setMessagePlainte] = useState(null);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);

  useEffect(() => {
    apiFetch('/moi/')
      .then((res) => {
        if (!res.ok) {
          navigate('/connexion', { state: { from: '/mon-compte' } });
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setMoi(data);
        Promise.all([
          apiFetch('/mes-commandes/').then((r) => (r.ok ? r.json() : [])),
          apiFetch('/mes-favoris/').then((r) => (r.ok ? r.json() : [])),
          apiFetch('/mes-plaintes/').then((r) => (r.ok ? r.json() : [])),
        ]).then(([cmds, favs, plts]) => {
          setCommandes(cmds);
          setFavoris(favs);
          setPlaintes(plts);
          setChargement(false);
        });
      })
      .catch(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commandesFiltrees = useMemo(
    () => (filtreStatut === 'tous' ? commandes : commandes.filter((c) => c.statut === filtreStatut)),
    [commandes, filtreStatut]
  );

  const activiteRecente = useMemo(() => {
    const evenements = [];
    commandes.forEach((c) => {
      evenements.push({ date: c.date_commande, texte: `Commande passée — ${c.produit_titre}`, type: 'commande', image: c.produit_image });
      if (c.date_paiement) {
        evenements.push({ date: c.date_paiement, texte: `Livrée et payée — ${c.produit_titre}`, type: 'livraison', image: c.produit_image });
      }
    });
    return evenements.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [commandes]);

  const soumettrePlainte = async (e) => {
    e.preventDefault();
    setEnvoiPlainteEnCours(true);
    setMessagePlainte(null);
    const res = await apiFetch('/mes-plaintes/', {
      method: 'POST',
      body: {
        commande: formPlainte.commande || null,
        sujet: formPlainte.sujet,
        description: formPlainte.description,
      },
    });
    if (res.ok) {
      const nouvellePlainte = await res.json();
      setPlaintes((prev) => [nouvellePlainte, ...prev]);
      setFormPlainte({ commande: '', sujet: '', description: '' });
      setMessagePlainte({ type: 'succes', texte: 'Votre plainte a bien été transmise à notre équipe.' });
    } else {
      setMessagePlainte({ type: 'erreur', texte: "Impossible d'envoyer la plainte pour le moment." });
    }
    setEnvoiPlainteEnCours(false);
  };

  const seDeconnecter = async () => {
    await apiFetch('/deconnexion/', { method: 'POST' }).catch(() => {});
    navigate('/');
  };

  if (chargement || !moi) {
    return (
      <Layout>
        <SqueletteTableau sansMenu />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">

          <aside className={`md:bg-white md:rounded-m md:${SHADOW_CARD} md:p-5`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-full bg-teal text-white font-serif text-lg font-bold flex items-center justify-center shrink-0">
                {(moi.first_name || moi.username).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink truncate">{moi.first_name || moi.username}</p>
                <p className="text-[11.5px] text-ink-soft/75 truncate">{moi.username}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-btn text-[13.5px] font-semibold transition-colors ${
                    section === s.id ? 'bg-teal/10 text-teal-dark' : 'text-ink-soft/75 hover:bg-cream hover:text-ink'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 shrink-0">
                    <path d={s.icone} />
                  </svg>
                  {s.label}
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={seDeconnecter}
              className="mt-6 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-btn text-[13.5px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Se déconnecter
            </button>
          </aside>

          <div>

            {section === 'resume' && (
              <div className="space-y-8">
                <div>
                  <h1 className="font-impact font-extrabold text-2xl text-ink">Bonjour {moi.first_name || moi.username} 👋</h1>
                  <p className="text-[13px] text-ink-soft/75 mt-1">Voici un aperçu de votre activité sur Yaay Vidé.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Commandes', valeur: commandes.length, icone: 'bag', cible: 'commandes', lien: 'Voir mes commandes' },
                    { label: 'En cours', valeur: commandes.filter((c) => ['en_attente_confirmation', 'confirme', 'en_cours_livraison'].includes(c.statut)).length, icone: 'truck', cible: 'commandes', lien: 'Voir en cours' },
                    { label: 'Livrées', valeur: commandes.filter((c) => c.statut === 'livre').length, icone: 'package', cible: 'commandes', lien: 'Voir mes livraisons' },
                    { label: 'Favoris', valeur: favoris.length, icone: 'coeur', cible: 'favoris', lien: 'Voir mes favoris' },
                  ].map((s, i) => {
                    const g = GRADIENT_CARDS[i % GRADIENT_CARDS.length];
                    return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setSection(s.cible)}
                      className={`text-left ${g.bg} rounded-m ${SHADOW_CARD} p-5 hover:-translate-y-0.5 transition-transform`}
                    >
                      <span className={`h-10 w-10 rounded-full flex items-center justify-center mb-4 ${g.iconBg} ${g.iconColor}`}>
                        {s.icone === 'bag' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>}
                        {s.icone === 'truck' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M2 8h11v8H2zM13 11h4l3 3v2h-7z" /><circle cx="6.5" cy="18.5" r="1.6" /><circle cx="17.5" cy="18.5" r="1.6" /></svg>}
                        {s.icone === 'package' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></svg>}
                        {s.icone === 'coeur' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z" /></svg>}
                      </span>
                      <p className={`text-2xl font-serif font-bold ${g.text}`}>{s.valeur}</p>
                      <p className={`text-[12.5px] mt-0.5 ${g.label}`}>{s.label}</p>
                      <p className={`text-[11.5px] font-bold mt-2.5 flex items-center gap-1 ${g.iconColor}`}>
                        {s.lien}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3 w-3"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </p>
                    </button>
                    );
                  })}
                </div>

                <div className={`bg-white rounded-m ${SHADOW_CARD} p-6`}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold text-ink flex items-center gap-2.5">
                      <span className="h-8 w-8 rounded-full bg-teal/10 text-teal-dark flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                      </span>
                      Activité récente
                    </h2>
                    {activiteRecente.length > 0 && (
                      <button type="button" onClick={() => setSection('commandes')} className="text-[12px] font-bold text-teal-dark flex items-center gap-1 hover:underline">
                        Tout voir
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3 w-3"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </button>
                    )}
                  </div>
                  {activiteRecente.length === 0 ? (
                    <p className="text-ink-soft/75 text-sm text-center py-6">Rien à afficher pour le moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {activiteRecente.map((e, i) => (
                        <div key={i} className="flex items-center gap-3.5">
                          <div className="h-11 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                            {e.image && <img loading="lazy" decoding="async" src={e.image} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <span className={`h-2 w-2 rounded-full shrink-0 ${e.type === 'livraison' ? 'bg-teal' : 'bg-orange'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-ink font-medium truncate">{e.texte}</p>
                            <p className="text-[11px] text-ink-soft/75">{formatDateHeure(e.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === 'commandes' && (
              <div>
                <h1 className="font-impact font-extrabold text-2xl text-ink mb-5">Commandes</h1>

                <div className="flex flex-wrap gap-2 mb-6">
                  {FILTRES_STATUT.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFiltreStatut(f.id)}
                      className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
                        filtreStatut === f.id ? 'bg-ink text-cream' : 'bg-cream text-ink-soft/75 hover:bg-line/60'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {commandesFiltrees.length === 0 ? (
                  <div className={`bg-white rounded-m ${SHADOW_CARD} p-14 text-center`}>
                    <EtatVide compact bordure={false} icone="panier" texte="Aucune commande dans cette catégorie." className="mb-2" />
                    <Link to="/boutique" className="text-teal-dark font-semibold text-sm hover:underline">
                      Découvrir la boutique
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commandesFiltrees.map((c) => <CommandeLigne key={c.id} c={c} onOuvrir={setCommandeSelectionnee} />)}
                  </div>
                )}
              </div>
            )}

            {section === 'locations' && (
              <div>
                <h1 className="font-impact font-extrabold text-2xl text-ink mb-5">Locations</h1>
                <div className={`bg-white rounded-m ${SHADOW_CARD} p-14 text-center`}>
                  <p className="text-ink-soft/75 text-sm">
                    Les demandes de location se font pour l'instant directement par WhatsApp avec la vendeuse — un historique dédié arrivera bientôt ici.
                  </p>
                </div>
              </div>
            )}

            {section === 'favoris' && (
              <div>
                <h1 className="font-impact font-extrabold text-2xl text-ink mb-5">Favoris</h1>
                {favoris.length === 0 ? (
                  <div className={`bg-white rounded-m ${SHADOW_CARD} p-14 text-center`}>
                    <EtatVide compact bordure={false} icone="coeur" texte="Aucun article mis de côté pour le moment." className="mb-2" />
                    <Link to="/boutique" className="text-teal-dark font-semibold text-sm hover:underline">
                      Découvrir la boutique
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    {favoris.map((f) => (
                      <Link
                        key={f.id}
                        to={`/produit/${f.produit_detail.id}`}
                        className={`flex items-center gap-3 bg-white rounded-m p-3 ${SHADOW_CARD} hover:-translate-y-0.5 transition-transform`}
                      >
                        <div className="h-12 w-12 rounded-btn bg-line/40 overflow-hidden shrink-0">
                          {f.produit_detail.image_principale && (
                            <img loading="lazy" decoding="async" src={f.produit_detail.image_principale} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink truncate">{f.produit_detail.titre}</p>
                          <p className="text-[12px] text-ink-soft/75">{formatFCFA(f.produit_detail.prix_final_public)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === 'plaintes' && (
              <div className="space-y-8">
                <div>
                  <h1 className="font-impact font-extrabold text-2xl text-ink mb-2">Centre de plainte</h1>
                  <p className="text-[13px] text-ink-soft/75 max-w-lg">
                    Les ventes étant fermes et définitives, ceci n'est pas un formulaire de remboursement — mais toute plainte est examinée individuellement par notre équipe.
                  </p>
                </div>

                {messagePlainte && (
                  <div className={`p-4 text-sm rounded-btn border ${
                    messagePlainte.type === 'succes' ? 'bg-teal/10 text-teal-dark border-teal/20' : 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {messagePlainte.texte}
                  </div>
                )}

                <form onSubmit={soumettrePlainte} className={`bg-white rounded-m p-6 space-y-4 ${SHADOW_CARD}`}>
                  <h3 className="font-serif text-lg text-ink">Déposer une plainte</h3>

                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
                      Commande concernée <span className="font-normal normal-case text-ink-soft/75">(facultatif)</span>
                    </label>
                    <select
                      value={formPlainte.commande}
                      onChange={(e) => setFormPlainte({ ...formPlainte, commande: e.target.value })}
                      className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                    >
                      <option value="">Aucune commande précise</option>
                      {commandes.map((c) => (
                        <option key={c.id} value={c.id}>{c.produit_titre} — {formatDate(c.date_commande)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Sujet *</label>
                    <input
                      type="text" required
                      value={formPlainte.sujet}
                      onChange={(e) => setFormPlainte({ ...formPlainte, sujet: e.target.value })}
                      placeholder="Ex: Article non conforme à la description"
                      className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Description *</label>
                    <textarea
                      required rows={4}
                      value={formPlainte.description}
                      onChange={(e) => setFormPlainte({ ...formPlainte, description: e.target.value })}
                      placeholder="Décrivez le problème rencontré..."
                      className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={envoiPlainteEnCours}
                    className="bg-ink hover:bg-teal text-white px-6 py-3 rounded-btn text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {envoiPlainteEnCours ? 'Envoi...' : 'Envoyer la plainte'}
                  </button>
                </form>

                <div>
                  <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Mes plaintes ({plaintes.length})</h3>
                  {plaintes.length === 0 ? (
                    <div className={`bg-white rounded-m ${SHADOW_CARD} p-10 text-center`}>
                      <EtatVide compact bordure={false} icone="message" texte="Aucune plainte déposée pour le moment." />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plaintes.map((p) => {
                        const statutInfo = PLAINTE_STATUT_INFO[p.statut] || PLAINTE_STATUT_INFO.nouvelle;
                        return (
                          <div key={p.id} className={`bg-white rounded-m p-5 ${SHADOW_CARD}`}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="text-sm font-semibold text-ink">{p.sujet}</p>
                                <p className="text-[11.5px] text-ink-soft/75 mt-0.5">
                                  {formatDate(p.date_creation)}{p.commande_produit_titre && ` · ${p.commande_produit_titre}`}
                                </p>
                              </div>
                              <span className={`text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${statutInfo.couleur}`}>
                                {statutInfo.label}
                              </span>
                            </div>
                            <p className="text-[13px] text-ink-soft leading-relaxed">{p.description}</p>
                            {p.reponse_admin && (
                              <div className="bg-sable rounded-btn p-3.5 mt-3">
                                <p className="text-[11px] font-bold text-teal-dark uppercase tracking-wide mb-1">Réponse de Yaay Vidé</p>
                                <p className="text-[13px] text-ink-soft">{p.reponse_admin}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === 'notifications' && (
              <div>
                <h1 className="font-impact font-extrabold text-2xl text-ink mb-5">Notifications</h1>
                <div className={`bg-white rounded-m ${SHADOW_CARD} p-14 text-center`}>
                  <p className="text-ink-soft/75 text-sm">
                    Pas encore de notifications actives — cette fonctionnalité arrive bientôt.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <CommandeDetailModal c={commandeSelectionnee} onFermer={() => setCommandeSelectionnee(null)} />
    </Layout>
  );
}
