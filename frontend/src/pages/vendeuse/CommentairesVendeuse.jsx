// frontend/src/pages/vendeuse/CommentairesVendeuse.jsx
import { useEffect, useMemo, useState } from 'react';
import ShellVendeuse from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';
import { SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Etoiles({ note }) {
  return (
    <span className="text-orange text-[13px]">
      {'★'.repeat(note)}{'☆'.repeat(5 - note)}
    </span>
  );
}

export default function CommentairesVendeuse() {
  const { moi, chargementSession } = useVendeuseSession();

  const [avis, setAvis] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState('tous');
  const [reponseEnCours, setReponseEnCours] = useState({});
  const [envoiEnCours, setEnvoiEnCours] = useState(null);

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/mes-avis/')
      .then((r) => (r.ok ? r.json() : []))
      .then(setAvis)
      .finally(() => setChargement(false));
  }, [chargementSession]);

  const noteMoyenne = useMemo(() => {
    if (avis.length === 0) return 0;
    return (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1);
  }, [avis]);

  const aRepondre = avis.filter((a) => !a.reponse_vendeuse).length;

  const avisFiltres = useMemo(() => {
    if (filtre === 'a_repondre') return avis.filter((a) => !a.reponse_vendeuse);
    if (filtre === 'repondus') return avis.filter((a) => a.reponse_vendeuse);
    return avis;
  }, [avis, filtre]);

  const envoyerReponse = async (avisItem) => {
    const texte = (reponseEnCours[avisItem.id] || '').trim();
    if (!texte) return;
    setEnvoiEnCours(avisItem.id);
    const res = await apiFetch(`/mes-avis/${avisItem.id}/repondre/`, {
      method: 'PATCH',
      body: { reponse_vendeuse: texte },
    });
    if (res.ok) {
      const updated = await res.json();
      setAvis((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
    setEnvoiEnCours(null);
  };

  if (chargementSession || chargement) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellVendeuse active="commentaires" moi={moi} titre="Commentaires">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`bg-white border-l-4 border-l-orange rounded-m ${SHADOW_CARD} p-4`}>
          <p className="text-2xl font-serif font-bold text-ink">{noteMoyenne}</p>
          <p className="text-[11.5px] text-ink-soft/75 uppercase tracking-wide font-bold mt-0.5">Note moyenne</p>
        </div>
        <div className={`bg-white border-l-4 border-l-teal rounded-m ${SHADOW_CARD} p-4`}>
          <p className="text-2xl font-serif font-bold text-ink">{avis.length}</p>
          <p className="text-[11.5px] text-ink-soft/75 uppercase tracking-wide font-bold mt-0.5">Avis reçus</p>
        </div>
        <div className={`bg-white border-l-4 border-l-orange rounded-m ${SHADOW_CARD} p-4`}>
          <p className="text-2xl font-serif font-bold text-ink">{aRepondre}</p>
          <p className="text-[11.5px] text-ink-soft/75 uppercase tracking-wide font-bold mt-0.5">À répondre</p>
        </div>
        <div className={`bg-white border-l-4 border-l-teal rounded-m ${SHADOW_CARD} p-4`}>
          <p className="text-2xl font-serif font-bold text-ink">{avis.length > 0 ? Math.round(((avis.length - aRepondre) / avis.length) * 100) : 0}%</p>
          <p className="text-[11.5px] text-ink-soft/75 uppercase tracking-wide font-bold mt-0.5">Taux de réponse</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'tous', label: `Tous ${avis.length}` },
          { id: 'a_repondre', label: `À répondre ${aRepondre}` },
          { id: 'repondus', label: `Répondus ${avis.length - aRepondre}` },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltre(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
              filtre === f.id ? 'bg-ink text-cream' : 'bg-cream text-ink-soft/75 hover:bg-line/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {avisFiltres.length === 0 ? (
        <div className={`bg-white rounded-m ${SHADOW_CARD} p-14 text-center`}>
          <EtatVide compact bordure={false} icone="message" texte="Aucun avis dans cette catégorie pour le moment." />
        </div>
      ) : (
        <div className="space-y-4">
          {avisFiltres.map((a) => (
            <div key={a.id} className={`bg-white rounded-m ${SHADOW_CARD} p-5`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-teal/15 text-teal-dark font-bold text-[13px] flex items-center justify-center shrink-0">
                    {a.auteur_nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{a.auteur_nom}</p>
                    <p className="text-[11.5px] text-ink-soft/75">{formatDate(a.date_creation)}</p>
                  </div>
                </div>
                <Etoiles note={a.note} />
              </div>

              {a.commentaire && (
                <p className="text-[13.5px] text-ink-soft leading-relaxed mb-3">« {a.commentaire} »</p>
              )}

              {a.reponse_vendeuse ? (
                <div className="bg-sable rounded-btn p-3.5 mt-2">
                  <p className="text-[11px] font-bold text-teal-dark uppercase tracking-wide mb-1">Votre réponse</p>
                  <p className="text-[13px] text-ink-soft">{a.reponse_vendeuse}</p>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    placeholder="Répondre à cet avis..."
                    value={reponseEnCours[a.id] || ''}
                    onChange={(e) => setReponseEnCours({ ...reponseEnCours, [a.id]: e.target.value })}
                    className="flex-1 px-3.5 py-2 bg-sable border border-line rounded-btn text-[13px] focus:outline-none focus:border-teal"
                  />
                  <button
                    type="button"
                    disabled={envoiEnCours === a.id}
                    onClick={() => envoyerReponse(a)}
                    className="px-4 py-2 bg-teal text-white rounded-btn text-[12.5px] font-bold hover:bg-teal-dark transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {envoiEnCours === a.id ? '...' : 'Répondre'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </ShellVendeuse>
  );
}
