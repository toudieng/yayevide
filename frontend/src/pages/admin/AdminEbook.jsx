// frontend/src/pages/admin/AdminEbook.jsx
import { useEffect, useState } from 'react';
import ShellAdmin from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const VIDE = { titre: '', description: '', prix: '', nb_pages: '' };

export default function AdminEbook() {
  const { moi, chargementSession } = useSession('admin');

  const [ebooks, setEbooks] = useState([]);
  const [achats, setAchats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);

  const [edition, setEdition] = useState(null);
  const [form, setForm] = useState(VIDE);
  const [fichiers, setFichiers] = useState({ couverture: null, fichier_apercu: null, fichier_complet: null });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = () => {
    Promise.all([apiFetch('/admin/ebook/'), apiFetch('/admin/ebook-achats/')])
      .then(async ([resEbooks, resAchats]) => {
        setEbooks(resEbooks.ok ? await resEbooks.json() : []);
        setAchats(resAchats.ok ? await resAchats.json() : []);
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    if (chargementSession) return;
    charger();
  }, [chargementSession]);

  const ouvrirEdition = (eb) => {
    setEdition(eb);
    setForm({ titre: eb.titre, description: eb.description, prix: eb.prix, nb_pages: eb.nb_pages || '' });
    setFichiers({ couverture: null, fichier_apercu: null, fichier_complet: null });
  };

  const nouveauEbook = () => {
    setEdition('nouveau');
    setForm(VIDE);
    setFichiers({ couverture: null, fichier_apercu: null, fichier_complet: null });
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur(null);
    setMessage(null);

    const data = new FormData();
    data.append('titre', form.titre);
    data.append('description', form.description);
    data.append('prix', form.prix);
    if (form.nb_pages) data.append('nb_pages', form.nb_pages);
    if (fichiers.couverture) data.append('couverture', fichiers.couverture);
    if (fichiers.fichier_apercu) data.append('fichier_apercu', fichiers.fichier_apercu);
    if (fichiers.fichier_complet) data.append('fichier_complet', fichiers.fichier_complet);

    const estNouveau = edition === 'nouveau';
    const url = estNouveau ? '/admin/ebook/' : `/admin/ebook/${edition.id}/`;
    const res = await apiFetch(url, { method: estNouveau ? 'POST' : 'PATCH', body: data });

    if (res.ok) {
      const saved = await res.json();
      setEbooks((prev) => (estNouveau ? [saved, ...prev] : prev.map((e) => (e.id === saved.id ? saved : e))));
      setMessage('E-book enregistré.');
      setEdition(null);
    } else {
      const err = await res.json().catch(() => ({}));
      setErreur(Object.values(err).flat().join(' ') || "Impossible d'enregistrer l'e-book.");
    }
    setEnvoiEnCours(false);
  };

  const toggleActif = async (eb) => {
    const res = await apiFetch(`/admin/ebook/${eb.id}/`, { method: 'PATCH', body: { actif: !eb.actif } });
    if (res.ok) {
      const updated = await res.json();
      setEbooks((prev) => prev.map((e) => (e.id === eb.id ? updated : e)));
    }
  };

  if (chargementSession || chargement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  return (
    <ShellAdmin active="ebook" moi={moi} titre="E-book">

      {erreur && <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>}
      {message && <div className="p-4 text-sm bg-teal/10 text-teal rounded-btn border border-teal/20">{message}</div>}

      {!edition && (
        <button
          onClick={nouveauEbook}
          className="bg-orange hover:bg-orange-dark text-white px-5 py-2.5 rounded-btn font-bold text-sm transition-all shadow-sm hover:-translate-y-0.5 w-fit"
        >
          + Nouvel e-book
        </button>
      )}

      {edition && (
        <form onSubmit={soumettre} className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6 space-y-4 max-w-lg">
          <h3 className="font-serif text-lg text-ink">{edition === 'nouveau' ? 'Nouvel e-book' : "Modifier l'e-book"}</h3>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">Titre</label>
            <input
              required
              type="text"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">Prix (FCFA)</label>
              <input
                required
                type="number"
                value={form.prix}
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
                className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">Nb pages</label>
              <input
                type="number"
                value={form.nb_pages}
                onChange={(e) => setForm({ ...form, nb_pages: e.target.value })}
                className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
              Couverture (image) {edition !== 'nouveau' && '— laisser vide pour ne pas changer'}
            </label>
            <input type="file" accept="image/*" onChange={(e) => setFichiers({ ...fichiers, couverture: e.target.files?.[0] || null })} className="w-full text-sm" />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
              PDF d'aperçu (3-4 pages, public) {edition !== 'nouveau' && '— laisser vide pour ne pas changer'}
            </label>
            <input type="file" accept="application/pdf" onChange={(e) => setFichiers({ ...fichiers, fichier_apercu: e.target.files?.[0] || null })} className="w-full text-sm" />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
              PDF complet (protégé — servi uniquement après paiement) {edition !== 'nouveau' && '— laisser vide pour ne pas changer'}
            </label>
            <input type="file" accept="application/pdf" onChange={(e) => setFichiers({ ...fichiers, fichier_complet: e.target.files?.[0] || null })} className="w-full text-sm" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={envoiEnCours} className="bg-teal text-white px-5 py-2.5 rounded-btn text-sm font-bold hover:bg-teal-dark transition-colors disabled:opacity-50">
              {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setEdition(null)} className="px-5 py-2.5 rounded-btn text-sm font-semibold text-ink-soft/70 hover:text-ink transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">E-books</h3>
        {ebooks.length === 0 ? (
          <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-16 text-center">
            <p className="text-ink-soft/60 text-sm">Aucun e-book pour le moment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] divide-y divide-line overflow-hidden">
            {ebooks.map((eb) => (
              <div key={eb.id} className="flex items-center gap-4 p-4 flex-wrap md:flex-nowrap">
                <div className="h-14 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                  {eb.couverture && <img src={eb.couverture} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-ink truncate">{eb.titre}</p>
                  <p className="text-[12px] text-ink-soft/60">
                    {formatFCFA(eb.prix)} · {eb.fichier_complet ? 'PDF complet ✓' : 'PDF complet manquant'} · {eb.fichier_apercu ? 'Aperçu ✓' : 'Aperçu manquant'}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${eb.actif ? 'bg-teal/10 text-teal' : 'bg-line text-ink-soft/60'}`}>
                  {eb.actif ? 'En ligne' : 'Masqué'}
                </span>
                <button onClick={() => toggleActif(eb)} className="text-[11px] font-bold uppercase px-3 py-2 rounded-btn border border-line text-ink-soft/70 hover:border-teal hover:text-teal transition-colors whitespace-nowrap">
                  {eb.actif ? 'Masquer' : 'Publier'}
                </button>
                <button onClick={() => ouvrirEdition(eb)} className="text-[11px] font-bold uppercase px-3 py-2 rounded-btn border border-line text-ink-soft/70 hover:border-teal hover:text-teal transition-colors whitespace-nowrap">
                  Modifier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Achats ({achats.length})</h3>
        {achats.length === 0 ? (
          <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-12 text-center">
            <p className="text-ink-soft/60 text-sm">Aucun achat pour le moment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] divide-y divide-line overflow-hidden">
            {achats.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-4 flex-wrap md:flex-nowrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-ink truncate">{a.email}</p>
                  <p className="text-[12px] text-ink-soft/60">{a.ebook_titre} · {formatDate(a.date_creation)}</p>
                </div>
                <p className="text-sm font-bold text-ink whitespace-nowrap">{formatFCFA(a.prix_paye)}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${a.statut_paiement === 'paye' ? 'bg-teal text-white' : 'bg-orange/10 text-orange'}`}>
                  {a.statut_paiement === 'paye' ? 'Payé' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </ShellAdmin>
  );
}
