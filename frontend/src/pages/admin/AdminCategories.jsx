// frontend/src/pages/admin/AdminCategories.jsx
import { useEffect, useState } from 'react';
import ShellAdmin from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';

const VIDE = { nom: '', ordre: 0 };

export default function AdminCategories() {
  const { moi, chargementSession } = useSession('admin');

  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [edition, setEdition] = useState(null); // catégorie en cours d'édition, ou null pour création
  const [formData, setFormData] = useState(VIDE);
  const [image, setImage] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState(null);

  const charger = () => {
    apiFetch('/admin/categories/')
      .then(async (res) => setCategories(res.ok ? await res.json() : []))
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    if (chargementSession) return;
    charger();
  }, [chargementSession]);

  const ouvrirCreation = () => {
    setEdition(null);
    setFormData(VIDE);
    setImage(null);
    setFormulaireOuvert(true);
  };

  const ouvrirEdition = (cat) => {
    setEdition(cat);
    setFormData({ nom: cat.nom, ordre: cat.ordre });
    setImage(null);
    setFormulaireOuvert(true);
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur(null);

    const body = new FormData();
    body.append('nom', formData.nom);
    body.append('ordre', formData.ordre);
    if (image) body.append('image', image);

    const url = edition ? `/admin/categories/${edition.id}/` : '/admin/categories/';
    const res = await apiFetch(url, { method: edition ? 'PATCH' : 'POST', body });

    if (res.ok) {
      const data = await res.json();
      setCategories((prev) =>
        edition ? prev.map((c) => (c.id === data.id ? data : c)) : [...prev, data].sort((a, b) => a.ordre - b.ordre)
      );
      setFormulaireOuvert(false);
    } else {
      const data = await res.json().catch(() => ({}));
      setErreur(Object.values(data).flat().join(' ') || "Impossible d'enregistrer cette catégorie.");
    }
    setEnvoiEnCours(false);
  };

  const supprimer = async (cat) => {
    const res = await apiFetch(`/admin/categories/${cat.id}/`, { method: 'DELETE' });
    if (res.status === 204) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setErreur(data.general || 'Impossible de supprimer cette catégorie.');
    }
    setConfirmationSuppression(null);
  };

  if (chargementSession || chargement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  return (
    <ShellAdmin active="categories" moi={moi} titre="Catégories">

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      <button
        onClick={ouvrirCreation}
        className="bg-orange hover:bg-orange-dark text-white px-5 py-2.5 rounded-btn font-bold text-sm transition-all shadow-sm hover:-translate-y-0.5 w-fit"
      >
        + Nouvelle catégorie
      </button>

      {formulaireOuvert && (
        <form onSubmit={soumettre} className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6 space-y-4 max-w-md">
          <h3 className="font-serif text-lg text-ink">{edition ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">Nom</label>
            <input
              required
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">Ordre d'affichage</label>
            <input
              type="number"
              value={formData.ordre}
              onChange={(e) => setFormData({ ...formData, ordre: e.target.value })}
              className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
              Image {edition && '(laisser vide pour ne pas changer)'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={envoiEnCours}
              className="bg-teal text-white px-5 py-2.5 rounded-btn text-sm font-bold hover:bg-teal-dark transition-colors disabled:opacity-50"
            >
              {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setFormulaireOuvert(false)}
              className="px-5 py-2.5 rounded-btn text-sm font-semibold text-ink-soft/70 hover:text-ink transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] overflow-hidden">
            <div className="h-28 bg-line/30">
              {c.image && <img src={c.image} alt={c.nom} className="h-full w-full object-cover" />}
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{c.nom}</p>
                <p className="text-[11px] text-ink-soft/50">Ordre {c.ordre}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => ouvrirEdition(c)}
                  className="text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-btn border border-line text-ink-soft/70 hover:border-teal hover:text-teal transition-colors"
                >
                  Modifier
                </button>
                {confirmationSuppression === c.id ? (
                  <button
                    onClick={() => supprimer(c)}
                    className="text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-btn bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Confirmer ?
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmationSuppression(c.id)}
                    className="text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-btn border border-line text-ink-soft/70 hover:border-red-400 hover:text-red-500 transition-colors"
                  >
                    Suppr.
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </ShellAdmin>
  );
}
