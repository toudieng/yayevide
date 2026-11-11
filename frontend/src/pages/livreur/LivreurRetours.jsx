// frontend/src/pages/livreur/LivreurRetours.jsx
// Retours de location : le livreur récupère l'article chez la locataire
// (et encaisse les éventuels jours de prolongation) puis le dépose chez
// Yaay Vidé pour le contrôle. Étapes : prendre -> récupéré -> déposé.
import { useCallback, useEffect, useState } from 'react';
import ShellLivreur from '../../components/livreur/ShellLivreur';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { formatFCFA } from '../../utils/produit';
import { formatJour } from '../../utils/dates';
import { SHADOW_CARD } from '../../utils/gradientCards';

function CarteRetour({ c, action, libelle, enCours, couleur }) {
  return (
    <article className={`bg-white rounded-m ${SHADOW_CARD} p-4 sm:p-5`}>
      <div className="flex items-start gap-3.5">
        <div className="h-14 w-14 rounded-btn bg-line/40 overflow-hidden shrink-0">
          {c.produit_image && <img src={c.produit_image} alt="" className="h-full w-full object-cover" loading="lazy" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink truncate">{c.produit_titre}</p>
          <p className="text-[12.5px] text-ink-soft">Location du {formatJour(c.date_debut_location)} au {formatJour(c.date_fin_location)}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
        <div>
          <dt className="inline font-semibold text-ink">Récupérer chez : </dt>
          <dd className="inline text-ink-soft">{c.acheteur_username}{c.acheteur_telephone && ` · ${c.acheteur_telephone}`}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-ink">Adresse : </dt>
          <dd className="inline text-ink-soft">{c.adresse_livraison}{c.complement_adresse && `, ${c.complement_adresse}`} ({c.zone_livraison_nom})</dd>
        </div>
        {Number(c.supplement_prolongation) > 0 && !c.supplement_paye && (
          <div className="sm:col-span-2 rounded-btn bg-peche/70 px-3 py-2 text-ink">
            <strong>À encaisser :</strong> {formatFCFA(c.supplement_prolongation)} (jours de prolongation)
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className="inline font-semibold text-ink">À déposer : </dt>
          <dd className="inline text-ink-soft">au dépôt Yaay Vidé pour contrôle</dd>
        </div>
      </dl>
      {action && (
        <button
          type="button"
          disabled={enCours}
          onClick={action}
          className={`mt-4 w-full sm:w-auto min-h-[44px] px-5 rounded-btn text-white text-[13.5px] font-bold transition-colors disabled:opacity-50 ${couleur || 'bg-clay-dark hover:bg-ink'}`}
        >
          {libelle}
        </button>
      )}
    </article>
  );
}

export default function LivreurRetours() {
  const { moi, chargementSession } = useSession('livreur');
  const [donnees, setDonnees] = useState(null);
  const [enCours, setEnCours] = useState(null);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(() => {
    apiFetch('/livreur/retours/')
      .then((r) => (r.ok ? r.json() : { mes_retours: [], disponibles: [] }))
      .then(setDonnees)
      .catch(() => setErreur('Impossible de joindre le serveur.'));
  }, []);

  useEffect(() => {
    if (chargementSession) return undefined;
    const t = setTimeout(charger, 0);
    return () => clearTimeout(t);
  }, [chargementSession, charger]);

  const agir = async (c, action) => {
    setEnCours(c.id);
    setErreur('');
    const res = await apiFetch(`/livreur/retours/${c.id}/`, { method: 'PATCH', body: { action } }).catch(() => null);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      setErreur(data.general || "L'action n'a pas pu être enregistrée. Réessayez.");
    }
    charger();
    setEnCours(null);
  };

  if (chargementSession || donnees === null) return <SqueletteTableau />;

  const aRecuperer = donnees.mes_retours.filter((c) => c.statut === 'retour_a_collecter');
  const aDeposer = donnees.mes_retours.filter((c) => c.statut === 'retour_en_cours');

  return (
    <ShellLivreur active="retours" moi={moi} titre="Retours de location">
      <p className="text-[13.5px] text-ink-soft -mt-2">
        À la fin d'une location, récupérez l'article chez la locataire puis déposez-le chez Yaay Vidé pour le contrôle.
      </p>
      {erreur && <p className="p-3 text-[13px] bg-red-50 text-red-700 rounded-btn border border-red-100" role="alert">{erreur}</p>}

      <section className="space-y-3">
        <h3 className="font-impact font-extrabold text-lg text-ink">À récupérer ({aRecuperer.length})</h3>
        {aRecuperer.length === 0 ? (
          <EtatVide compact icone="camion" texte="Aucun retour à récupérer pour le moment." />
        ) : (
          aRecuperer.map((c) => (
            <CarteRetour key={c.id} c={c} enCours={enCours === c.id} libelle="J'ai récupéré l'article" action={() => agir(c, 'recupere')} />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-impact font-extrabold text-lg text-ink">À déposer chez Yaay Vidé ({aDeposer.length})</h3>
        {aDeposer.length === 0 ? (
          <EtatVide compact icone="boite" texte="Aucun article à déposer." />
        ) : (
          aDeposer.map((c) => (
            <CarteRetour key={c.id} c={c} enCours={enCours === c.id} libelle="Article déposé chez Yaay Vidé" couleur="bg-teal-dark hover:bg-ink" action={() => agir(c, 'depose')} />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-impact font-extrabold text-lg text-ink">Retours disponibles dans ma zone ({donnees.disponibles.length})</h3>
        {donnees.disponibles.length === 0 ? (
          <EtatVide compact icone="recherche" texte="Aucun retour en attente de livreur dans votre zone." />
        ) : (
          donnees.disponibles.map((c) => (
            <CarteRetour key={c.id} c={c} enCours={enCours === c.id} libelle="Je m'en occupe" couleur="bg-ink hover:bg-teal-dark" action={() => agir(c, 'prendre')} />
          ))
        )}
      </section>
    </ShellLivreur>
  );
}
