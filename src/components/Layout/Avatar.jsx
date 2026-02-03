import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserProfile, logout, onAuthChange } from '../../services/auth';

export default function Avatar() {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);

    const uid = user?.uid;
    if (!uid) return () => { cancelled = true; };

    (async () => {
      try {
        const data = await getUserProfile(uid);
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const initial = (profile?.username || profile?.name || user?.displayName || user?.email || 'U').substring(0, 1).toUpperCase();
  const avatarUrl = profile?.photoURL || user?.photoURL || '';

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="navbar-user" ref={rootRef}>
      <button
        type="button"
        className="user-avatar"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu do usuário"
        title="Conta"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span className="user-avatar-fallback" aria-hidden="true">{initial}</span>
        )}
      </button>

      {open ? (
        <div className="user-menu" role="menu">
          <button
            type="button"
            className="user-menu-item"
            onClick={handleLogout}
            role="menuitem"
          >
            Finalizar sessão
          </button>
        </div>
      ) : null}
    </div>
  );
}