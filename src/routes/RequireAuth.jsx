import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthChange, getCurrentUser } from '../services/auth';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setReady(true);
    });

    return unsubscribe;
  }, []);

  if (!ready) return null;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}
