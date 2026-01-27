import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserProfile, logout, onAuthChange, updateUserPhoto } from '../../services/auth';
import { uploadUserAvatar } from '../../services/storage';

export default function Avatar() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const fileInputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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

  const openFilePicker = () => {
    if (uploading) return;
    if (error) setError('');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // permite escolher o mesmo arquivo novamente
    e.target.value = '';

    if (!file) return;
    if (!user?.uid) {
      setError('Você precisa estar logado.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const { url, fullPath } = await uploadUserAvatar({ uid: user.uid, file });
      await updateUserPhoto({ uid: user.uid, photoURL: url, photoPath: fullPath });
      // Atualiza UI local sem precisar recarregar
      setProfile((prev) => ({ ...(prev || {}), photoURL: url, photoPath: fullPath }));
      setOpen(false);
    } catch (err) {
      console.error('Erro ao enviar avatar:', err);
      setError(err?.message || 'Não foi possível enviar a imagem.');
    } finally {
      setUploading(false);
    }
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {open ? (
        <div className="user-menu" role="menu">
          <button
            type="button"
            className="user-menu-item"
            onClick={openFilePicker}
            role="menuitem"
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : 'Alterar foto'}
          </button>

          {error ? (
            <div className="user-menu-item" style={{ opacity: 0.9, cursor: 'default' }} role="none">
              {error}
            </div>
          ) : null}

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