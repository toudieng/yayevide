// frontend/src/components/support/FilMessages.jsx
// Affichage d'un fil « Une question ? » : séparateurs par jour, bulles,
// éléments joints (commande / article), « Vu », défilement automatique.
import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatFCFA } from '../../utils/produit';
import { heure } from '../../utils/dates';

function libelleJour(iso) {
  const d = new Date(iso);
  const auj = new Date();
  const hier = new Date();
  hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === auj.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function PieceJointe({ produit, commande, surFondFonce, lienCommande }) {
  const image = produit?.image || commande?.image;
  const titre = produit ? produit.titre : `Commande n°${commande.id} · ${commande.produit_titre}`;
  const sousTitre = produit
    ? `${formatFCFA(produit.prix)}${produit.type_offre === 'location' ? ' / jour' : ''}`
    : commande.statut;
  const contenu = (
    <>
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-line/40">
        {image && <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />}
      </span>
      <span className="min-w-0 text-left">
        <span className={`block truncate text-[13px] font-semibold ${surFondFonce ? 'text-white' : 'text-ink'}`}>{titre}</span>
        <span className={`block text-[12px] ${surFondFonce ? 'text-white/85' : 'text-ink-soft'}`}>{sousTitre}</span>
      </span>
    </>
  );
  const classes = `mt-2 flex items-center gap-3 rounded-btn p-2 pr-3 ${
    surFondFonce ? 'bg-white/15' : 'bg-white border border-line'
  }`;
  if (produit) {
    return (
      <Link to={`/produit/${produit.id}`} className={`${classes} hover:opacity-90`}>
        {contenu}
      </Link>
    );
  }
  if (lienCommande) {
    return (
      <Link to={lienCommande} className={`${classes} hover:opacity-90`}>
        {contenu}
      </Link>
    );
  }
  return <div className={classes}>{contenu}</div>;
}

/**
 * messages : [{ id, texte, de_moi, de_l_equipe, auteur, envoye_le, lu, produit, commande }]
 * accueil : texte d'une bulle d'accueil affichée en premier (non enregistrée)
 * libelleAutre : nom affiché au-dessus des messages de l'autre côté
 */
export default function FilMessages({ messages, chargement, accueil, libelleAutre, vide, lienCommande }) {
  const zoneRef = useRef(null);
  const auBasRef = useRef(true);

  useEffect(() => {
    const zone = zoneRef.current;
    if (zone && auBasRef.current) zone.scrollTop = zone.scrollHeight;
  }, [messages.length, chargement]);

  const surDefilement = () => {
    const zone = zoneRef.current;
    if (zone) auBasRef.current = zone.scrollHeight - zone.scrollTop - zone.clientHeight < 80;
  };

  const groupes = useMemo(() => {
    const g = [];
    messages.forEach((m) => {
      const jour = new Date(m.envoye_le).toDateString();
      const dernier = g[g.length - 1];
      if (dernier && dernier.jour === jour) dernier.messages.push(m);
      else g.push({ jour, libelle: libelleJour(m.envoye_le), messages: [m] });
    });
    return g;
  }, [messages]);

  const dernierDeMoiId = [...messages].reverse().find((m) => m.de_moi)?.id;

  return (
    <div
      ref={zoneRef}
      onScroll={surDefilement}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4"
      aria-live="polite"
      aria-busy={chargement}
    >
      {accueil && (
        <div className="flex justify-start">
          <div className="max-w-[85%] sm:max-w-[70%]">
            <p className="mb-1 text-[11.5px] font-semibold text-ink-soft">Équipe Yaay Vidé</p>
            <div className="px-3.5 py-2.5 text-[14.5px] leading-relaxed bg-white text-ink border border-line rounded-[18px] rounded-bl-[6px] shadow-sm whitespace-pre-line">
              {accueil}
            </div>
          </div>
        </div>
      )}

      {chargement ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="h-10 w-2/3 rounded-m bg-line/40 animate-pulse" />
          <div className="h-10 w-1/2 ml-auto rounded-m bg-line/40 animate-pulse" />
        </div>
      ) : messages.length === 0 ? (
        vide && <p className="text-center text-[13px] text-ink-soft/75 py-6">{vide}</p>
      ) : (
        groupes.map((groupe) => (
          <div key={groupe.jour} className="space-y-2">
            <p className="text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-white border border-line text-[11.5px] font-semibold text-ink-soft first-letter:uppercase">
                {groupe.libelle}
              </span>
            </p>
            {groupe.messages.map((m, i) => {
              const precedent = groupe.messages[i - 1];
              const afficherNom = !m.de_moi && (!precedent || precedent.de_moi);
              return (
                <div key={m.id} className={`flex ${m.de_moi ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] sm:max-w-[70%]">
                    {afficherNom && (
                      <p className="mb-1 text-[11.5px] font-semibold text-ink-soft">
                        {m.de_l_equipe ? `Équipe Yaay Vidé${m.auteur ? ` · ${m.auteur}` : ''}` : libelleAutre}
                      </p>
                    )}
                    <div
                      className={`px-3.5 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                        m.de_moi
                          ? 'bg-teal-dark text-white rounded-[18px] rounded-br-[6px]'
                          : 'bg-white text-ink border border-line rounded-[18px] rounded-bl-[6px]'
                      }`}
                    >
                      {m.texte}
                      {(m.produit || m.commande) && (
                        <PieceJointe
                          produit={m.produit}
                          commande={m.commande}
                          surFondFonce={m.de_moi}
                          lienCommande={lienCommande}
                        />
                      )}
                    </div>
                    <p className={`mt-1 text-[11px] text-ink-soft/75 ${m.de_moi ? 'text-right' : ''}`}>
                      {heure(m.envoye_le)}
                      {m.id === dernierDeMoiId && m.lu && ' · Vu'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
