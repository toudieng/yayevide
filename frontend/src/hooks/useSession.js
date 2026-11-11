// frontend/src/hooks/useSession.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

/**
 * Vérifie la session active et redirige vers /connexion si personne n'est
 * connectée — ou vers /connexion également si le rôle ne correspond pas à
 * `requiredRole` (ex: une acheteuse qui tente d'ouvrir /admin), pour éviter
 * qu'un espace protégé ne se contente de vérifier "est connectée" sans
 * vérifier "a le bon rôle".
 */
export function useSession(requiredRole) {
  const navigate = useNavigate();
  const [moi, setMoi] = useState(null);
  const [chargementSession, setChargementSession] = useState(true);

  useEffect(() => {
    apiFetch('/moi/')
      .then(async (res) => {
        if (!res.ok) {
          navigate('/connexion');
          return;
        }
        const data = await res.json();
        if (requiredRole && data.role !== requiredRole) {
          navigate('/connexion');
          return;
        }
        setMoi(data);
      })
      .catch(() => navigate('/connexion'))
      .finally(() => setChargementSession(false));
  }, [navigate, requiredRole]);

  return { moi, chargementSession };
}
