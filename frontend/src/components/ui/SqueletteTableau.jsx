// frontend/src/components/ui/SqueletteTableau.jsx
// Squelette de chargement des tableaux de bord : reprend la silhouette
// réelle (menu, en-tête, cartes stats, blocs) au lieu d'un simple rond
// qui tourne — plus rassurant sur une connexion lente. Purement visuel.
import { SHADOW_CARD } from '../../utils/gradientCards';

export default function SqueletteTableau({ sansMenu = false }) {
  return (
    <div
      className={`${sansMenu ? 'min-h-[60vh]' : 'min-h-screen'} bg-white flex`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Chargement en cours…</span>
      {!sansMenu && (
        <div className="hidden lg:flex w-64 shrink-0 flex-col gap-3 border-r border-line p-6" aria-hidden="true">
          <div className="h-10 w-32 rounded-btn bg-line/50 animate-pulse mb-6" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 rounded-btn bg-line/30 animate-pulse" />
          ))}
        </div>
      )}
      <div className="flex-1 min-w-0 p-4 sm:p-8 space-y-6" aria-hidden="true">
        <div className="h-7 w-56 max-w-full rounded bg-line/50 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`rounded-m p-4 sm:p-5 bg-white ${SHADOW_CARD}`}>
              <div className="h-9 w-9 rounded-full bg-line/40 animate-pulse mb-4" />
              <div className="h-3 w-20 rounded-full bg-line/40 animate-pulse mb-2" />
              <div className="h-6 w-24 rounded bg-line/50 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className={`rounded-m p-5 bg-white space-y-3 ${SHADOW_CARD}`}>
              <div className="h-4 w-40 rounded bg-line/50 animate-pulse mb-2" />
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-btn bg-line/40 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-line/40 animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-line/30 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
