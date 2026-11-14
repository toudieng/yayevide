// frontend/src/pages/admin/AdminEbook.jsx
import { useEffect, useState } from 'react';
import ShellAdmin from '../../components/admin/ShellAdmin';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';
import EtatVide from '../../components/ui/EtatVide';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const VIDE = { titre: '', description: '', prix: '', nb_pages: '' };

const MODES = { wave: 'Wave', orange_money: 'Orange Money', mixx: 'Mixx by Yas' };
const STATUTS = {
  a_verifier: { libelle: 'À vérifier', classe: 'bg-orange text-ink' },
  paye: { libelle: 'Payé', classe: 'bg-teal-dark text-white' },
  echoue: { libelle: 'Refusé', classe: 'bg-red-50 text-red-700' },
  en_attente: { libelle: 'En attente', classe: 'bg-line text-ink' },
};

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
  const [actionAchat, setActionAchat] = useState(null);

  // Paiement manuel : l'équipe retrouve (ou non) la transaction sur son relevé
  const traiterAchat = async (achat, action) => {
    const question = action === 'confirmer'
      ? `Confirmer le paiement de ${achat.email} (référence ${achat.reference_client || '—'}) ? Le lien de téléchargement lui sera envoyé par e-mail.`
      : `Refuser ce paiement ? ${achat.email} sera prévenue par e-mail qu'il n'a pas été retrouvé.`;
    if (!window.confirm(question)) return;
    setActionAchat(achat.id);
    setErreur(null);
    try {
      const res = await apiFetch(`/admin/ebook-achats/${achat.id}/${action}/`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAchats((liste) => liste.map((a) => (a.id === achat.id ? data : a)));
        setMessage(action === 'confirmer' ? 'Paiement confirmé : le lien est parti par e-mail.' : "Paiement refusé : l'acheteuse est prévenue.");
      } else {
        setErreur(data.general || "L'action n'a pas pu être enregistrée.");
      }
    } catch {
      setErreur('Impossible de joindre le serveur.');
    } finally {
      setActionAchat(null);
    }
  };

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
      <SqueletteTableau />
    );
  }

  return (
    <ShellAdmin active="ebook" moi={moi} titre="E-book">

      {erreur && <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>}
      {message && <div className="p-4 text-sm bg-teal/10 text-teal-dark rounded-btn border border-teal/20">{message}</div>}

      {!edition && (
        <button
          onClick={nouveauEbook}
          className="bg-clay-dark hover:bg-ink text-white px-5 py-2.5 rounded-btn font-bold text-sm transition-all shadow-sm hover:-translate-y-0.5 w-fit"
        >
          + Nouvel e-book
        </button>
      )}

      {edition && (
        <form onSubmit={soumettre} className={`bg-white rounded-m ${SHADOW_CARD} p-6 space-y-4 max-w-lg`}>
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
            <label htmlFor="ebook-description" className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
              Description <span className="normal-case tracking-normal font-semibold text-ink-soft">(facultative)</span>
            </label>
            <textarea
              id="ebook-description"
              aria-describedby="ebook-description-aide"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
            />
            <p id="ebook-description-aide" className="mt-1.5 text-[12px] text-ink-soft">
              Laissez vide pour afficher le texte de présentation par défaut sur la page e-book.
            </p>
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
            <button type="button" onClick={() => setEdition(null)} className="px-5 py-2.5 rounded-btn text-sm font-semibold text-ink-soft/75 hover:text-ink transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">E-books</h3>
        {ebooks.length === 0 ? (
          <div className={`bg-white rounded-m ${SHADOW_CARD} p-16 text-center`}>
            <EtatVide compact bordure={false} icone="boite" texte="Aucun e-book pour le moment." />
          </div>
        ) : (
          <div className={`bg-white rounded-m ${SHADOW_CARD} divide-y divide-line overflow-hidden`}>
            {ebooks.map((eb) => (
              <div key={eb.id} className="flex items-center gap-4 p-4 flex-wrap md:flex-nowrap">
                <div className="h-14 w-11 rounded-btn bg-line/40 overflow-hidden shrink-0">
                  {eb.couverture && <img loading="lazy" decoding="async" src={eb.couverture} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-ink truncate">{eb.titre}</p>
                  <p className="text-[12px] text-ink-soft/75">
                    {formatFCFA(eb.prix)} · {eb.fichier_complet ? 'PDF complet ✓' : 'PDF complet manquant'} · {eb.fichier_apercu ? 'Aperçu ✓' : 'Aperçu manquant'}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${eb.actif ? 'bg-teal/10 text-teal-dark' : 'bg-line text-ink-soft/75'}`}>
                  {eb.actif ? 'En ligne' : 'Masqué'}
                </span>
                <button onClick={() => toggleActif(eb)} className="text-[11px] font-bold uppercase px-3 py-2 rounded-btn border border-line text-ink-soft/75 hover:border-teal hover:text-teal-dark transition-colors whitespace-nowrap">
                  {eb.actif ? 'Masquer' : 'Publier'}
                </button>
                <button onClick={() => ouvrirEdition(eb)} className="text-[11px] font-bold uppercase px-3 py-2 rounded-btn border border-line text-ink-soft/75 hover:border-teal hover:text-teal-dark transition-colors whitespace-nowrap">
                  Modifier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-1">Achats ({achats.length})</h3>
        <p className="text-[13px] text-ink-soft mb-4">
          Pour chaque achat « À vérifier », retrouvez la transaction (montant et référence) sur le relevé du moyen de paiement, puis confirmez ou refusez.
        </p>
        {achats.length === 0 ? (
          <div className={`bg-white rounded-m ${SHADOW_CARD} p-12 text-center`}>
            <EtatVide compact bordure={false} icone="boite" texte="Aucun achat pour le moment." />
          </div>
        ) : (
          <div className={`bg-white rounded-m ${SHADOW_CARD} divide-y divide-line overflow-hidden`}>
            {achats.map((a) => {
              const statut = STATUTS[a.statut_paiement] || STATUTS.en_attente;
              return (
                <div key={a.id} className="flex items-start gap-4 p-4 flex-wrap md:flex-nowrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-semibold text-ink break-all">{a.email}</p>
                    <p className="text-[12px] text-ink-soft">{a.ebook_titre} · {formatDate(a.date_creation)}</p>
                    {(a.reference_client || a.mode_paiement) && (
                      <p className="text-[12.5px] text-ink mt-1">
                        {MODES[a.mode_paiement] || a.mode_paiement}
                        {a.telephone && <> · depuis le <span className="font-semibold">{a.telephone}</span></>}
                        {a.reference_client && <> · réf. <span className="font-mono font-semibold">{a.reference_client}</span></>}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-ink whitespace-nowrap">{formatFCFA(a.prix_paye)}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${statut.classe}`}>
                    {statut.libelle}
                  </span>
                  {a.statut_paiement === 'a_verifier' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        type="button" onClick={() => traiterAchat(a, 'confirmer')} disabled={actionAchat === a.id}
                        className="flex-1 md:flex-none min-h-[40px] px-4 rounded-btn bg-teal-dark hover:bg-ink text-white text-[12.5px] font-bold transition-colors disabled:opacity-50"
                      >
                        Confirmer
                      </button>
                      <button
                        type="button" onClick={() => traiterAchat(a, 'refuser')} disabled={actionAchat === a.id}
                        className="flex-1 md:flex-none min-h-[40px] px-4 rounded-btn border border-line text-ink hover:border-red-600 hover:text-red-700 text-[12.5px] font-bold transition-colors disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </ShellAdmin>
  );
}
