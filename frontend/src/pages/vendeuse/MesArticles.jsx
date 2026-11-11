// frontend/src/pages/vendeuse/MesArticles.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellVendeuse from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';
import { SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';

const ONGLETS = [
  { id: 'tous', label: 'Tous' },
  { id: 'en_ligne', label: 'En ligne' },
  { id: 'masques', label: 'Masqués' },
];

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MesArticles() {
  const navigate = useNavigate();
  const { moi, chargementSession } = useVendeuseSession();

  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [onglet, setOnglet] = useState('tous');
  const [confirmationSuppression, setConfirmationSuppression] = useState(null); // id du produit
  const [enCours, setEnCours] = useState(null); // id du produit en cours d'action
  const [conseilVisible, setConseilVisible] = useState(true);

  const chargerProduits = () => {
    apiFetch('/mes-produits/')
      .then(async (res) => setProduits(res.ok ? await res.json() : []))
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    if (chargementSession) return;
    chargerProduits();
  }, [chargementSession]);

  const produitsFiltres = useMemo(() => {
    if (onglet === 'en_ligne') return produits.filter((p) => p.disponible);
    if (onglet === 'masques') return produits.filter((p) => !p.disponible);
    return produits;
  }, [produits, onglet]);

  const compteurs = useMemo(() => ({
    tous: produits.length,
    en_ligne: produits.filter((p) => p.disponible).length,
    masques: produits.filter((p) => !p.disponible).length,
  }), [produits]);

  const toggleDisponibilite = async (produit) => {
    setEnCours(produit.id);
    const res = await apiFetch(`/mes-produits/${produit.id}/disponibilite/`, {
      method: 'PATCH',
      body: { disponible: !produit.disponible },
    });
    if (res.ok) {
      const updated = await res.json();
      setProduits((prev) => prev.map((p) => (p.id === produit.id ? updated : p)));
    }
    setEnCours(null);
  };

  const supprimer = async (produit) => {
    setEnCours(produit.id);
    setErreur(null);
    const res = await apiFetch(`/mes-produits/${produit.id}/disponibilite/`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setProduits((prev) => prev.filter((p) => p.id !== produit.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setErreur(data.general || "Impossible de supprimer cet article.");
    }
    setConfirmationSuppression(null);
    setEnCours(null);
  };

  if (chargementSession || chargement) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellVendeuse active="articles" moi={moi} titre="Mes articles">

      <p className="text-[13px] text-ink-soft/75 -mt-2">
        Gérez vos articles : modifiez, mettez à jour ou supprimez vos publications.
      </p>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-cream border border-line rounded-btn p-1">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`px-4 py-2 rounded-btn text-sm font-semibold transition-all ${
                onglet === o.id ? 'bg-teal text-white' : 'text-ink-soft/75 hover:text-ink'
              }`}
            >
              {o.label} <span className="opacity-60">({compteurs[o.id]})</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/vendeuse/ajouter-produit')}
          className="bg-clay-dark hover:bg-ink text-white px-5 py-2.5 rounded-btn font-bold text-sm transition-all shadow-sm hover:-translate-y-0.5"
        >
          + Ajouter un article
        </button>
      </div>

      {produitsFiltres.length === 0 ? (
        <div className={`bg-white rounded-m ${SHADOW_CARD} p-16 text-center`}>
          <p className="text-ink-soft/75 text-sm">
            {onglet === 'tous'
              ? 'Aucun article pour le moment. Commencez par en ajouter un !'
              : 'Aucun article dans cette catégorie.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {produitsFiltres.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-m ${SHADOW_CARD} hover:-translate-y-0.5 transition-transform flex flex-col`}
            >
              <div className="h-40 bg-line/30 relative">
                {p.image_principale ? (
                  <img loading="lazy" decoding="async" src={p.image_principale} alt={p.titre} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-ink-soft/30 text-xs">
                    Pas de photo
                  </div>
                )}
                <span
                  className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    p.disponible ? 'bg-teal text-white' : 'bg-ink/70 text-cream'
                  }`}
                >
                  {p.disponible ? 'En ligne' : 'Masqué'}
                </span>
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-cream/90 text-ink-soft/75">
                  {p.type_offre === 'location' ? 'Location' : 'Vente'}
                </span>
                {p.taille && (
                  <span className="absolute bottom-3 right-3 text-[10.5px] font-bold px-2 py-1 rounded-full bg-white/95 text-ink shadow-sm">
                    {p.taille}
                  </span>
                )}
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{p.titre}</p>
                <p className="text-[12px] text-ink-soft/75">{p.categorie_nom || 'Sans catégorie'}</p>
                <p className="text-sm font-bold text-ink">
                  {formatFCFA(p.prix_final_public)}
                  {p.type_offre === 'location' && <span className="text-ink-soft/75 font-normal"> /jour</span>}
                </p>
                <p className="text-[11.5px] text-ink-soft/75 flex items-center gap-1.5 mt-auto">
                  <span className={`h-1.5 w-1.5 rounded-full ${p.disponible ? 'bg-teal' : 'bg-ink-soft/40'}`} />
                  {p.disponible ? 'En ligne' : 'Masqué'}
                  {p.date_ajout && <> · Publié le {formatDate(p.date_ajout)}</>}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-line mt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/vendeuse/produit/${p.id}/modifier`, { state: { produit: p } })}
                    className="flex-1 text-[11px] font-bold uppercase tracking-wide px-2 py-2 rounded-btn border border-teal text-teal-dark hover:bg-teal hover:text-white transition-colors"
                  >
                    Modifier
                  </button>

                  <button
                    type="button"
                    disabled={enCours === p.id}
                    onClick={() => toggleDisponibilite(p)}
                    className="flex-1 text-[11px] font-bold uppercase tracking-wide px-2 py-2 rounded-btn border border-line text-ink-soft/75 hover:border-teal hover:text-teal-dark transition-colors disabled:opacity-50"
                  >
                    {p.disponible ? 'Masquer' : 'Republier'}
                  </button>

                  {confirmationSuppression === p.id ? (
                    <button
                      type="button"
                      disabled={enCours === p.id}
                      onClick={() => supprimer(p)}
                      className="flex-1 text-[11px] font-bold uppercase tracking-wide px-2 py-2 rounded-btn bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      Confirmer ?
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmationSuppression(p.id)}
                      className="flex-1 text-[11px] font-bold uppercase tracking-wide px-2 py-2 rounded-btn border border-line text-ink-soft/75 hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {produits.length > 0 && conseilVisible && (
        <div className={`bg-white rounded-m ${SHADOW_CARD} p-5 flex items-start gap-4 relative`}>
          <span className="h-11 w-11 rounded-full bg-orange/10 text-orange flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 2l2.4 6.6L21 9l-5.2 4.3L17.4 21 12 17l-5.4 4 1.6-7.7L3 9l6.6-.4z" /></svg>
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Conseil</p>
            <p className="text-[13px] text-ink-soft/75 mt-0.5">
              Gardez vos articles à jour pour attirer plus d'acheteurs. Des photos claires et des descriptions précises font toute la différence !
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConseilVisible(false)}
            aria-label="Fermer"
            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-sable transition-colors shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      )}

    </ShellVendeuse>
  );
}
