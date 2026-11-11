// frontend/src/components/location/LocationLocataire.jsx
// Carte d'une location côté locataire (Mon compte → Locations) : étape,
// dates, montants, et les actions possibles à chaque moment du parcours.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { formatFCFA } from '../../utils/produit';
import { ajouterJoursISO, dansJoursISO, formatJour, joursEntre } from '../../utils/dates';
import { ETAPES_LOCATION, FRISE_LOCATION } from './statutsLocation';
import { SHADOW_CARD } from '../../utils/gradientCards';

function Frise({ statut }) {
  const actuelle = FRISE_LOCATION.findIndex((e) => e.statuts.includes(statut));
  if (actuelle === -1) return null;
  return (
    <ol className="flex items-center gap-1 mt-4" aria-label="Avancement de la location">
      {FRISE_LOCATION.map((e, i) => (
        <li key={e.id} className="flex-1 min-w-0">
          <span className={`block h-1.5 rounded-full ${i <= actuelle ? 'bg-teal-dark' : 'bg-line'}`} />
          <span className={`mt-1 block truncate text-[10.5px] font-semibold ${i === actuelle ? 'text-ink' : 'text-ink-soft/75'}`}>
            {e.label}
            {i === actuelle && <span className="sr-only"> (étape actuelle)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function LocationLocataire({ c, onMaj }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [nouvelleFin, setNouvelleFin] = useState('');
  const etape = ETAPES_LOCATION[c.statut] || ETAPES_LOCATION.annule;
  const aujourdhui = dansJoursISO(0);
  const joursRestants = c.date_fin_location ? joursEntre(aujourdhui, c.date_fin_location) : null;

  const action = async (url, body) => {
    setEnCours(true);
    setErreur('');
    try {
      const res = await apiFetch(url, { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onMaj(data);
      else setErreur(data.dates || data.date_fin || data.general || 'Une erreur est survenue. Réessayez.');
    } catch {
      setErreur('Impossible de joindre le serveur. Vérifiez votre connexion.');
    }
    setEnCours(false);
  };

  const bouton = 'min-h-[44px] px-5 rounded-full text-sm font-bold transition-colors disabled:opacity-50';

  return (
    <article className={`bg-white rounded-m ${SHADOW_CARD} p-4 sm:p-5`}>
      <div className="flex items-start gap-4">
        <Link to={`/produit/${c.produit}`} className="h-16 w-16 rounded-btn bg-line/40 overflow-hidden shrink-0">
          {c.produit_image && <img loading="lazy" decoding="async" src={c.produit_image} alt="" className="h-full w-full object-cover" />}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-ink truncate">{c.produit_titre}</p>
              <p className="text-[12.5px] text-ink-soft">{c.boutique_nom}{c.produit_taille ? ` · Taille ${c.produit_taille}` : ''}</p>
            </div>
            <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${etape.couleur}`}>{etape.label}</span>
          </div>
          <p className="mt-2 text-[13.5px] text-ink">
            Du <strong>{formatJour(c.date_debut_location)}</strong> au <strong>{formatJour(c.date_fin_location)}</strong>
            {' '}· {c.nb_jours_location} jour{c.nb_jours_location > 1 ? 's' : ''}
          </p>
          <p className="text-[13px] text-ink-soft mt-0.5">
            Total {formatFCFA(c.prix_total_paye)}
            {Number(c.caution_demandee) > 0 && ` · dont caution ${formatFCFA(c.caution_demandee)}`}
          </p>
        </div>
      </div>

      <Frise statut={c.statut} />

      {/* ---- Actions et informations selon l'étape ---- */}
      <div className="mt-4 space-y-3">
        {c.statut === 'en_attente_confirmation' && (
          <p className="text-[13px] text-ink-soft">
            La vendeuse a 24 h pour confirmer ou vous proposer d'autres dates. Vous serez prévenue par e-mail.
          </p>
        )}

        {c.statut === 'contre_proposition' && (
          <div className="rounded-btn bg-peche/70 border border-orange/20 p-4">
            <p className="text-[14px] font-bold text-ink">La vendeuse vous propose d'autres dates</p>
            <p className="text-[13.5px] text-ink mt-1">
              Du <strong>{formatJour(c.date_debut_proposee)}</strong> au <strong>{formatJour(c.date_fin_proposee)}</strong>
              {' '}({joursEntre(c.date_debut_proposee, c.date_fin_proposee)} jours, soit{' '}
              {formatFCFA(c.produit_prix_jour * joursEntre(c.date_debut_proposee, c.date_fin_proposee) + Number(c.caution_demandee || 0))}
              {Number(c.caution_demandee) > 0 ? ' caution comprise' : ''}).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={enCours} onClick={() => action(`/locations/${c.id}/reponse-proposition/`, { accepter: true })} className={`${bouton} bg-clay-dark text-white hover:bg-ink`}>
                Accepter ces dates
              </button>
              <button type="button" disabled={enCours} onClick={() => action(`/locations/${c.id}/reponse-proposition/`, { accepter: false })} className={`${bouton} border border-ink/20 text-ink hover:border-ink`}>
                Refuser
              </button>
            </div>
          </div>
        )}

        {['en_attente_confirmation', 'contre_proposition'].includes(c.statut) && (
          <button type="button" disabled={enCours} onClick={() => action(`/locations/${c.id}/annuler/`)} className="text-[13px] font-semibold text-ink underline underline-offset-2 hover:text-clay-dark py-1">
            Annuler ma demande
          </button>
        )}

        {['confirme', 'en_cours_livraison'].includes(c.statut) && (
          <p className="text-[13px] text-ink-soft">Location confirmée : Yaay Vidé organise la livraison. Vous réglez au livreur à la remise.</p>
        )}

        {c.statut === 'livre' && (
          <>
            <p className="text-[13.5px] text-ink">
              {joursRestants > 1 && <>Plus que <strong>{joursRestants} jours</strong> de location.</>}
              {joursRestants === 1 && <>Votre location se termine <strong>demain</strong>.</>}
              {joursRestants !== null && joursRestants <= 0 && <>Votre location se termine <strong>aujourd'hui</strong>.</>}
              {' '}À la fin, un livreur Yaay Vidé passe récupérer l'article.
            </p>
            {c.prolongation_statut === 'demandee' ? (
              <p className="text-[13px] text-clay-dark font-semibold">Prolongation demandée jusqu'au {formatJour(c.prolongation_date_fin)} : en attente de la vendeuse.</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nouvelleFin) action(`/locations/${c.id}/prolongation/`, { date_fin: nouvelleFin });
                }}
                className="flex flex-wrap items-end gap-2"
              >
                <div>
                  <label htmlFor={`prolong-${c.id}`} className="block text-[12px] font-semibold text-ink mb-1">Garder l'article jusqu'au</label>
                  <input
                    id={`prolong-${c.id}`}
                    type="date"
                    min={ajouterJoursISO(c.date_fin_location, 1)}
                    value={nouvelleFin}
                    onChange={(e) => setNouvelleFin(e.target.value)}
                    className="px-3.5 py-2.5 bg-sable border border-line rounded-btn text-[16px] sm:text-sm focus:outline-none focus:border-teal"
                  />
                </div>
                <button type="submit" disabled={enCours || !nouvelleFin} className={`${bouton} bg-ink text-white hover:bg-clay-dark`}>
                  Demander une prolongation
                </button>
              </form>
            )}
            {c.prolongation_statut === 'refusee' && <p className="text-[13px] text-ink-soft">Votre dernière demande de prolongation a été refusée.</p>}
          </>
        )}

        {Number(c.supplement_prolongation) > 0 && !c.supplement_paye && (
          <p className="text-[13px] text-ink">
            Prolongation acceptée : <strong>{formatFCFA(c.supplement_prolongation)}</strong> à régler au livreur lors du retour.
          </p>
        )}

        {c.statut === 'retour_a_collecter' && (
          <p className="text-[13px] text-ink-soft">Un livreur va passer récupérer l'article à votre adresse. Préparez-le avec ses accessoires.</p>
        )}
        {c.statut === 'retour_en_cours' && <p className="text-[13px] text-ink-soft">L'article est en route vers Yaay Vidé pour être contrôlé.</p>}
        {c.statut === 'retour_controle' && (
          <p className="text-[13px] text-ink-soft">L'équipe contrôle l'article. Votre caution vous est rendue juste après, vous serez prévenue par e-mail.</p>
        )}

        {c.statut === 'terminee' && Number(c.caution_demandee) > 0 && (
          <div className={`rounded-btn p-3.5 text-[13px] ${Number(c.caution_retenue) > 0 ? 'bg-peche/70 text-ink' : 'bg-teal/10 text-ink'}`}>
            {Number(c.caution_retenue) > 0 ? (
              <>
                Caution rendue : <strong>{formatFCFA(Number(c.caution_demandee) - Number(c.caution_retenue))}</strong>
                {' '}(retenue de {formatFCFA(c.caution_retenue)}).
                <br />
                Motif : {c.motif_retenue}
              </>
            ) : (
              <>Caution de <strong>{formatFCFA(c.caution_demandee)}</strong> rendue en totalité. Merci pour votre location !</>
            )}
          </div>
        )}

        {erreur && <p className="text-[13px] text-red-700" role="alert">{erreur}</p>}
      </div>
    </article>
  );
}
