// frontend/src/pages/admin/AdminPlaintes.jsx
import { useEffect, useState } from 'react';
import ShellAdmin from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUT_INFO = {
  nouvelle: { label: 'Nouvelle', couleur: 'bg-orange/10 text-orange' },
  en_cours: { label: 'En cours', couleur: 'bg-teal/10 text-teal' },
  resolue: { label: 'Résolue', couleur: 'bg-green-50 text-green-600' },
  rejetee: { label: 'Rejetée', couleur: 'bg-line text-ink-soft/60' },
};

const FILTRES = [
  { id: '', label: 'Toutes' },
  { id: 'nouvelle', label: 'Nouvelles' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'resolue', label: 'Résolues' },
  { id: 'rejetee', label: 'Rejetées' },
];

export default function AdminPlaintes() {
  const { moi, chargementSession } = useSession('admin');

  const [plaintes, setPlaintes] = useState([]);
  const [filtre, setFiltre] = useState('');
  const [chargement, setChargement] = useState(true);
  const [reponseEnCours, setReponseEnCours] = useState({});
  const [envoiEnCours, setEnvoiEnCours] = useState(null);

  const charger = () => {
    setChargement(true);
    const url = filtre ? `/admin/plaintes/?statut=${filtre}` : '/admin/plaintes/';
    apiFetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPlaintes)
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    if (chargementSession) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-fetch déclenché par le changement de filtre, pas une synchro de props classique
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargementSession, filtre]);

  const traiter = async (plainte, champs) => {
    setEnvoiEnCours(plainte.id);
    const res = await apiFetch(`/admin/plaintes/${plainte.id}/`, { method: 'PATCH', body: champs });
    if (res.ok) {
      const updated = await res.json();
      setPlaintes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
    setEnvoiEnCours(null);
  };

  if (chargementSession || chargement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  return (
    <ShellAdmin active="plaintes" moi={moi} titre="Centre de plainte">

      <div className="flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltre(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
              filtre === f.id ? 'bg-ink text-cream' : 'bg-cream text-ink-soft/70 hover:bg-line/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {plaintes.length === 0 ? (
        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-16 text-center">
          <p className="text-ink-soft/60 text-sm">Aucune plainte dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plaintes.map((p) => {
            const statutInfo = STATUT_INFO[p.statut] || STATUT_INFO.nouvelle;
            return (
              <div key={p.id} className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{p.sujet}</p>
                    <p className="text-[12px] text-ink-soft/55 mt-0.5">
                      {p.acheteur_username} · {formatDate(p.date_creation)}
                      {p.commande_produit_titre && ` · ${p.commande_produit_titre}`}
                    </p>
                  </div>
                  <span className={`text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${statutInfo.couleur}`}>
                    {statutInfo.label}
                  </span>
                </div>

                <p className="text-[13.5px] text-ink-soft leading-relaxed mb-4">{p.description}</p>

                {p.reponse_admin && (
                  <div className="bg-sable rounded-btn p-3.5 mb-4">
                    <p className="text-[11px] font-bold text-teal uppercase tracking-wide mb-1">Réponse envoyée</p>
                    <p className="text-[13px] text-ink-soft">{p.reponse_admin}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-line">
                  {p.statut === 'nouvelle' && (
                    <button
                      type="button" disabled={envoiEnCours === p.id}
                      onClick={() => traiter(p, { statut: 'en_cours' })}
                      className="text-[11.5px] font-bold uppercase px-3 py-2 rounded-btn border border-teal text-teal hover:bg-teal hover:text-white transition-colors disabled:opacity-50"
                    >
                      Prendre en charge
                    </button>
                  )}
                  <input
                    type="text"
                    placeholder="Répondre à l'acheteuse..."
                    value={reponseEnCours[p.id] ?? ''}
                    onChange={(e) => setReponseEnCours({ ...reponseEnCours, [p.id]: e.target.value })}
                    className="flex-1 min-w-[180px] px-3.5 py-2 bg-sable border border-line rounded-btn text-[13px] focus:outline-none focus:border-teal"
                  />
                  <button
                    type="button" disabled={envoiEnCours === p.id || !(reponseEnCours[p.id] || '').trim()}
                    onClick={() => traiter(p, { reponse_admin: reponseEnCours[p.id], statut: 'resolue' })}
                    className="text-[11.5px] font-bold uppercase px-3 py-2 rounded-btn bg-teal text-white hover:bg-teal-dark transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    Répondre &amp; résoudre
                  </button>
                  {p.statut !== 'rejetee' && (
                    <button
                      type="button" disabled={envoiEnCours === p.id}
                      onClick={() => traiter(p, { statut: 'rejetee' })}
                      className="text-[11.5px] font-bold uppercase px-3 py-2 rounded-btn border border-line text-ink-soft/60 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      Rejeter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </ShellAdmin>
  );
}
