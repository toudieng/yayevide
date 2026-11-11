// frontend/src/pages/Checkout.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useCart } from '../context/CartContext';
import { apiFetch } from '../utils/api';

const MODES_PAIEMENT = [
  {
    value: 'wave',
    label: 'Wave',
    couleur: 'bg-[#1DC8E0]',
    icone: 'M4 12a8 8 0 1116 0 8 8 0 01-16 0z M9 9c0-1 .8-2 3-2s3 1 3 2-1 1.5-3 2-3 1-3 2 1 2 3 2 3-1 3-2',
  },
  {
    value: 'orange_money',
    label: 'Orange Money',
    couleur: 'bg-orange',
    icone: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 7v5l3 3',
  },
  {
    value: 'especes',
    label: 'Espèces',
    couleur: 'bg-teal',
    icone: 'M3 8h18v9H3zM3 8l9-4 9 4M12 12.5a2 2 0 100-4 2 2 0 000 4z',
  },
];

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [verification, setVerification] = useState('chargement');
  const [etape, setEtape] = useState('adresse');
  const [zones, setZones] = useState([]);
  const [fraisLivraison, setFraisLivraison] = useState(0);
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [commandesCreees, setCommandesCreees] = useState([]);

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    adresse: '',
    complement: '',
    zone: '',
  });
  const [modePaiement, setModePaiement] = useState('wave');

  useEffect(() => {
    apiFetch('/moi/')
      .then((res) => {
        if (!res.ok) {
          setVerification('redirection');
          navigate('/connexion', { state: { from: '/checkout' } });
          return null;
        }
        return res.json();
      })
      .then((moi) => {
        if (!moi) return;
        if (items.length === 0) {
          setVerification('redirection');
          navigate('/panier');
          return;
        }
        setForm((f) => ({
          ...f,
          prenom: moi.first_name || '',
          nom: moi.last_name || '',
          adresse: moi.adresse_sauvegardee || '',
          complement: moi.complement_adresse_sauvegarde || '',
          zone: moi.zone_sauvegardee || '',
        }));
        setVerification('ok');
      })
      .catch(() => {
        setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.');
        setVerification('ok');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    apiFetch('/zones-livraison/')
      .then(async (res) => setZones(res.ok ? await res.json() : []))
      .catch(() => setZones([]));
  }, []);

  useEffect(() => {
    if (!form.zone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se redéclenche à chaque changement de zone, pas seulement au montage
      setFraisLivraison(0);
      return;
    }
    apiFetch('/estimer-livraison/', {
      method: 'POST',
      body: { items: items.map((i) => ({ produit_id: i.id, quantite: i.quantite, date_debut: i.dateDebut, date_fin: i.dateFin })), zone_livraison: form.zone },
    })
      .then(async (res) => setFraisLivraison(res.ok ? (await res.json()).frais_livraison_estimes : 0))
      .catch(() => setFraisLivraison(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.zone]);

  const validerAdresse = async (e) => {
    e.preventDefault();
    setErreur(null);
    await apiFetch('/mon-adresse/', { method: 'PATCH', body: form }).catch(() => {});
    setEtape('paiement');
  };

  const passerCommande = async () => {
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const response = await apiFetch('/commandes/', {
        method: 'POST',
        body: {
          adresse_livraison: form.adresse,
          complement_adresse: form.complement,
          zone_livraison: form.zone,
          mode_paiement_choisi: modePaiement,
          items: items.map((i) => ({ produit_id: i.id, quantite: i.quantite, date_debut: i.dateDebut, date_fin: i.dateFin })),
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCommandesCreees(data.commandes);
        clear();
        setEtape('confirmation');
      } else {
        setErreur(Object.values(data).flat().join(' ') || 'Une erreur est survenue.');
      }
    } catch {
      setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  if (verification === 'chargement' || verification === 'redirection') {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
        </div>
      </Layout>
    );
  }

  if (etape === 'confirmation') {
    return (
      <Layout>
        <div className="max-w-[600px] mx-auto px-6 py-20">
          <div className="text-center mb-8">
            <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-orange/10 flex items-center justify-center text-orange animate-pulse-dot">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl text-ink mb-3">Commande en cours de confirmation</h1>
            <p className="text-sm text-ink-soft/75 leading-relaxed">
              Nous vérifions la disponibilité de vos articles auprès des vendeuses. Elles disposent de{' '}
              <span className="font-bold text-ink">24 heures maximum</span> pour répondre.
              Vous serez notifiée dès que votre commande sera prête — le paiement se fera à la livraison.
            </p>
          </div>

          <div className="bg-cream border border-line rounded-m overflow-hidden mb-8">
            <p className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-soft/75 border-b border-line">
              Vos articles
            </p>
            <div className="divide-y divide-line">
              {commandesCreees.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-ink font-medium truncate pr-3">{c.produit_titre}</span>
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-orange whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange animate-pulse-dot" />
                    En attente
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/"
            className="block text-center bg-ink text-cream rounded-btn py-3.5 text-sm font-bold uppercase tracking-wide hover:bg-clay transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </Layout>
    );
  }

  const totalGeneral = subtotal + fraisLivraison;

  return (
    <Layout>
      <div className="max-w-[900px] mx-auto px-6 md:px-12 py-12">

        <div className="flex items-center gap-3 mb-10 text-[12.5px] font-bold uppercase tracking-wide">
          {['Adresse', 'Paiement'].map((label, i) => {
            const actif = (i === 0 && etape === 'adresse') || (i === 1 && etape === 'paiement');
            const complete = i === 0 && etape === 'paiement';
            return (
              <div key={label} className="flex items-center gap-3">
                {i > 0 && <span className="w-8 h-px bg-line" />}
                <span className={`flex items-center gap-2 ${actif ? 'text-ink' : complete ? 'text-teal-dark' : 'text-ink-soft/75'}`}>
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] ${
                    actif ? 'bg-ink text-cream' : complete ? 'bg-teal text-white' : 'bg-line text-ink-soft/75'
                  }`}>
                    {complete ? '✓' : i + 1}
                  </span>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {erreur && (
          <div className="p-4 mb-6 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
        )}

        <div className="grid md:grid-cols-[1fr_320px] gap-10">

          <div>
            {etape === 'adresse' && (
              <form onSubmit={validerAdresse} className="bg-cream border border-line rounded-m p-7 space-y-5">
                <h2 className="font-serif text-xl text-ink mb-1">Adresse de livraison</h2>
                <p className="text-[12.5px] text-ink-soft/75 mb-5">
                  {form.adresse ? 'Modifiez si besoin, ou continuez avec cette adresse.' : 'Renseignez où vous souhaitez être livrée.'}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Prénom</label>
                    <input
                      type="text" required value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Nom</label>
                    <input
                      type="text" required value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Adresse (numéro et rue)</label>
                  <input
                    type="text" required value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    placeholder="Quartier, rue, point de repère..."
                    className="w-full px-4 py-3 bg-white border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
                    Complément d'adresse <span className="font-normal normal-case text-ink-soft/75">(facultatif)</span>
                  </label>
                  <input
                    type="text" value={form.complement}
                    onChange={(e) => setForm({ ...form, complement: e.target.value })}
                    placeholder="Bâtiment, étage, indications..."
                    className="w-full px-4 py-3 bg-white border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Zone</label>
                  <select
                    required value={form.zone}
                    onChange={(e) => setForm({ ...form, zone: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                  >
                    <option value="">Sélectionnez votre zone</option>
                    {zones.map((z) => (
                      <option key={z.code} value={z.code}>{z.nom}</option>
                    ))}
                  </select>
                  {zones.find((z) => z.code === form.zone) && (
                    <p className="text-[12px] text-ink-soft/75 mt-1.5">
                      {zones.find((z) => z.code === form.zone).localites}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Link to="/panier" className="px-6 py-3 rounded-full border border-line text-sm font-bold text-ink-soft/75 hover:border-ink/40 transition-colors">
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    className="flex-1 bg-ink text-cream rounded-full py-3 text-sm font-bold hover:bg-clay transition-colors"
                  >
                    Enregistrer l'adresse et continuer
                  </button>
                </div>
              </form>
            )}

            {etape === 'paiement' && (
              <div className="bg-cream border border-line rounded-m p-7 space-y-5">
                <h2 className="font-serif text-xl text-ink mb-1">Moyen de paiement à la livraison</h2>
                <p className="text-[12.5px] text-ink-soft/75 mb-5">
                  Vous ne payez rien maintenant — choisissez comment vous réglerez le livreur à la remise.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {MODES_PAIEMENT.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setModePaiement(mode.value)}
                      className={`flex flex-col items-center gap-2.5 p-5 rounded-m border-2 transition-all ${
                        modePaiement === mode.value ? 'border-teal bg-teal/5' : 'border-line hover:border-ink/30'
                      }`}
                    >
                      <span className={`h-11 w-11 rounded-full ${mode.couleur} text-white flex items-center justify-center`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                          <path d={mode.icone} />
                        </svg>
                      </span>
                      <span className="text-[12.5px] font-bold text-ink text-center">{mode.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEtape('adresse')}
                    className="px-6 py-3 rounded-full border border-line text-sm font-bold text-ink-soft/75 hover:border-ink/40 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={passerCommande}
                    disabled={envoiEnCours}
                    className="flex-1 bg-ink text-cream rounded-full py-3 text-sm font-bold hover:bg-clay transition-colors disabled:opacity-60"
                  >
                    {envoiEnCours ? 'Envoi en cours...' : 'Commander'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-sable border border-line rounded-m p-6 h-fit space-y-4">
            <h3 className="font-serif text-lg text-ink">Récapitulatif</h3>
            <div className="divide-y divide-line">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between py-2.5 text-[13px]">
                  <span className="text-ink-soft/75 truncate pr-3">{item.quantite} × {item.titre}</span>
                  <span className="font-semibold text-ink whitespace-nowrap">{formatFCFA(item.prixUnitaire * item.quantite)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[13px] text-ink-soft/75 pt-2">
              <span>Sous-total</span>
              <span>{formatFCFA(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-ink-soft/75">
              <span>Livraison estimée</span>
              <span>{form.zone ? formatFCFA(fraisLivraison) : '—'}</span>
            </div>
            <div className="flex justify-between text-[16px] font-bold text-ink pt-3 border-t border-line">
              <span>Total à payer à la livraison</span>
              <span>{formatFCFA(totalGeneral)}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
