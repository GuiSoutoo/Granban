import { useEffect, useState } from 'react';
import { deleteUserAccount, updateUserProfile } from '../services/auth';

export function useProfileSettings(profile) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toPtError = (err) => {
    const code = err?.code || '';
    const message = String(err?.message || '');

    if (code === 'permission-denied' || message.toLowerCase().includes('insufficient permissions')) {
      return 'Permissões insuficientes para salvar.';
    }

    if (code === 'auth/requires-recent-login') {
      return 'Faça login novamente para concluir esta ação.';
    }

    if (code === 'auth/user-disabled') {
      return 'Sua conta foi desativada.';
    }

    if (code === 'auth/user-not-found') {
      return 'Usuário não encontrado.';
    }

    if (message.toLowerCase().includes('nome de usuário já está em uso')) {
      return 'Nome de usuário já está em uso.';
    }

    return 'Não foi possível concluir a ação.';
  };

  useEffect(() => {
    setDisplayName(profile?.name || '');
    setUsername(profile?.username || '');
    setEmail(profile?.email || '');
  }, [profile?.uid, profile?.name, profile?.username, profile?.email]);

  const clearMessages = () => {
    if (error) setError('');
    if (success) setSuccess('');
  };

  const saveProfile = async () => {
    if (!profile?.uid) {
      setError('Você precisa estar logado.');
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      await updateUserProfile({
        uid: profile.uid,
        name: displayName,
        username,
        previousUsername: profile.username,
      });
      setSuccess('Alterações salvas.');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setError(toPtError(err));
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async () => {
    if (!profile?.uid) {
      setError('Você precisa estar logado.');
      return;
    }

    const confirmed = window.confirm('Tem certeza que deseja excluir sua conta? Essa ação é irreversível.');
    if (!confirmed) return;

    setDeleting(true);
    clearMessages();

    try {
      await deleteUserAccount({ uid: profile.uid, username: profile.username });
    } catch (err) {
      setError(toPtError(err));
      setDeleting(false);
    }
  };

  return {
    displayName,
    setDisplayName,
    username,
    setUsername,
    email,
    saving,
    deleting,
    error,
    success,
    saveProfile,
    removeAccount,
  };
}
