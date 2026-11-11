// frontend/src/hooks/useVendeuseSession.js
import { useSession } from './useSession';

/** Fine enveloppe de useSession pour l'espace vendeuse — vérifie aussi que
 * le rôle est bien 'vendeur' (avant, seule l'authentification était
 * vérifiée, une acheteuse connectée aurait pu ouvrir le dashboard). */
export function useVendeuseSession() {
  return useSession('vendeur');
}
