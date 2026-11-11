// frontend/src/pages/vendeuse/ModifierProduit.jsx
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import ShellVendeuse from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';

const TAILLES_PAR_CATEGORIE = {
  'Maman & Maternité': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '35', '36', '37', '38', '39', '40', '41', '42'],
  'Bébé (0-3 ans)': ['Prématuré', 'Naissance', '0-1 mois', '1-3 mois', '3-6 mois', '6-9 mois', '9-12 mois', '12-18 mois', '18-24 mois', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25'],
  'Enfant (3-9 ans)': ['3 ans', '4 ans', '5 ans', '6 ans', '7 ans', '8 ans', '9 ans', '26', '27', '28', '29', '30', '31', '32'],
  'Junior (10-15 ans)': ['10 ans', '11 ans', '12 ans', '13 ans', '14 ans', '15 ans', '16 ans', '33', '34', '35', '36', '37', '38'],
};
const TAILLES_GENERIQUES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const TAILLE_COLIS_LABELS = {
  s_m: 'S / M — jusqu\'à 2kg (1 500 FCFA)',
  l_xl: 'L / XL — 2 à 3kg (2 000 FCFA)',
  xxl: 'XXL — plus de 3kg (~3 000 FCFA)',
};

const ETATS = [
  { id: 'neuf_etiquette', label: 'Neuf avec étiquette' },
  { id: 'comme_neuf', label: 'Comme neuf' },
  { id: 'excellent', label: 'Excellent état' },
  { id: 'bon_etat', label: 'Bon état' },
];

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

