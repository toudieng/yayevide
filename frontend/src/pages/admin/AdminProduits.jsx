// frontend/src/pages/admin/AdminProduits.jsx
import { useEffect, useMemo, useState } from 'react';
import ShellAdmin from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

export default function AdminProduits() {
  const { moi, chargementSession } = useSession('admin');

  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [confirmationSuppression, setConfirmationSuppression] = useState(null);
  const [enCours, setEnCours] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/admin/produits/')
      .then(async (res) => setProduits(res.ok ? await res.json() : []))
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  }, [chargementSession]);

  const produitsFiltres = useMemo(() => {
    if (!recherche.trim()) return produits;
    const q = recherche.trim().toLowerCase();
    return produits.filter((p) => p.titre.toLowerCase().includes(q) || p.boutique_nom?.toLowerCase().includes(q));
  }, [produits, recherche]);

  const toggleDisponibilite = async (produit) => {
    setEnCours(produit.id);
    const res = await apiFetch(`/admin/produits/${produit.id}/`, {
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
    setMessage(null);
    const res = await apiFetch(`/admin/produits/${produit.id}/`, { method: 'DELETE' });
    if (res.status === 204) {
      setProduits((prev) => prev.filter((p) => p.id !== produit.id));
    } else if (res.ok) {
      const data = await res.json();
      setProduits((prev) => prev.map((p) => (p.id === produit.id ? { ...p, disponible: false } : p)));
      setMessage(data.message);
    } else {
      setErreur("Impossible de traiter cet article.");
    }
    setConfirmationSuppression(null);
    setEnCours(null);
  };

  if (chargementSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  return (
    <ShellAdmin active="produits" moi={moi} titre="Produits">

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}
      {message && (
        <div className="p-4 text-sm bg-teal/10 text-teal-dark rounded-btn border border-teal/20">{message}</div>
      )}

      <input
        type="text"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher par titre ou boutique..."
        className="w-full max-w-md px-4 py-2.5 bg-cream border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
      />

      {chargement ? (
        <div className="flex justify-center py-16">
          <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-16 text-center">
          <p className="text-ink-soft/75 text-sm">Aucun article ne correspond.</p>
        </div>
      ) : (
        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] divide-y divide-line overflow-hidden">
          {produitsFiltres.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4 flex-wrap md:flex-nowrap">
              <div className="h-11 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                {p.image_principale && <img loading="lazy" decoding="async" src={p.image_principale} alt="" className="h-full w-full object-cover" />}
              </div>

              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-ink truncate">{p.titre}</p>
                <p className="text-[12px] text-ink-soft/75">{p.boutique_nom} · {p.categorie_nom || 'Sans catégorie'}</p>
              </div>

              <p className="text-sm font-bold text-ink whitespace-nowrap">{formatFCFA(p.prix_final_public)}</p>

              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${p.disponible ? 'bg-teal/10 text-teal-dark' : 'bg-line text-ink-soft/75'}`}>
                {p.disponible ? 'En ligne' : 'Masqué'}
              </span>

              {p.type_offre === 'location' && (
                <button
                  disabled={enCours === p.id}
                  onClick={() => toggleDisponibilite(p)}
                  className={`text-[11px] font-bold uppercase tracking-wide px-3 py-2 rounded-btn border transition-colors disabled:opacity-50 whitespace-nowrap ${
                    p.disponible
                      ? 'border-orange text-orange hover:bg-orange hover:text-white'
                      : 'border-teal text-teal-dark hover:bg-teal hover:text-white'
                  }`}
                >
                  {p.disponible ? 'Marquer loué' : 'Marquer disponible'}
                </button>
              )}

              {confirmationSuppression === p.id ? (
                <button
                  disabled={enCours === p.id}
                  onClick={() => supprimer(p)}
                  className="text-[11px] font-bold uppercase tracking-wide px-3 py-2 rounded-btn bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Confirmer ?
                </button>
              ) : (
                <button
                  onClick={() => setConfirmationSuppression(p.id)}
                  className="text-[11px] font-bold uppercase tracking-wide px-3 py-2 rounded-btn border border-line text-ink-soft/75 hover:border-red-400 hover:text-red-500 transition-colors whitespace-nowrap"
                >
                  Retirer
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </ShellAdmin>
  );
}
