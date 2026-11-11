// frontend/src/pages/vendeuse/CommandesVendeuse.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ShellVendeuse from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';
import { SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function tempsRestant(dateLimiteISO) {
  const diff = new Date(dateLimiteISO).getTime() - Date.now();
  if (diff <= 0) return 'Délai dépassé';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h${String(m).padStart(2, '0')} restant${h > 1 ? 's' : ''}`;
}

export default function CommandesVendeuse() {
  const { moi, chargementSession } = useVendeuseSession();

  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/mes-commandes-vendeuse/')
      .then(async (res) => setCommandes(res.ok ? await res.json() : []))
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  }, [chargementSession]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const repondre = async (commande, disponible) => {
    setEnCours(commande.id);
    const res = await apiFetch(`/commandes/${commande.id}/confirmer-disponibilite/`, {
      method: 'PATCH',
      body: { disponible },
    });
    if (res.ok) {
      setCommandes((prev) => prev.filter((c) => c.id !== commande.id));
    }
    setEnCours(null);
  };

  if (chargementSession || chargement) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellVendeuse active="commandes" moi={moi} titre="Commandes">

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">
          Nouvelles demandes d'achat ({commandes.length})
        </h3>

        {commandes.length === 0 ? (
          <div className={`bg-white rounded-m ${SHADOW_CARD} p-16 text-center`}>
            <EtatVide compact bordure={false} icone="boite" texte="Aucune demande en attente pour le moment." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {commandes.map((c) => (
              <div key={c.id} className={`bg-white rounded-m ${SHADOW_CARD} p-6 space-y-4`}>
                <div className="flex items-start gap-3.5">
                  <div className="h-14 w-14 rounded-btn bg-line/40 overflow-hidden shrink-0">
                    {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-teal-dark mb-1">Nouvelle demande d'achat</p>
                    <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-teal shrink-0">
                        <path d="M5 12l4.5 4.5L19 7" />
                      </svg>
                      {c.produit_titre}
                    </p>
                    <p className="text-[13px] font-bold text-ink mt-0.5">{formatFCFA(c.prix_total_paye)}</p>
                  </div>
                </div>

                <p className="text-[13px] text-ink-soft/75">Merci de confirmer sa disponibilité.</p>

                <div className="flex items-center gap-2 text-[12px] font-semibold text-clay-dark bg-orange/10 rounded-btn px-3 py-2 w-fit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  Réponse attendue — {tempsRestant(c.date_limite_confirmation)}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={enCours === c.id}
                    onClick={() => repondre(c, true)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-teal-dark hover:bg-ink text-white font-bold text-[12.5px] uppercase tracking-wide py-3 rounded-btn transition-colors disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M5 12l4.5 4.5L19 7" />
                    </svg>
                    Disponible
                  </button>
                  <button
                    type="button"
                    disabled={enCours === c.id}
                    onClick={() => repondre(c, false)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-line hover:border-red-400 hover:text-red-500 text-ink-soft/75 font-bold text-[12.5px] uppercase tracking-wide py-3 rounded-btn transition-colors disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                    Plus disponible
                  </button>
                </div>
                {c.produit_type_offre === 'location' && (
                  <Link to="/vendeuse/locations" className="block text-center text-[12.5px] font-semibold text-ink underline underline-offset-2 hover:text-clay-dark py-1">
                    Les dates ne vous arrangent pas ? Proposez-en d'autres
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </ShellVendeuse>
  );
}
