// frontend/src/pages/Messages.jsx
// Messagerie acheteuse <-> vendeuse.
//  - /messages                 liste des conversations (+ fil sur ordinateur)
//  - /messages?c=<id>          conversation ouverte
//  - /messages?produit=<id>    depuis une fiche produit : ouvre la conversation
//                              avec la vendeuse, article joint et message
//                              prérempli, prêt à être envoyé (rien n'est
//                              envoyé automatiquement).
// Mise à jour par interrogation régulière de l'API (pas de dépendance) :
// fil ouvert toutes les 4 s, liste toutes les 15 s, uniquement onglet visible.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import EtatVide from '../components/ui/EtatVide';
import { apiFetch } from '../utils/api';
import { formatFCFA } from '../utils/produit';
import { EVENEMENT_MESSAGES_LUS } from '../hooks/useMessagesNonLus';

const LONGUEUR_MAX = 2000;

function initiale(nom) {
  return (nom || '?').trim().charAt(0).toUpperCase();
}

function heure(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function dateCourte(iso) {
  const d = new Date(iso);
  const auj = new Date();
  const hier = new Date();
  hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === auj.toDateString()) return heure(iso);
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function libelleJour(iso) {
  const d = new Date(iso);
  const auj = new Date();
  const hier = new Date();
  hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === auj.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function messagePrerempli(produit) {
  if (!produit) return '';
  return produit.type_offre === 'location'
    ? `Bonjour ! Votre article « ${produit.titre} » m'intéresse, je souhaiterais le louer. Est-il disponible ?`
    : `Bonjour ! Votre article « ${produit.titre} » m'intéresse. Est-il toujours disponible ?`;
}

function Avatar({ nom, role, taille = 'h-11 w-11 text-[15px]' }) {
  return (
    <span
      className={`${taille} shrink-0 rounded-full flex items-center justify-center font-bold text-white ${
        role === 'vendeur' ? 'bg-clay-dark' : 'bg-teal-dark'
      }`}
      aria-hidden="true"
    >
      {initiale(nom)}
    </span>
  );
}

function CarteProduit({ produit, surFondFonce }) {
  return (
    <Link
      to={`/produit/${produit.id}`}
      className={`mt-2 flex items-center gap-3 rounded-btn p-2 pr-3 transition-colors ${
        surFondFonce ? 'bg-white/15 hover:bg-white/25' : 'bg-white border border-line hover:border-teal'
      }`}
    >
      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-line/40">
        {produit.image && <img src={produit.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-[13px] font-semibold ${surFondFonce ? 'text-white' : 'text-ink'}`}>
          {produit.titre}
        </span>
        <span className={`block text-[12px] font-bold ${surFondFonce ? 'text-white/85' : 'text-clay-dark'}`}>
          {formatFCFA(produit.prix)}
          {produit.type_offre === 'location' && ' / jour'}
          <span className={`font-semibold underline underline-offset-2 ml-2 ${surFondFonce ? 'text-white' : 'text-ink'}`}>
            Voir l'article
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const idActif = Number(params.get('c')) || null;
  const produitAOuvrir = params.get('produit');

  const [conversations, setConversations] = useState([]);
  const [chargementListe, setChargementListe] = useState(true);
  const [recherche, setRecherche] = useState('');
  // `id` = conversation à laquelle appartient le fil chargé : tant qu'il
  // diffère de idActif, on affiche l'état de chargement (pas de remise à
  // zéro synchrone dans un effet).
  const [filCharge, setFil] = useState({ id: null, conversation: null, messages: [] });
  const [brouillon, setBrouillon] = useState('');
  const [produitJoint, setProduitJoint] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const zoneMessagesRef = useRef(null);
  const champRef = useRef(null);
  const auBasRef = useRef(true);

  const versConnexion = useCallback(() => {
    navigate('/connexion', { state: { from: `${location.pathname}${location.search}` } });
  }, [navigate, location.pathname, location.search]);

  // --- Liste des conversations ------------------------------------------------
  const chargerListe = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await apiFetch('/messagerie/conversations/');
      if (res.status === 401 || res.status === 403) return versConnexion();
      if (res.ok) setConversations(await res.json());
    } catch {
      // réseau momentanément indisponible : on réessaiera au prochain tour
    } finally {
      setChargementListe(false);
    }
    return undefined;
  }, [versConnexion]);

  useEffect(() => {
    const premier = setTimeout(chargerListe, 0);
    const t = setInterval(chargerListe, 15000);
    return () => {
      clearTimeout(premier);
      clearInterval(t);
    };
  }, [chargerListe]);

  // --- Ouverture depuis une fiche produit (?produit=<id>) ----------------------
  useEffect(() => {
    if (!produitAOuvrir) return;
    let annule = false;
    (async () => {
      try {
        const res = await apiFetch('/messagerie/conversations/', {
          method: 'POST',
          body: { produit_id: Number(produitAOuvrir) },
        });
        if (res.status === 401 || res.status === 403) return versConnexion();
        const data = await res.json().catch(() => ({}));
        if (annule) return undefined;
        if (!res.ok) {
          setErreur(data.general || "Impossible d'ouvrir la conversation.");
          setParams({}, { replace: true });
          return undefined;
        }
        setProduitJoint(data.produit);
        setBrouillon(messagePrerempli(data.produit));
        setParams({ c: String(data.id) }, { replace: true });
        setTimeout(() => champRef.current?.focus(), 50);
      } catch {
        setErreur('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }
      return undefined;
    })();
    return () => {
      annule = true;
    };
  }, [produitAOuvrir, setParams, versConnexion]);

  // --- Fil de la conversation ouverte ------------------------------------------
  const dernierIdRef = useRef(0);

  const chargerFil = useCallback(
    async (complet) => {
      if (!idActif || (!complet && document.hidden)) return;
      const apres = complet ? '' : `?apres=${dernierIdRef.current}`;
      try {
        const res = await apiFetch(`/messagerie/conversations/${idActif}/${apres}`);
        if (res.status === 401 || res.status === 403) return versConnexion();
        if (res.status === 404) {
          setErreur("Cette conversation n'existe pas ou ne vous concerne pas.");
          setParams({}, { replace: true });
          return undefined;
        }
        if (!res.ok) return undefined;
        const data = await res.json();
        const lus = new Set(data.mes_messages_lus || []);
        setFil((prec) => {
          const base = complet || prec.id !== idActif ? [] : prec.messages;
          const connus = new Set(base.map((m) => m.id));
          const messages = [...base, ...data.messages.filter((m) => !connus.has(m.id))].map((m) =>
            m.de_moi ? { ...m, lu: lus.has(m.id) } : m,
          );
          if (messages.length) dernierIdRef.current = messages[messages.length - 1].id;
          return { id: idActif, conversation: data.conversation, messages };
        });
        if (data.messages.some((m) => !m.de_moi)) {
          window.dispatchEvent(new Event(EVENEMENT_MESSAGES_LUS));
          setConversations((liste) => liste.map((c) => (c.id === idActif ? { ...c, non_lus: 0 } : c)));
        }
      } catch {
        // on réessaiera au prochain tour
      }
      return undefined;
    },
    [idActif, setParams, versConnexion],
  );

  useEffect(() => {
    if (!idActif) return undefined;
    dernierIdRef.current = 0;
    auBasRef.current = true;
    const premier = setTimeout(() => chargerFil(true), 0);
    const t = setInterval(() => chargerFil(false), 4000);
    return () => {
      clearTimeout(premier);
      clearInterval(t);
    };
  }, [idActif, chargerFil]);

  const fil = filCharge.id === idActif ? filCharge : { conversation: null, messages: [] };
  const chargementFil = Boolean(idActif) && filCharge.id !== idActif;

  // Défile en bas à l'arrivée de messages, sauf si l'on relit plus haut
  useEffect(() => {
    const zone = zoneMessagesRef.current;
    if (zone && auBasRef.current) zone.scrollTop = zone.scrollHeight;
  }, [fil.messages.length, idActif]);

  const surDefilement = () => {
    const zone = zoneMessagesRef.current;
    if (zone) auBasRef.current = zone.scrollHeight - zone.scrollTop - zone.clientHeight < 80;
  };

  // --- Envoi ---------------------------------------------------------------------
  const envoyer = async (e) => {
    e?.preventDefault();
    const texte = brouillon.trim();
    if (!texte || envoi || !idActif) return;
    setEnvoi(true);
    setErreur('');
    try {
      const res = await apiFetch(`/messagerie/conversations/${idActif}/`, {
        method: 'POST',
        body: { texte, produit_id: produitJoint?.id },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        auBasRef.current = true;
        setFil((prec) => ({ ...prec, id: idActif, messages: [...(prec.id === idActif ? prec.messages : []), data] }));
        dernierIdRef.current = data.id;
        setBrouillon('');
        setProduitJoint(null);
        chargerListe();
      } else {
        setErreur(data.texte || data.general || "Le message n'a pas pu être envoyé. Réessayez.");
      }
    } catch {
      setErreur('Impossible de joindre le serveur. Votre message est conservé, réessayez.');
    }
    setEnvoi(false);
    champRef.current?.focus();
  };

  const surToucheChamp = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      envoyer();
    }
  };

  // Hauteur automatique du champ (jusqu'à ~5 lignes)
  useEffect(() => {
    const champ = champRef.current;
    if (!champ) return;
    champ.style.height = 'auto';
    champ.style.height = `${Math.min(champ.scrollHeight, 140)}px`;
  }, [brouillon]);

  const ouvrir = (id) => {
    setErreur('');
    if (id !== idActif) {
      setBrouillon('');
      setProduitJoint(null);
    }
    setParams({ c: String(id) });
  };

  const conversationsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return q ? conversations.filter((c) => c.interlocuteur.nom.toLowerCase().includes(q)) : conversations;
  }, [conversations, recherche]);

  // Regroupe les messages par jour pour les séparateurs
  const messagesParJour = useMemo(() => {
    const groupes = [];
    fil.messages.forEach((m) => {
      const jour = new Date(m.envoye_le).toDateString();
      const dernier = groupes[groupes.length - 1];
      if (dernier && dernier.jour === jour) dernier.messages.push(m);
      else groupes.push({ jour, libelle: libelleJour(m.envoye_le), messages: [m] });
    });
    return groupes;
  }, [fil.messages]);

  const dernierDeMoiId = [...fil.messages].reverse().find((m) => m.de_moi)?.id;
  const interlocuteur = fil.conversation?.interlocuteur;

  return (
    <Layout>
      <div className="mx-auto max-w-[1180px] px-0 sm:px-6 md:px-12 py-0 sm:py-8">
        <div className="h-[calc(100dvh-150px)] sm:h-[calc(100dvh-230px)] min-h-[480px] bg-white sm:rounded-m border-y sm:border border-line shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] overflow-hidden grid grid-cols-[minmax(0,1fr)] md:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* ---------------- Liste des conversations ---------------- */}
          <aside className={`${idActif ? 'hidden md:flex' : 'flex'} flex-col min-h-0 min-w-0 border-r border-line`}>
            <div className="px-4 sm:px-5 pt-5 pb-3 border-b border-line">
              <h1 className="font-impact font-extrabold text-[24px] text-ink">Messages</h1>
              {erreur && !idActif && (
                <p className="md:hidden mt-2 text-[13px] text-red-700" role="alert">{erreur}</p>
              )}
              <label htmlFor="recherche-conv" className="sr-only">Rechercher une conversation</label>
              <input
                id="recherche-conv"
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une personne…"
                className="mt-3 w-full px-4 py-2.5 bg-sable border border-line rounded-full text-[16px] sm:text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {chargementListe ? (
                <div className="p-4 space-y-4" aria-busy="true" aria-label="Chargement des conversations">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-line/50 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded bg-line/50 animate-pulse" />
                        <div className="h-3 w-3/4 rounded bg-line/40 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversationsFiltrees.length === 0 ? (
                <EtatVide
                  compact
                  bordure={false}
                  icone="message"
                  titre={recherche ? 'Aucun résultat' : 'Aucune conversation'}
                  texte={
                    recherche
                      ? 'Aucune conversation ne correspond à cette recherche.'
                      : "Un article vous plaît ? Sur sa fiche, cliquez sur « Contacter la vendeuse » pour lui écrire."
                  }
                  action={
                    !recherche && (
                      <Link to="/boutique" className="inline-flex items-center min-h-[44px] px-5 rounded-full bg-clay-dark text-white text-sm font-bold hover:bg-ink transition-colors">
                        Parcourir la boutique
                      </Link>
                    )
                  }
                  className="mt-6"
                />
              ) : (
                <ul>
                  {conversationsFiltrees.map((c) => {
                    const actif = c.id === idActif;
                    const dernier = c.dernier_message;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => ouvrir(c.id)}
                          aria-current={actif ? 'true' : undefined}
                          className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left border-b border-line/60 transition-colors ${
                            actif ? 'bg-teal/10' : 'hover:bg-sable'
                          }`}
                        >
                          <Avatar nom={c.interlocuteur.nom} role={c.interlocuteur.role} />
                          <span className="flex-1 min-w-0">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className={`truncate text-[14.5px] ${c.non_lus ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
                                {c.interlocuteur.nom}
                              </span>
                              {dernier && <span className="shrink-0 text-[11.5px] text-ink-soft/75">{dateCourte(dernier.envoye_le)}</span>}
                            </span>
                            <span className="flex items-center justify-between gap-2 mt-0.5">
                              <span className={`truncate text-[13px] ${c.non_lus ? 'text-ink font-semibold' : 'text-ink-soft/75'}`}>
                                {dernier ? `${dernier.de_moi ? 'Vous : ' : ''}${dernier.texte}` : ''}
                              </span>
                              {c.non_lus > 0 && (
                                <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-teal-dark text-white text-[11px] font-bold flex items-center justify-center">
                                  {c.non_lus}
                                  <span className="sr-only"> message{c.non_lus > 1 ? 's' : ''} non lu{c.non_lus > 1 ? 's' : ''}</span>
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* ---------------- Fil de discussion ---------------- */}
          <section className={`${idActif ? 'flex' : 'hidden md:flex'} flex-col min-h-0 min-w-0 bg-creme/60`} aria-label="Conversation">
            {!idActif ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                {erreur && (
                  <p className="max-w-md text-center text-[13.5px] text-red-700 bg-red-50 border border-red-100 rounded-btn px-4 py-3" role="alert">
                    {erreur}
                  </p>
                )}
                <EtatVide
                  bordure={false}
                  icone="message"
                  titre="Vos échanges, au même endroit"
                  texte="Choisissez une conversation à gauche pour lire et répondre à vos messages."
                />
              </div>
            ) : (
              <>
                {/* En-tête */}
                <header className="flex items-center gap-3 px-3 sm:px-5 py-3 bg-white border-b border-line">
                  <button
                    type="button"
                    onClick={() => setParams({})}
                    aria-label="Retour à la liste des conversations"
                    className="md:hidden h-10 w-10 -ml-1 flex items-center justify-center rounded-full text-ink hover:bg-sable"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                  {interlocuteur ? (
                    <>
                      <Avatar nom={interlocuteur.nom} role={interlocuteur.role} taille="h-10 w-10 text-[14px]" />
                      <div className="min-w-0">
                        <p className="truncate font-impact font-extrabold text-[16px] text-ink">{interlocuteur.nom}</p>
                        <p className="text-[12px] text-ink-soft/75">
                          {interlocuteur.role === 'vendeur' ? 'Vendeuse' : 'Acheteuse'}
                          {interlocuteur.boutique_slug && (
                            <>
                              {' · '}
                              <Link to={`/boutique/${interlocuteur.boutique_slug}`} className="font-semibold text-ink underline underline-offset-2 hover:text-clay-dark">
                                Voir la boutique
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-10 w-40 rounded bg-line/40 animate-pulse" />
                  )}
                </header>

                {/* Messages */}
                <div
                  ref={zoneMessagesRef}
                  onScroll={surDefilement}
                  className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4"
                  aria-live="polite"
                  aria-busy={chargementFil}
                >
                  {chargementFil && fil.messages.length === 0 ? (
                    <div className="space-y-3" aria-hidden="true">
                      <div className="h-10 w-2/3 rounded-m bg-line/40 animate-pulse" />
                      <div className="h-10 w-1/2 ml-auto rounded-m bg-line/40 animate-pulse" />
                    </div>
                  ) : fil.messages.length === 0 ? (
                    <p className="text-center text-[13px] text-ink-soft/75 py-8">
                      Pas encore de message. Écrivez le premier, la réponse arrivera ici !
                    </p>
                  ) : (
                    messagesParJour.map((groupe) => (
                      <div key={groupe.jour} className="space-y-2">
                        <p className="text-center">
                          <span className="inline-block px-3 py-1 rounded-full bg-white border border-line text-[11.5px] font-semibold text-ink-soft first-letter:uppercase">
                            {groupe.libelle}
                          </span>
                        </p>
                        {groupe.messages.map((m) => (
                          <div key={m.id} className={`flex ${m.de_moi ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[85%] sm:max-w-[70%]">
                              <div
                                className={`px-3.5 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                                  m.de_moi
                                    ? 'bg-teal-dark text-white rounded-[18px] rounded-br-[6px]'
                                    : 'bg-white text-ink border border-line rounded-[18px] rounded-bl-[6px]'
                                }`}
                              >
                                {m.texte}
                                {m.produit && <CarteProduit produit={m.produit} surFondFonce={m.de_moi} />}
                              </div>
                              <p className={`mt-1 text-[11px] text-ink-soft/75 ${m.de_moi ? 'text-right' : ''}`}>
                                {heure(m.envoye_le)}
                                {m.id === dernierDeMoiId && m.lu && ' · Vu'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                {/* Saisie */}
                <form onSubmit={envoyer} className="bg-white border-t border-line px-3 sm:px-5 py-3">
                  {erreur && (
                    <p className="mb-2 text-[13px] text-red-700" role="alert">{erreur}</p>
                  )}
                  {produitJoint && (
                    <div className="mb-2 flex items-center gap-3 rounded-btn border border-line bg-sable p-2 pr-2">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-line/40">
                        {produitJoint.image && <img src={produitJoint.image} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[11px] font-semibold text-ink-soft/75">Article joint</span>
                        <span className="block truncate text-[13px] font-semibold text-ink">{produitJoint.titre}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setProduitJoint(null)}
                        aria-label="Retirer l'article joint"
                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-ink-soft hover:bg-white hover:text-ink"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <label htmlFor="champ-message" className="sr-only">Votre message</label>
                    <textarea
                      id="champ-message"
                      ref={champRef}
                      rows={1}
                      maxLength={LONGUEUR_MAX}
                      value={brouillon}
                      onChange={(e) => setBrouillon(e.target.value)}
                      onKeyDown={surToucheChamp}
                      placeholder="Écrivez votre message…"
                      className="flex-1 resize-none px-4 py-2.5 bg-sable border border-line rounded-[20px] text-[16px] sm:text-[14.5px] leading-relaxed focus:outline-none focus:border-teal"
                    />
                    <button
                      type="submit"
                      disabled={!brouillon.trim() || envoi}
                      aria-busy={envoi}
                      aria-label="Envoyer le message"
                      className="h-11 w-11 shrink-0 flex items-center justify-center rounded-full bg-clay-dark text-white hover:bg-ink transition-colors disabled:opacity-40"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                  </div>
                  <p className="hidden sm:block mt-1.5 text-[11px] text-ink-soft/75">
                    Entrée pour envoyer · Maj + Entrée pour aller à la ligne
                    {brouillon.length > LONGUEUR_MAX - 200 && ` · ${LONGUEUR_MAX - brouillon.length} caractères restants`}
                  </p>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
