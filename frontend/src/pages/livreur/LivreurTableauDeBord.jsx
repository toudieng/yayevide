// frontend/src/pages/livreur/LivreurTableauDeBord.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellLivreur from '../../components/livreur/ShellLivreur';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';
import { GRADIENT_CARDS, SHADOW_CARD } from '../../utils/gradientCards';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

function formatHeure(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function LivreurTableauDeBord() {
  const { moi, chargementSession } = useSession('livreur');
  const navigate = useNavigate();

  const [commandes, setCommandes] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [statsJour, setStatsJour] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (chargementSession) return;
    Promise.all([
      apiFetch('/livreur/mes-livraisons/'),
      apiFetch('/livreur/stats-jour/'),
      apiFetch('/livreur/livraisons-disponibles/'),
    ])
      .then(async ([resLivraisons, resStats, resDisponibles]) => {
        setCommandes(resLivraisons.ok ? await resLivraisons.json() : []);
        setStatsJour(resStats.ok ? await resStats.json() : null);
        setDisponibles(resDisponibles.ok ? await resDisponibles.json() : []);
      })
      .catch(() => setErreur('Impossible de joindre le serveur. Vérifiez que Django est lancé.'))
      .finally(() => setChargement(false));
  }, [chargementSession]);

  const aRecuperer = commandes.filter((c) => c.statut === 'confirme').length;
  const enCours = commandes.filter((c) => c.statut === 'en_cours_livraison').length;

  const activitesRecentes = useMemo(() => {
    const evenements = [];
    commandes.forEach((c) => {
      evenements.push({
        date: c.date_commande,
        titre: c.statut === 'en_cours_livraison' ? 'Livraison en cours' : 'Livraison assignée',
        detail: `${c.produit_titre} · ${c.zone_livraison_nom || c.boutique_nom}`,
        type: c.statut === 'en_cours_livraison' ? 'cours' : 'assignee',
      });
    });
    return evenements.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [commandes]);

  if (chargementSession || chargement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }


  return (
    <ShellLivreur active="dashboard" moi={moi} titre="Tableau de bord">

      {erreur && (
        <div className="p-4 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
      )}

      {(aRecuperer > 0 || disponibles.length > 0) && (
        <div className={`bg-ink rounded-m ${SHADOW_CARD} p-6 flex items-center justify-between gap-4 flex-wrap text-cream`}>
          <div>
            <p className="text-[10.5px] font-bold text-cream/60 uppercase tracking-wide mb-1.5">Prêt pour votre tournée</p>
            <p className="text-lg font-serif font-bold">
              {aRecuperer > 0
                ? `${aRecuperer} livraison${aRecuperer > 1 ? 's' : ''} attendent votre prise en charge`
                : `${disponibles.length} livraison${disponibles.length > 1 ? 's' : ''} disponible${disponibles.length > 1 ? 's' : ''} dans votre zone`}
            </p>
            <p className="text-[12.5px] text-cream/60 mt-1">Priorisez les retraits pour maintenir vos délais.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/livreur/mes-livraisons')}
            className="bg-white text-ink font-bold text-sm px-5 py-2.5 rounded-full hover:bg-cream transition-colors whitespace-nowrap"
          >
            Voir mes livraisons →
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Livraisons à récupérer', valeur: aRecuperer, icone: 'box' },
          { label: 'Livraisons en cours', valeur: enCours, icone: 'truck' },
          { label: "Terminées aujourd'hui", valeur: statsJour?.livrees_aujourdhui ?? 0, icone: 'check' },
          { label: 'Revenus disponibles', valeur: formatFCFA(statsJour?.revenus_aujourdhui), icone: 'fcfa' },
        ].map((s, i) => {
          const g = GRADIENT_CARDS[i % GRADIENT_CARDS.length];
          return (
            <div key={s.label} className={`${g.bg} rounded-m ${SHADOW_CARD} p-5`}>
              <span className={`h-10 w-10 rounded-full flex items-center justify-center mb-3.5 ${g.iconBg} ${g.iconColor}`}>
                {s.icone === 'box' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></svg>}
                {s.icone === 'truck' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M2 8h11v8H2zM13 11h4l3 3v2h-7z" /><circle cx="6.5" cy="18.5" r="1.6" /><circle cx="17.5" cy="18.5" r="1.6" /></svg>}
                {s.icone === 'check' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5"><path d="M5 12l4.5 4.5L19 7" /></svg>}
                {s.icone === 'fcfa' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><circle cx="12" cy="12" r="9" /><path d="M9 9h4a2 2 0 010 4H9m0-4v8m0-4h5" /></svg>}
              </span>
              <p className={`text-2xl font-serif font-bold ${g.text}`}>{s.valeur}</p>
              <p className={`text-[11.5px] mt-0.5 ${g.label}`}>{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className={`bg-white rounded-m ${SHADOW_CARD} p-6`}>
        <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-5">Activités récentes</h3>
        {activitesRecentes.length === 0 ? (
          <p className="text-ink-soft/75 text-sm text-center py-6">Aucune activité pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {activitesRecentes.map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${e.type === 'cours' ? 'bg-teal' : 'bg-orange'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{e.titre}</p>
                  <p className="text-[12px] text-ink-soft/75 truncate">{e.detail}</p>
                </div>
                <span className="text-[11px] text-ink-soft/75 shrink-0">{formatHeure(e.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-orange/5 border border-orange/15 rounded-btn p-3.5">
        <p className="text-[11.5px] text-ink-soft leading-relaxed">
          <span className="font-bold">Données protégées.</span> Les coordonnées clientes ne sont visibles que pendant la livraison. Pour tout incident, passez par Yaay Vidé.
        </p>
      </div>

    </ShellLivreur>
  );
}
