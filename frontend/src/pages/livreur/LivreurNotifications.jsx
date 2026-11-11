// frontend/src/pages/livreur/LivreurNotifications.jsx
import { useEffect, useMemo, useState } from 'react';
import ShellLivreur from '../../components/livreur/ShellLivreur';
import { useSession } from '../../hooks/useSession';
import { apiFetch } from '../../utils/api';

function formatDateHeure(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

const ONGLETS = [
  { id: 'toutes', label: 'Toutes', test: () => true },
  { id: 'assignation', label: 'Nouvelles livraisons', test: (n) => n.type === 'assignation' },
  { id: 'livraison', label: 'Livraisons terminées', test: (n) => n.type === 'livraison' },
];

const SHADOW = 'shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)]';

export default function LivreurNotifications() {
  const { moi, chargementSession } = useSession('livreur');

  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState('toutes');
  const [selectionnee, setSelectionnee] = useState(null);
  const [lues, setLues] = useState(new Set());

  useEffect(() => {
    if (chargementSession) return;
    apiFetch('/livreur/notifications/')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const avecId = data.map((n, i) => ({ ...n, id: i }));
        setNotifications(avecId);
        setSelectionnee(avecId[0] || null);
      })
      .finally(() => setChargement(false));
  }, [chargementSession]);

  const filtrees = useMemo(() => {
    const test = ONGLETS.find((o) => o.id === onglet)?.test || (() => true);
    return notifications.filter(test);
  }, [notifications, onglet]);

  const marquerLue = (n) => setLues((prev) => new Set(prev).add(n.id));
  const marquerToutesLues = () => setLues(new Set(notifications.map((n) => n.id)));

  if (chargementSession || chargement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
      </div>
    );
  }

  const nbNonLues = notifications.filter((n) => !lues.has(n.id)).length;

  return (
    <ShellLivreur active="notifications" moi={moi} titre="Notifications">

      <p className="text-[13px] text-ink-soft/75 -mt-2">Restez informé des livraisons assignées et terminées.</p>

      <div className="bg-orange/5 border border-orange/15 rounded-btn p-4">
        <p className="text-[12.5px] text-ink-soft leading-relaxed">
          Pas encore d'envoi push automatique (SMS/WhatsApp) — cette page liste vos livraisons assignées et terminées récemment, à consulter ici en attendant.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-cream rounded-btn p-1 flex-wrap">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`px-3.5 py-2 rounded-btn text-[12.5px] font-bold transition-all ${
                onglet === o.id ? 'bg-teal text-white' : 'text-ink-soft/75 hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {nbNonLues > 0 && (
          <button type="button" onClick={marquerToutesLues} className="flex items-center gap-1.5 text-[12.5px] font-bold text-teal-dark hover:underline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M5 12l4.5 4.5L19 7" /></svg>
            Marquer toutes comme lues
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">Vos notifications <span className="text-ink-soft/75 font-normal">· {nbNonLues} non lue{nbNonLues > 1 ? 's' : ''}</span></h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className={`bg-white rounded-m ${SHADOW} overflow-hidden`}>
          {filtrees.length === 0 ? (
            <p className="text-ink-soft/75 text-sm text-center py-16">Aucune notification dans cette catégorie.</p>
          ) : (
            <div className="divide-y divide-line">
              {filtrees.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { setSelectionnee(n); marquerLue(n); }}
                  className={`w-full flex items-start gap-3.5 p-4 text-left border-l-2 transition-colors ${
                    selectionnee?.id === n.id ? 'bg-teal/5 border-l-teal' : lues.has(n.id) ? 'border-l-transparent hover:bg-sable' : 'border-l-orange hover:bg-sable'
                  }`}
                >
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'livraison' ? 'bg-teal/10 text-teal-dark' : 'bg-orange/10 text-orange'}`}>
                    {n.type === 'livraison'
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 12l4.5 4.5L19 7" /></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink truncate">{n.texte}</p>
                    <p className="text-[11px] text-ink-soft/75 mt-0.5">{formatDateHeure(n.date)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-m ${SHADOW} p-6 h-fit lg:sticky lg:top-6`}>
          {!selectionnee ? (
            <p className="text-ink-soft/75 text-sm text-center py-10">Sélectionnez une notification.</p>
          ) : (
            <>
              <span className={`h-11 w-11 rounded-full flex items-center justify-center mb-4 ${selectionnee.type === 'livraison' ? 'bg-teal/10 text-teal-dark' : 'bg-orange/10 text-orange'}`}>
                {selectionnee.type === 'livraison'
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M5 12l4.5 4.5L19 7" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 5v14M5 12h14" /></svg>}
              </span>
              <p className="font-serif font-bold text-lg text-ink mb-1.5">{selectionnee.texte}</p>
              <p className="text-[12.5px] text-ink-soft/75 mb-5">{formatDateHeure(selectionnee.date)}</p>
              <div className="bg-orange/5 border border-orange/15 rounded-btn p-3.5">
                <p className="text-[11.5px] text-ink-soft leading-relaxed">
                  Incident ? Ne contactez pas la cliente en dehors d'une livraison active. Transmettez toute difficulté à Yaay Vidé.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

    </ShellLivreur>
  );
}
