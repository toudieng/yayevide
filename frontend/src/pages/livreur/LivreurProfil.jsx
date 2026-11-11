// frontend/src/pages/livreur/LivreurProfil.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellLivreur from '../../components/livreur/ShellLivreur';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD as SHADOW } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const TYPES_VEHICULE = [
  { value: '', label: 'Non renseigné' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'moto', label: 'Moto' },
  { value: 'voiture', label: 'Voiture' },
  { value: 'velo', label: 'Vélo' },
  { value: 'a_pied', label: 'À pied' },
];

function DocumentLigne({ label, url, verifie, onUpload, enCours }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-line last:border-0">
      <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${url ? (verifie ? 'bg-teal/10 text-teal-dark' : 'bg-orange/10 text-orange') : 'bg-line/50 text-ink-soft/75'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {url ? (
          <p className={`text-[11.5px] font-bold ${verifie ? 'text-teal-dark' : 'text-orange'}`}>{verifie ? 'Vérifié' : 'En attente de vérification'}</p>
        ) : (
          <p className="text-[11.5px] text-ink-soft/75">Non fourni</p>
        )}
      </div>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-teal-dark hover:underline whitespace-nowrap">
          Voir
        </a>
      )}
      <label className="text-[12px] font-bold text-ink-soft/75 hover:text-ink cursor-pointer whitespace-nowrap">
        {enCours ? '...' : url ? 'Remplacer' : 'Ajouter'}
        <input type="file" accept="image/*,.pdf" className="hidden" disabled={enCours} onChange={onUpload} />
      </label>
    </div>
  );
}

