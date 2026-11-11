// frontend/src/pages/admin/AdminQuestions.jsx
// Côté équipe : toutes les questions des utilisatrices (« Une question ? »).
// Les fils sans réponse remontent en premier ; ouvrir un fil marque les
// messages comme lus, répondre envoie un e-mail à l'utilisatrice.
import { useCallback, useEffect, useMemo, useState } from 'react';
import ShellAdmin from '../../components/admin/ShellAdmin';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';
import FilMessages from '../../components/support/FilMessages';
import ZoneSaisie from '../../components/support/ZoneSaisie';
import { useSession } from '../../hooks/useSession';
import { EVENEMENT_SUPPORT_LU, useFilMessages } from '../../hooks/useFilMessages';
import { apiFetch } from '../../utils/api';
import { dateCourte } from '../../utils/dates';
import { SHADOW_CARD } from '../../utils/gradientCards';

const ROLES = { acheteur: 'Acheteuse', vendeur: 'Vendeuse', livreur: 'Livreur', admin: 'Équipe' };

export default function AdminQuestions() {
  const { moi, chargementSession } = useSession('admin');
  const [fils, setFils] = useState(null);
  const [filtre, setFiltre] = useState('attente');
  const [idActif, setIdActif] = useState(null);
  const [brouillon, setBrouillon] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const chargerFils = useCallback(() => {
    if (document.hidden) return;
    apiFetch('/admin/support/')
      .then((r) => (r.ok ? r.json() : []))
      .then(setFils)
      .catch(() => setFils((f) => f || []));
  }, []);

  useEffect(() => {
    if (chargementSession) return undefined;
    const premier = setTimeout(chargerFils, 0);
    const t = setInterval(chargerFils, 15000);
    return () => {
      clearTimeout(premier);
      clearInterval(t);
    };
  }, [chargementSession, chargerFils]);

  const surNouveaux = useCallback(() => {
    window.dispatchEvent(new Event(EVENEMENT_SUPPORT_LU));
    setFils((liste) => (liste || []).map((f) => (f.id === idActif ? { ...f, non_lus: 0 } : f)));
  }, [idActif]);

  const { messages, extra, chargement, ajouterMessage } = useFilMessages(
    idActif ? `/admin/support/${idActif}/` : null,
    { intervalle: 5000, surNouveauxRecus: surNouveaux },
  );

  const filsAffiches = useMemo(() => {
    const liste = fils || [];
    return filtre === 'attente' ? liste.filter((f) => f.en_attente) : liste;
  }, [fils, filtre]);
  const nbEnAttente = (fils || []).filter((f) => f.en_attente).length;
  const filActif = (fils || []).find((f) => f.id === idActif);
  const utilisatrice = extra.utilisateur || filActif?.utilisateur;

  const ouvrir = (id) => {
    if (id !== idActif) {
      setBrouillon('');
      setErreur('');
    }
    setIdActif(id);
  };

  const repondre = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      const res = await apiFetch(`/admin/support/${idActif}/`, { method: 'POST', body: { texte: brouillon.trim() } });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        ajouterMessage(data);
        setBrouillon('');
        setFils((liste) => (liste || []).map((f) => (f.id === idActif ? { ...f, en_attente: false, dernier_message: data } : f)));
        window.dispatchEvent(new Event(EVENEMENT_SUPPORT_LU));
      } else {
        setErreur(data.texte || "La réponse n'a pas pu être envoyée. Réessayez.");
      }
    } catch {
      setErreur('Impossible de joindre le serveur. Votre réponse est conservée, réessayez.');
    } finally {
      setEnvoi(false);
    }
  };

  if (chargementSession || fils === null) return <SqueletteTableau />;

  return (
    <ShellAdmin active="questions" moi={moi} titre="Questions des utilisatrices">
      <div
        className={`bg-white rounded-m ${SHADOW_CARD} overflow-hidden h-[calc(100dvh-170px)] min-h-[520px] grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]`}
      >
        {/* Liste */}
        <aside className={`${idActif ? 'hidden lg:flex' : 'flex'} flex-col min-h-0 min-w-0 border-r border-line`}>
          <div className="p-4 border-b border-line">
            <div className="flex gap-1 rounded-full bg-sable border border-line p-1" role="tablist" aria-label="Filtrer les questions">
              {[
                ['attente', `Sans réponse${nbEnAttente ? ` (${nbEnAttente})` : ''}`],
                ['toutes', 'Toutes'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filtre === id}
                  onClick={() => setFiltre(id)}
                  className={`flex-1 px-3 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
                    filtre === id ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filsAffiches.length === 0 ? (
              <EtatVide
                compact
                bordure={false}
                icone="message"
                titre={filtre === 'attente' ? 'Tout est à jour' : 'Aucune question'}
                texte={filtre === 'attente' ? 'Aucune question en attente de réponse.' : 'Aucune utilisatrice ne vous a encore écrit.'}
                className="mt-6"
              />
            ) : (
              <ul>
                {filsAffiches.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => ouvrir(f.id)}
                      aria-current={f.id === idActif ? 'true' : undefined}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-line/60 transition-colors ${
                        f.id === idActif ? 'bg-teal/10' : 'hover:bg-sable'
                      }`}
                    >
                      <span
                        className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold ${
                          f.utilisateur.role === 'vendeur' ? 'bg-clay-dark' : 'bg-teal-dark'
                        }`}
                        aria-hidden="true"
                      >
                        {f.utilisateur.nom.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[14px] font-semibold text-ink">{f.utilisateur.nom}</span>
                          <span className="shrink-0 text-[11.5px] text-ink-soft/75">{dateCourte(f.dernier_message_le)}</span>
                        </span>
                        <span className="block text-[11.5px] text-ink-soft">{ROLES[f.utilisateur.role] || f.utilisateur.role}</span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className={`truncate text-[12.5px] ${f.en_attente ? 'text-ink font-semibold' : 'text-ink-soft/75'}`}>
                            {f.dernier_message ? `${f.dernier_message.de_moi ? 'Équipe : ' : ''}${f.dernier_message.texte}` : ''}
                          </span>
                          {f.en_attente && (
                            <span className="shrink-0 rounded-full bg-clay-dark text-white text-[10.5px] font-bold px-2 py-0.5">
                              À répondre
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Fil */}
        <section className={`${idActif ? 'flex' : 'hidden lg:flex'} flex-col min-h-0 min-w-0 bg-creme/60`} aria-label="Fil de discussion">
          {!idActif ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <EtatVide
                bordure={false}
                icone="message"
                titre="Choisissez une question"
                texte="Sélectionnez un fil à gauche pour lire la question et y répondre."
              />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 px-4 sm:px-5 py-3 bg-white border-b border-line">
                <button
                  type="button"
                  onClick={() => setIdActif(null)}
                  aria-label="Retour à la liste"
                  className="lg:hidden h-10 w-10 -ml-1 flex items-center justify-center rounded-full text-ink hover:bg-sable"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                {utilisatrice && (
                  <div className="min-w-0">
                    <p className="truncate font-impact font-extrabold text-[16px] text-ink">{utilisatrice.nom}</p>
                    <p className="text-[12px] text-ink-soft truncate">
                      {ROLES[utilisatrice.role] || utilisatrice.role} · @{utilisatrice.username}
                      {utilisatrice.telephone && (
                        <>
                          {' · '}
                          <a href={`tel:${utilisatrice.telephone}`} className="font-semibold text-ink underline underline-offset-2">
                            {utilisatrice.telephone}
                          </a>
                        </>
                      )}
                      {utilisatrice.email && ` · ${utilisatrice.email}`}
                    </p>
                  </div>
                )}
              </header>
              <FilMessages
                messages={messages}
                chargement={chargement}
                libelleAutre={utilisatrice?.nom}
                lienCommande="/admin/commandes"
              />
              <ZoneSaisie
                valeur={brouillon}
                onChange={setBrouillon}
                onEnvoyer={repondre}
                envoi={envoi}
                erreur={erreur}
                placeholder="Votre réponse… (l'utilisatrice reçoit un e-mail)"
              />
            </>
          )}
        </section>
      </div>
    </ShellAdmin>
  );
}
