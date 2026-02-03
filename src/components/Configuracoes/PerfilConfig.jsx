import { useRef } from 'react';
import ProfileIcon from '../../assets/ConfigIcon/ProfileIcon.svg';
import { useProfileSettings } from '../../hooks/useProfileSettings';
import { useProfilePhoto } from '../../hooks/useProfilePhoto';

export default function PerfilConfig({ profile, userName = 'Nome do usuário' }) {
  const fileInputRef = useRef(null);
  const {
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
  } = useProfileSettings(profile);

  const {
    previewUrl,
    uploading,
    error: photoError,
    success: photoSuccess,
    handleFile,
  } = useProfilePhoto(profile);

  const handlePickPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    handleFile(file);
  };

  return (
    <div className="config-content">
      <div className="config-content-header">
        <img src={ProfileIcon} alt="" className="config-content-header__icon" />
        <div>
          <h2 className="config-content-header__title">Perfil</h2>
          <p className="config-content-header__subtitle">{userName}</p>
        </div>
      </div>

      <div className="config-section">
        <h3 className="config-section__title">Ver, editar, excluir perfil</h3>

        <div className="config-option">
          <span className="config-option__label">Foto de perfil</span>
          <div className="config-avatar">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="config-avatar__image" />
            ) : (
              <span className="config-avatar__fallback">{(userName || 'U').substring(0, 1).toUpperCase()}</span>
            )}
            <button
              type="button"
              className="config-avatar__button"
              onClick={handlePickPhoto}
              disabled={uploading}
            >
              {uploading ? 'Enviando...' : 'Alterar foto'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="config-option">
          <span className="config-option__label">Nome de exibição</span>
          <input
            className="config-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="config-option">
          <span className="config-option__label">Nome de usuário</span>
          <input
            className="config-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="config-option">
          <span className="config-option__label">Email</span>
          <input
            className="config-input"
            type="email"
            value={email}
            disabled
          />
        </div>
      </div>

      {photoError ? <div className="config-message config-message--error">{photoError}</div> : null}
      {photoSuccess ? <div className="config-message config-message--success">{photoSuccess}</div> : null}
      {error ? <div className="config-message config-message--error">{error}</div> : null}
      {success ? <div className="config-message config-message--success">{success}</div> : null}

      <div className="config-actions">
        <button className="config-save" type="button" onClick={saveProfile} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button className="config-danger" type="button" onClick={removeAccount} disabled={deleting}>
          {deleting ? 'Excluindo...' : 'Excluir perfil'}
        </button>
      </div>
    </div>
  );
}
