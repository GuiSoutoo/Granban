import { useEffect, useState } from 'react';
import { getCurrentUser, updateUserPhoto } from '../services/auth';
import { uploadUserAvatar } from '../services/storage';

export function useProfilePhoto(profile) {
  const [previewUrl, setPreviewUrl] = useState(profile?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setPreviewUrl(profile?.photoURL || '');
  }, [profile?.photoURL]);

  const clearMessages = () => {
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleFile = async (file) => {
    if (!file) return;

    const current = getCurrentUser();
    if (!current?.uid) {
      setError('Você precisa estar logado.');
      return;
    }

    setUploading(true);
    clearMessages();

    try {
      const { url, fullPath } = await uploadUserAvatar({ uid: current.uid, file });
      await updateUserPhoto({ uid: current.uid, photoURL: url, photoPath: fullPath });
      setPreviewUrl(url);
      setSuccess('Foto atualizada.');
    } catch (err) {
      const code = err?.code || '';
      const message = String(err?.message || '').toLowerCase();
      if (code === 'permission-denied' || message.includes('insufficient permissions')) {
        setError('Permissões insuficientes para atualizar a foto.');
      } else {
        setError('Não foi possível atualizar a foto.');
      }
    } finally {
      setUploading(false);
    }
  };

  return {
    previewUrl,
    uploading,
    error,
    success,
    handleFile,
    clearMessages,
  };
}