export default function LivreurProfil() {
  const { moi, chargementSession } = useSession('livreur');
  const navigate = useNavigate();

  const [profil, setProfil] = useState(null);
  const [zones, setZones] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [champVehiculeEnCours, setChampVehiculeEnCours] = useState(null);
  const [documentEnCours, setDocumentEnCours] = useState(null);

  const charger = () => {
    Promise.all([
      apiFetch('/moi/').then((r) => (r.ok ? r.json() : null)),
      apiFetch('/zones-livraison/').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([p, z]) => {
        setProfil(p);
        setZones(z);
      })
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    if (chargementSession) return;
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargementSession]);

  const changerZone = async (zone) => {
    setEnregistrement(true);
    const res = await apiFetch('/moi/', { method: 'PATCH', body: { zone_livreur: zone } });
    if (res.ok) setProfil((prev) => ({ ...prev, zone_livreur: zone }));
    setEnregistrement(false);
  };

  const changerVehicule = async (champ, valeur) => {
    setChampVehiculeEnCours(champ);
    const res = await apiFetch('/moi/', { method: 'PATCH', body: { [champ]: valeur } });
    if (res.ok) setProfil((prev) => ({ ...prev, [champ]: valeur }));
    setChampVehiculeEnCours(null);
  };

  const uploaderDocument = async (champ, fichier) => {
    if (!fichier) return;
    setDocumentEnCours(champ);
    const data = new FormData();
    data.append(champ, fichier);
    const res = await apiFetch('/livreur/documents/', { method: 'PATCH', body: data });
    if (res.ok) {
      const updated = await res.json();
      setProfil((prev) => ({ ...prev, ...updated }));
    }
    setDocumentEnCours(null);
  };

  const seDeconnecter = async () => {
    await apiFetch('/deconnexion/', { method: 'POST' }).catch(() => {});
    navigate('/connexion');
  };

  if (chargementSession || chargement || !profil) {
    return (
      <SqueletteTableau />
    );
  }

  const zoneActuelle = zones.find((z) => z.code === profil.zone_livreur)?.nom;

  return (
    <ShellLivreur active="profil" moi={moi} titre="Mon profil">

      <p className="text-[13px] text-ink-soft/75 -mt-2">Gérez vos informations, votre véhicule et vos documents.</p>

      <div className={`${GRADIENT_CARDS[0].bg} rounded-m ${SHADOW} p-6 flex items-center justify-between gap-4 flex-wrap`}>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-m bg-white/10 text-cream font-serif text-2xl font-bold flex items-center justify-center shrink-0">
            {(profil.first_name || profil.username || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={`font-serif text-lg font-bold ${GRADIENT_CARDS[0].text}`}>{profil.first_name || profil.username}</p>
            <p className={`text-[12.5px] ${GRADIENT_CARDS[0].label}`}>Livreur partenaire{zoneActuelle ? ` · Zone ${zoneActuelle}` : ''}</p>
            <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide bg-white/10 text-white px-2.5 py-1 rounded-full">
              ID livreur · LVR-{String(moi?.id || 0).padStart(6, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-5">Informations personnelles</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75 mb-1">Nom d'utilisateur</p>
              <p className="text-sm font-semibold text-ink">{profil.username}</p>
            </div>
            {profil.phone_number && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75 mb-1">Téléphone</p>
                <p className="text-sm font-semibold text-ink">{profil.phone_number}</p>
              </div>
            )}
            {profil.email && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75 mb-1">Email</p>
                <p className="text-sm font-semibold text-ink">{profil.email}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75 mb-1">Membre depuis</p>
              <p className="text-sm font-semibold text-ink">{formatDate(profil.date_joined)}</p>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-5">Zone de livraison couverte</h3>
          <select
            value={profil.zone_livreur || ''}
            disabled={enregistrement}
            onChange={(e) => changerZone(e.target.value)}
            className="w-full px-3.5 py-3 bg-sable border border-line rounded-btn text-sm font-semibold text-ink focus:outline-none focus:border-teal disabled:opacity-50"
          >
            <option value="">Toutes zones (aucune préférence)</option>
            {zones.map((z) => <option key={z.code} value={z.code}>{z.nom}</option>)}
          </select>
          <p className="text-[11.5px] text-ink-soft/75 mt-3 leading-relaxed">
            Les commandes de votre zone vous seront proposées en priorité, sur la page « Mes livraisons ».
          </p>
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-5">Véhicule</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75 mb-1.5">Type de véhicule</p>
              <select
                value={profil.type_vehicule || ''}
                disabled={champVehiculeEnCours === 'type_vehicule'}
                onChange={(e) => changerVehicule('type_vehicule', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-sable border border-line rounded-btn text-sm font-semibold text-ink focus:outline-none focus:border-teal disabled:opacity-50"
              >
                {TYPES_VEHICULE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75 mb-1.5">Marque / modèle</p>
              <input
                type="text"
                defaultValue={profil.marque_modele_vehicule || ''}
                onBlur={(e) => e.target.value !== (profil.marque_modele_vehicule || '') && changerVehicule('marque_modele_vehicule', e.target.value)}
                placeholder="Ex : TVS Ntorq 125"
                className="w-full px-3.5 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75 mb-1.5">Immatriculation</p>
              <input
                type="text"
                defaultValue={profil.immatriculation || ''}
                onBlur={(e) => e.target.value !== (profil.immatriculation || '') && changerVehicule('immatriculation', e.target.value)}
                placeholder="Ex : DK-4521-BC"
                className="w-full px-3.5 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6`}>
          <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-2">Documents</h3>
          <p className="text-[12px] text-ink-soft/75 mb-2">Vérifiés par l'équipe Yaay Vidé après envoi.</p>
          <div>
            <DocumentLigne
              label="Pièce d'identité"
              url={profil.piece_identite}
              verifie={profil.piece_identite_verifiee}
              enCours={documentEnCours === 'piece_identite'}
              onUpload={(e) => uploaderDocument('piece_identite', e.target.files?.[0])}
            />
            <DocumentLigne
              label="Permis de conduire"
              url={profil.permis_conduire}
              verifie={profil.permis_conduire_verifie}
              enCours={documentEnCours === 'permis_conduire'}
              onUpload={(e) => uploaderDocument('permis_conduire', e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-m ${SHADOW} p-6`}>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-5">Gestion du compte</h3>
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-ink">Modifier le mot de passe</p>
              <p className="text-[11.5px] text-ink-soft/75">Contactez l'équipe Yaay Vidé pour le réinitialiser.</p>
            </div>
            <a href="https://wa.me/221771018991" target="_blank" rel="noreferrer" className="text-[12.5px] font-bold text-teal-dark hover:underline whitespace-nowrap">
              Contacter →
            </a>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-ink">Se déconnecter</p>
              <p className="text-[11.5px] text-ink-soft/75">Fermer votre session sur cet appareil.</p>
            </div>
            <button type="button" onClick={seDeconnecter} className="text-[12.5px] font-bold text-ink-soft/75 hover:text-ink whitespace-nowrap">
              Se déconnecter
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-red-500">Supprimer le compte</p>
              <p className="text-[11.5px] text-ink-soft/75">Cette demande nécessite une vérification Yaay Vidé.</p>
            </div>
            <a href="https://wa.me/221771018991" target="_blank" rel="noreferrer" className="text-[12.5px] font-bold text-red-500 hover:underline whitespace-nowrap">
              Demander →
            </a>
          </div>
        </div>
      </div>

    </ShellLivreur>
  );
}
