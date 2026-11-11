// frontend/src/pages/Aide.jsx
// Espace « Une question ? » : un seul fil de discussion avec l'équipe
// Yaay Vidé (jamais avec une autre utilisatrice). On peut joindre une de
// ses commandes ou, pour une vendeuse, un de ses articles.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import FilMessages, { PieceJointe } from '../components/support/FilMessages';
import ZoneSaisie from '../components/support/ZoneSaisie';
import { apiFetch } from '../utils/api';
import { EVENEMENT_SUPPORT_LU, useFilMessages } from '../hooks/useFilMessages';

const ACCUEIL =
  "Bonjour et bienvenue !\nUne question sur une commande, une vente, une location ou un paiement ? Écrivez-nous ici : notre équipe vous répond en général sous 24 h, et vous recevez un e-mail dès que nous avons répondu.";

function MenuJoindre({ onChoisir }) {
  const [ouvert, setOuvert] = useState(false);
  const [elements, setElements] = useState(null);
  const refMenu = useRef(null);

  useEffect(() => {
    if (!ouvert) return undefined;
    const fermer = (e) => {
      if (refMenu.current && !refMenu.current.contains(e.target)) setOuvert(false);
    };
    const echap = (e) => e.key === 'Escape' && setOuvert(false);
    document.addEventListener('mousedown', fermer);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('mousedown', fermer);
      document.removeEventListener('keydown', echap);
    };
  }, [ouvert]);

  const basculer = () => {
    setOuvert((o) => !o);
    if (elements === null) {
      apiFetch('/support/elements-joignables/')
        .then((r) => (r.ok ? r.json() : { commandes: [], produits: [] }))
        .then(setElements)
        .catch(() => setElements({ commandes: [], produits: [] }));
    }
  };

  const choisir = (piece) => {
    onChoisir(piece);
    setOuvert(false);
  };

  return (
    <div ref={refMenu} className="relative shrink-0">
      <button
        type="button"
        onClick={basculer}
        aria-expanded={ouvert}
        aria-haspopup="true"
        aria-label="Joindre une commande ou un article"
        className="h-11 w-11 flex items-center justify-center rounded-full border border-line text-ink hover:border-teal hover:text-teal-dark transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M21.4 11.1l-8.5 8.5a5.5 5.5 0 01-7.8-7.8l8.5-8.5a3.7 3.7 0 015.2 5.2l-8.5 8.5a1.8 1.8 0 01-2.6-2.6l7.8-7.8" />
        </svg>
      </button>
      {ouvert && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-[min(320px,calc(100vw-32px))] max-h-80 overflow-y-auto rounded-m border border-line bg-white shadow-[0_18px_40px_-14px_rgba(27,36,48,0.35)] p-2">
          {elements === null ? (
            <p className="p-3 text-[13px] text-ink-soft">Chargement…</p>
          ) : elements.commandes.length === 0 && elements.produits.length === 0 ? (
            <p className="p-3 text-[13px] text-ink-soft">Rien à joindre pour le moment : vous n'avez ni commande ni article.</p>
          ) : (
            <>
              {elements.commandes.length > 0 && (
                <p className="px-2 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">Mes commandes</p>
              )}
              {elements.commandes.map((c) => (
                <button
                  key={`c${c.id}`}
                  type="button"
                  onClick={() => choisir({ commande: c })}
                  className="w-full flex items-center gap-2.5 rounded-btn p-2 text-left hover:bg-sable"
                >
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-[6px] bg-line/40">
                    {c.image && <img src={c.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">n°{c.id} · {c.produit_titre}</span>
                    <span className="block text-[12px] text-ink-soft">{c.statut}</span>
                  </span>
                </button>
              ))}
              {elements.produits.length > 0 && (
                <p className="px-2 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">Mes articles</p>
              )}
              {elements.produits.map((p) => (
                <button
                  key={`p${p.id}`}
                  type="button"
                  onClick={() => choisir({ produit: p })}
                  className="w-full flex items-center gap-2.5 rounded-btn p-2 text-left hover:bg-sable"
                >
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-[6px] bg-line/40">
                    {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="truncate text-[13px] font-semibold text-ink">{p.titre}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Aide() {
  const navigate = useNavigate();
  const [brouillon, setBrouillon] = useState('');
  const [piece, setPiece] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const versConnexion = useCallback(() => navigate('/connexion', { state: { from: '/aide' } }), [navigate]);
  const signalerLu = useCallback(() => window.dispatchEvent(new Event(EVENEMENT_SUPPORT_LU)), []);

  const { messages, chargement, ajouterMessage } = useFilMessages('/support/', {
    intervalle: 5000,
    surNonAutorise: versConnexion,
    surNouveauxRecus: signalerLu,
  });

  const envoyer = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      const res = await apiFetch('/support/', {
        method: 'POST',
        body: { texte: brouillon.trim(), produit_id: piece?.produit?.id, commande_id: piece?.commande?.id },
      });
      if (res.status === 401 || res.status === 403) return versConnexion();
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        ajouterMessage(data);
        setBrouillon('');
        setPiece(null);
      } else {
        setErreur(data.texte || "Le message n'a pas pu être envoyé. Réessayez.");
      }
    } catch {
      setErreur('Impossible de joindre le serveur. Votre message est conservé, réessayez.');
    } finally {
      setEnvoi(false);
    }
    return undefined;
  };

  return (
    <Layout>
      <div className="mx-auto max-w-[860px] px-0 sm:px-6 py-0 sm:py-8">
        <div className="h-[calc(100dvh-150px)] sm:h-[calc(100dvh-230px)] min-h-[480px] flex flex-col bg-creme/60 sm:rounded-m border-y sm:border border-line shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] overflow-hidden">
          <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 bg-white border-b border-line">
            <span className="h-11 w-11 shrink-0 rounded-full bg-teal-dark text-white flex items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
                <path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.5-1.5 1-1.5 2M12 16.5h.01" />
              </svg>
            </span>
            <div className="min-w-0">
              <h1 className="font-impact font-extrabold text-[18px] sm:text-[20px] text-ink leading-tight">Une question ?</h1>
              <p className="text-[12.5px] text-ink-soft">
                L'équipe Yaay Vidé vous répond, en général sous 24 h ·{' '}
                <Link to="/faq-centre-daide" className="font-semibold text-ink underline underline-offset-2 hover:text-clay-dark">
                  Voir la FAQ
                </Link>
              </p>
            </div>
          </header>

          <FilMessages messages={messages} chargement={chargement} accueil={ACCUEIL} />

          <ZoneSaisie
            valeur={brouillon}
            onChange={setBrouillon}
            onEnvoyer={envoyer}
            envoi={envoi}
            erreur={erreur}
            placeholder="Posez votre question…"
            outils={<MenuJoindre onChoisir={setPiece} />}
            avant={
              piece && (
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0 [&>*]:mt-0">
                    <PieceJointe produit={piece.produit} commande={piece.commande} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPiece(null)}
                    aria-label="Retirer l'élément joint"
                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-ink-soft hover:bg-sable hover:text-ink"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              )
            }
          />
        </div>
      </div>
    </Layout>
  );
}
