import { useState, useEffect } from 'react';
import { getCurrentUser, getUserProfile, onAuthChange } from '../services/auth';

/**
 * Hook para carregar e observar o perfil do usuário atual
 * @returns {Object} { userProfile, loading }
 */
export function useCurrentUser() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyUser = async (user) => {
      if (cancelled) return;
      
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (cancelled) return;

        const username = typeof profile?.username === 'string' ? profile.username.trim() : '';
        const name = typeof profile?.name === 'string' ? profile.name.trim() : (user.displayName || user.email || '');

        setUserProfile({
          uid: user.uid,
          email: user.email || '',
          username,
          name,
        });
      } catch {
        if (cancelled) return;
        setUserProfile({
          uid: user.uid,
          email: user.email || '',
          username: '',
          name: user.displayName || user.email || '',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    applyUser(getCurrentUser());
    const unsubscribe = onAuthChange((user) => {
      setLoading(true);
      applyUser(user);
    });

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return { userProfile, loading };
}
