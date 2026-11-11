// frontend/src/components/location/GestionLocationAdmin.jsx
// Panneau « Location » du détail d'une commande côté équipe : organiser le
// retour (assigner un livreur), puis clôturer après contrôle en rendant la
// caution en totalité ou en partie (retenue + motif visible par la locataire).
import { useState } from 'react';
import { apiFetch } from '../../utils/api';
import { formatFCFA } from '../../utils/produit';
import { formatJour } from '../../utils/dates';

export default function GestionLocationAdmin({ c, livreurs, onMaj }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [livreurRetour, setLivreurRetour] = useState(c.livreur_retour || '');
  const [retenue, setRetenue] = useState('0');
  const [motif, setMotif] = useState('');

  const appeler = async (url, body) => {
    setEnCours(true);
    setErreur('');
    try {
      const res = await apiFetch(url, { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onMaj(data);
      else setErreur(data.motif_retenue || data.caution_retenue || data.general || 'Une erreur est survenue.');
    } catch {
      setErreur('Impossible de joindre le serveur.');
    }
    setEnCours(false);
  };

  const champ = 'w-full text-[13px] px-3 py-2.5 bg-sable border border-line rounded-btn focus:outline-none focus:border-teal';
  const bouton = 'w-full min-h-[42px] rounded-btn text-white text-[13px] font-bold transition-colors disabled:opacity-50';
  const caution = Number(c.caution_demandee || 0);

  return (
    <div className="pt-4 border-t border-line mt-4 space-y-3">
      <p className="text-[11px] font-bold text-ink-soft/75 uppercase tracking-wide">Location</p>
      <div className="space-y-1.5 text-[13px]">
        <div className="flex justify-between gap-3"><span className="text-ink-soft">Dates</span><span className="font-semibold text-ink">{formatJour(c.date_debut_location)} → {formatJour(c.date_fin_location)}</span></div>
        <div className="flex justify-between gap-3"><span className="text-ink-soft">Caution</span><span className="font-semibold text-ink">{formatFCFA(caution)}</span></div>
        {Number(c.supplement_prolongation) > 0 && (
          <div className="flex justify-between gap-3"><span className="text-ink-soft">Prolongation</span><span className="font-semibold text-ink">{formatFCFA(c.supplement_prolongation)} {c.supplement_paye ? '(encaissée)' : '(à encaisser au retour)'}</span></div>
        )}
        {c.livreur_retour_nom && <div className="flex justify-between gap-3"><span className="text-ink-soft">Livreur retour</span><span className="font-semibold text-ink">{c.livreur_retour_nom}</span></div>}
      </div>

      {['livre', 'retour_a_collecter'].includes(c.statut) && (
        <div className="space-y-2">
          <label htmlFor={`lr-${c.id}`} className="block text-[12px] font-semibold text-ink">
            {c.statut === 'livre' ? 'Organiser le retour maintenant' : 'Livreur pour le retour'}
          </label>
          <select id={`lr-${c.id}`} value={livreurRetour} onChange={(e) => setLivreurRetour(e.target.value)} className={champ}>
            <option value="">Laisser un livreur de la zone le prendre</option>
            {livreurs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.username}{l.zone_livreur === c.zone_livraison ? ' · sa zone' : ''}
              </option>
            ))}
          </select>
          <button type="button" disabled={enCours} onClick={() => appeler(`/admin/locations/${c.id}/planifier-retour/`, { livreur_id: livreurRetour || null })} className={`${bouton} bg-ink hover:bg-teal-dark`}>
            {c.statut === 'livre' ? 'Lancer le retour' : 'Assigner ce livreur'}
          </button>
          {c.statut === 'livre' && (
            <p className="text-[11.5px] text-ink-soft">Sinon, le retour se lance tout seul le jour de la fin de la location.</p>
          )}
        </div>
      )}

      {['retour_en_cours', 'retour_controle'].includes(c.statut) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            appeler(`/admin/locations/${c.id}/cloturer/`, { caution_retenue: Number(retenue) || 0, motif_retenue: motif });
          }}
          className="space-y-2 rounded-btn bg-sable/70 border border-line p-3"
        >
          <p className="text-[12.5px] font-semibold text-ink">Contrôle terminé : clôturer et rendre la caution</p>
          <label htmlFor={`ret-${c.id}`} className="block text-[12px] text-ink">Montant retenu (0 = caution rendue en totalité)</label>
          <input id={`ret-${c.id}`} type="number" min="0" max={caution} step="100" value={retenue} onChange={(e) => setRetenue(e.target.value)} className={champ} />
          {Number(retenue) > 0 && (
            <>
              <label htmlFor={`mot-${c.id}`} className="block text-[12px] text-ink">Motif (visible par la locataire)</label>
              <textarea id={`mot-${c.id}`} rows={2} required value={motif} onChange={(e) => setMotif(e.target.value)} className={champ} placeholder="Ex. : tache sur le matelas, pièce manquante…" />
            </>
          )}
          <p className="text-[12px] text-ink-soft">À rendre à la locataire : <strong className="text-ink">{formatFCFA(Math.max(0, caution - (Number(retenue) || 0)))}</strong> (Wave, Orange Money, Mixx by Yas ou espèces).</p>
          <button type="submit" disabled={enCours} className={`${bouton} bg-clay-dark hover:bg-ink`}>
            Clôturer la location
          </button>
        </form>
      )}

      {c.statut === 'terminee' && c.caution_traitee_le && (
        <p className="text-[12.5px] text-ink-soft">
          Caution traitée{Number(c.caution_retenue) > 0 ? ` : ${formatFCFA(c.caution_retenue)} retenus (${c.motif_retenue})` : ' : rendue en totalité'}.
        </p>
      )}
      {erreur && <p className="text-[12.5px] text-red-700" role="alert">{erreur}</p>}
    </div>
  );
}
