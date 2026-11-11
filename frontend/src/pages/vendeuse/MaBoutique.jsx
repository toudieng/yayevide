// frontend/src/pages/vendeuse/MaBoutique.jsx
import { useEffect, useState } from 'react';
import ShellVendeuse from '../../components/vendeuse/ShellVendeuse';
import { useVendeuseSession } from '../../hooks/useVendeuseSession';
import { apiFetch } from '../../utils/api';

export default function MaBoutique() {
  const { moi, chargementSession } = useVendeuseSession();

  const [notifPref, setNotifPref] = useState('email');

  const [boutique, setBoutique] = useState(null);
  const [form, setForm] = useState({ nom_boutique: '', description: '', zone: '', visible: true, locations_activees: true });
  const [zones, setZones] = useState([]);
  const [banniereFichier, setBanniereFichier] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (chargementSession) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec la session chargée de façon asynchrone, pas un miroir de props
    if (moi?.notification_preference) setNotifPref(moi.notification_preference);
    Promise.all([
      apiFetch('/ma-boutique/').then((r) => (r.ok ? r.json() : null)),
      apiFetch('/zones-livraison/').then((r) => (r.ok ? r.json() : [])),
    ]).then(([b, z]) => {
      setZones(z);
      if (b) {
        setBoutique(b);
        setForm({
          nom_boutique: b.nom_boutique || '',
          description: b.description || '',
          zone: b.zone || '',
          visible: b.visible,
          locations_activees: b.locations_activees,
        });
      }
      setChargement(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargementSession]);

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    setErreur(null);
    setMessage(null);

    const data = new FormData();
    data.append('nom_boutique', form.nom_boutique);
    data.append('description', form.description);
    data.append('zone', form.zone);
    data.append('visible', form.visible);
    data.append('locations_activees', form.locations_activees);
    if (banniereFichier) data.append('banniere', banniereFichier);

    const res = await apiFetch('/ma-boutique/', { method: 'PATCH', body: data });
    if (res.ok) {
      const updated = await res.json();
      setBoutique(updated);
      setMessage('Boutique mise à jour.');
    } else {
      const err = await res.json().catch(() => ({}));
      setErreur(Object.values(err).flat().join(' ') || 'Impossible d\'enregistrer.');
    }
    setEnregistrement(false);
  };

  const changerNotification = async (valeur) => {
    setNotifPref(valeur);
    await apiFetch('/mon-adresse/', { method: 'PATCH', body: { notification_preference: valeur } });
  };

  if (chargementSession || chargement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  if (!boutique) {
    return (
      <ShellVendeuse active="boutique" moi={moi} titre="Ma boutique">
        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-14 text-center">
          <p className="text-ink-soft/60 text-sm">Aucune boutique associée à ce compte.</p>
        </div>
      </ShellVendeuse>
    );
  }

  return (
    <ShellVendeuse active="boutique" moi={moi} titre="Ma boutique">

      {erreur && <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>}
      {message && <div className="p-4 text-sm bg-teal/10 text-teal rounded-btn border border-teal/20">{message}</div>}

      <form onSubmit={enregistrer} className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">

        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6 space-y-5">
          <h3 className="font-serif text-lg text-ink">Informations de la boutique</h3>

          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Bannière</label>
            <div className="relative h-32 rounded-btn bg-ink overflow-hidden">
              {(boutique.banniere || banniereFichier) && (
                <img
                  src={banniereFichier ? URL.createObjectURL(banniereFichier) : boutique.banniere}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              )}
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-ink/20 hover:bg-ink/40 transition-colors">
                <span className="text-cream text-[12.5px] font-semibold bg-ink/60 px-3 py-1.5 rounded-full">Modifier la bannière</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setBanniereFichier(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Nom de la boutique</label>
            <input
              type="text"
              value={form.nom_boutique}
              onChange={(e) => setForm({ ...form, nom_boutique: e.target.value })}
              className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">Bio de la boutique</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Présentez votre boutique en quelques mots..."
              className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
              Zone <span className="font-normal normal-case text-ink-soft/50">(pas votre adresse exacte, juste pour informer les acheteuses)</span>
            </label>
            <select
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
            >
              <option value="">Non précisé</option>
              {zones.map((z) => (
                <option key={z.code} value={z.code}>{z.nom}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-line space-y-3.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[13.5px] font-semibold text-ink">Boutique visible <span className="block text-[11.5px] font-normal text-ink-soft/50">Afficher la boutique au public</span></span>
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                className="h-5 w-9 accent-teal"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[13.5px] font-semibold text-ink">Locations activées <span className="block text-[11.5px] font-normal text-ink-soft/50">Accepter les demandes de location</span></span>
              <input
                type="checkbox"
                checked={form.locations_activees}
                onChange={(e) => setForm({ ...form, locations_activees: e.target.checked })}
                className="h-5 w-9 accent-teal"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={enregistrement} className="bg-teal text-white px-6 py-3 rounded-btn text-sm font-bold hover:bg-teal-dark transition-colors disabled:opacity-50">
              {enregistrement ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <a
              href={`/boutique/${boutique.slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-btn text-sm font-bold border border-line text-ink-soft/70 hover:border-teal hover:text-teal transition-colors"
            >
              Aperçu public
            </a>
          </div>
        </div>

        <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6">
          <h3 className="font-serif text-lg text-ink mb-4">Aperçu de votre boutique</h3>
          <div className="rounded-m overflow-hidden border border-line">
            <div className="relative h-24 bg-ink">
              {(boutique.banniere || banniereFichier) && (
                <img
                  src={banniereFichier ? URL.createObjectURL(banniereFichier) : boutique.banniere}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <p className="font-serif text-lg text-ink">{form.nom_boutique || 'Nom de la boutique'}</p>
              {form.zone && <p className="text-[12px] text-teal font-semibold mt-0.5">{zones.find((z) => z.code === form.zone)?.nom}</p>}
              <p className="text-[13px] text-ink-soft/70 mt-2 leading-relaxed">{form.description || 'Aucune bio renseignée pour le moment.'}</p>
              {!form.visible && (
                <p className="text-[11.5px] font-bold text-red-500 mt-3 bg-red-50 rounded-full px-3 py-1 w-fit">Boutique masquée au public</p>
              )}
            </div>
          </div>
        </div>

      </form>

      <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6 max-w-md">
        <h3 className="font-serif text-lg text-ink mb-1">Notifications de commande</h3>
        <p className="text-[12.5px] text-ink-soft/60 mb-4">Comment souhaitez-vous être prévenue d'une nouvelle commande ?</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { value: 'email', label: 'Par email' },
            { value: 'whatsapp', label: 'Par WhatsApp' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => changerNotification(opt.value)}
              className={`px-4 py-3 rounded-btn text-sm font-semibold border-2 transition-all ${
                notifPref === opt.value
                  ? 'border-teal bg-teal/5 text-ink'
                  : 'border-line text-ink-soft/60 hover:border-ink/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {notifPref === 'whatsapp' && (
          <p className="text-[11px] text-orange mt-3 italic">
            L'envoi WhatsApp automatique n'est pas encore actif (API en attente) — vous continuerez à voir vos commandes sur ce tableau de bord dans tous les cas.
          </p>
        )}
      </div>

    </ShellVendeuse>
  );
}