export default function ModifierProduit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { moi, chargementSession } = useVendeuseSession();

  const [produit, setProduit] = useState(location.state?.produit || null);
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(!location.state?.produit);
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [succes, setSucces] = useState(false);

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    apiFetch('/categories/')
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setErreur("Impossible de charger les catégories."));
  }, []);

  useEffect(() => {
    if (produit) return;
    if (chargementSession) return;
    apiFetch('/mes-produits/')
      .then(async (res) => (res.ok ? await res.json() : []))
      .then((liste) => {
        const trouve = liste.find((p) => String(p.id) === String(id));
        if (trouve) setProduit(trouve);
        else setErreur('Article introuvable.');
      })
      .finally(() => setChargement(false));
  }, [produit, chargementSession, id]);

  useEffect(() => {
    if (produit && !formData) {
      setFormData({
        titre: produit.titre || '',
        description: produit.description || '',
        categorie: produit.categorie ? String(produit.categorie) : '',
        etat: produit.etat || 'excellent',
        taille: produit.taille || '',
        quantite_disponible: produit.quantite_disponible || 1,
        taille_colis: produit.taille_colis || 's_m',
        prix_vendeur: produit.prix_vendeur || '',
        caution: produit.caution || '',
        bonne_affaire: Boolean(produit.bonne_affaire),
      });
    }
  }, [produit, formData]);

  const isLocation = produit?.type_offre === 'location';
  const categorieNomRacine = produit?.categorie_racine_nom;
  const taillesDisponibles = TAILLES_PAR_CATEGORIE[categorieNomRacine] || TAILLES_GENERIQUES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    const payload = { ...formData };
    if (!isLocation) delete payload.caution;

    const res = await apiFetch(`/mes-produits/${id}/modifier/`, { method: 'PATCH', body: payload });
    if (res.ok) {
      setSucces(true);
      setTimeout(() => navigate('/vendeuse/mes-articles'), 900);
    } else {
      const data = await res.json().catch(() => ({}));
      const details = Object.entries(data).map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
      setErreur(details || "Le serveur a refusé la modification.");
    }
    setEnvoiEnCours(false);
  };

  if (chargementSession || chargement || !formData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  if (!produit) {
    return (
      <ShellVendeuse active="articles" moi={moi} titre="Modifier l'article">
        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-10 text-center">
          <p className="text-ink-soft/75 text-sm mb-4">{erreur || 'Article introuvable.'}</p>
          <Link to="/vendeuse/mes-articles" className="text-teal-dark font-semibold text-sm hover:underline">
            Retour à mes articles
          </Link>
        </div>
      </ShellVendeuse>
    );
  }

  return (
    <ShellVendeuse active="articles" moi={moi} titre="Modifier l'article">
      <p className="text-[13px] text-ink-soft/75 -mt-2">
        Mettez à jour les informations de « {produit.titre} ». La photo actuelle est conservée.
      </p>

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100 whitespace-pre-line">{erreur}</div>
      )}
      {succes && (
        <div className="p-4 text-sm bg-teal/10 text-teal-dark rounded-btn border border-teal/20">
          Article mis à jour !
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6 space-y-5">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-btn bg-line/40 overflow-hidden shrink-0">
              {produit.image_principale && <img loading="lazy" decoding="async" src={produit.image_principale} alt="" className="h-full w-full object-cover" />}
            </div>
            <p className="text-[12px] text-ink-soft/75 self-center">
              Changement de photos non disponible depuis cette page pour le moment — contactez-nous si besoin.
            </p>
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-ink mb-1.5">Titre de l'annonce</label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-ink mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-bold text-ink mb-1.5">Sous-catégorie</label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal"
              >
                {categories.map((cat) => (
                  <optgroup key={cat.id} label={cat.nom}>
                    {(cat.sous_categories || []).map((s) => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-ink mb-1.5">État</label>
              <select
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal"
              >
                {ETATS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-bold text-ink mb-1.5">Taille</label>
              <select
                value={formData.taille}
                onChange={(e) => setFormData({ ...formData, taille: e.target.value })}
                className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal"
              >
                <option value="">Sans taille</option>
                {taillesDisponibles.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-ink mb-1.5">Quantité disponible</label>
              <input
                type="number"
                min="1"
                value={formData.quantite_disponible}
                onChange={(e) => setFormData({ ...formData, quantite_disponible: e.target.value })}
                className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-ink mb-1.5">Taille du colis</label>
            <select
              value={formData.taille_colis}
              onChange={(e) => setFormData({ ...formData, taille_colis: e.target.value })}
              className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal"
            >
              {Object.entries(TAILLE_COLIS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2.5 text-[13px] text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={formData.bonne_affaire}
              onChange={(e) => setFormData({ ...formData, bonne_affaire: e.target.checked })}
              className="h-4 w-4 accent-teal"
            />
            Mettre en avant comme « Bonne affaire »
          </label>
        </div>

        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6 space-y-5 h-fit">
          <div>
            <label className="block text-[12.5px] font-bold text-ink mb-1.5">
              {isLocation ? 'Prix de location / jour (FCFA)' : 'Votre prix de vente (FCFA)'}
            </label>
            <input
              type="number"
              min="0"
              value={formData.prix_vendeur}
              onChange={(e) => setFormData({ ...formData, prix_vendeur: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal"
            />
          </div>

          {isLocation && (
            <div>
              <label className="block text-[12.5px] font-bold text-ink mb-1.5">Caution demandée (FCFA)</label>
              <input
                type="number"
                min="0"
                value={formData.caution}
                onChange={(e) => setFormData({ ...formData, caution: e.target.value })}
                className="w-full px-4 py-2.5 rounded-btn border border-line bg-white text-sm focus:outline-none focus:border-teal"
              />
            </div>
          )}

          <div className="pt-3 border-t border-line text-[12.5px] text-ink-soft/75">
            Prix public affiché : <span className="font-bold text-ink">{formatFCFA(produit.prix_final_public)}</span>
          </div>

          <button
            type="submit"
            disabled={envoiEnCours}
            className="w-full bg-orange hover:bg-orange-dark text-white font-bold text-sm py-3 rounded-full transition-colors disabled:opacity-50"
          >
            {envoiEnCours ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
          <Link
            to="/vendeuse/mes-articles"
            className="block text-center text-ink-soft/75 text-sm font-semibold hover:text-ink transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </ShellVendeuse>
  );
}
