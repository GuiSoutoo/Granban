import { useState } from 'react';
import PrivIcon from '../../assets/ConfigIcon/PrivIcon.svg';

export default function PrivacidadeConfig({ userName = 'Nome do usuário' }) {
  const [showDisplayName, setShowDisplayName] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [receiveInvites, setReceiveInvites] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('Todos');

  return (
    <div className="config-content">
      <div className="config-content-header">
        <img src={PrivIcon} alt="" className="config-content-header__icon" />
        <div>
          <h2 className="config-content-header__title">Configurações de privacidade</h2>
          <p className="config-content-header__subtitle">{userName}</p>
        </div>
      </div>

      <div className="config-section">
        <h3 className="config-section__title">Quando na lista de membro da equipe, mostrar:</h3>

        <div className="config-option">
          <span className="config-option__label">Nome de exibição</span>
          <button
            className={`config-toggle ${showDisplayName ? 'active' : ''} disabled`}
            onClick={() => setShowDisplayName(!showDisplayName)}
            aria-label="Toggle nome de exibição"
            disabled
          >
            <span className="config-toggle__thumb"></span>
          </button>
        </div>

        <div className="config-option">
          <span className="config-option__label">Email</span>
          <button
            className={`config-toggle ${showEmail ? 'active' : ''}`}
            onClick={() => setShowEmail(!showEmail)}
            aria-label="Toggle email"
          >
            <span className="config-toggle__thumb"></span>
          </button>
        </div>
      </div>

      <div className="config-section">
        <div className="config-option">
          <span className="config-option__label">Receber convites pelo email</span>
          <button
            className={`config-toggle ${receiveInvites ? 'active' : ''}`}
            onClick={() => setReceiveInvites(!receiveInvites)}
            aria-label="Toggle receber convites"
          >
            <span className="config-toggle__thumb"></span>
          </button>
        </div>
      </div>

      <div className="config-section">
        <div className="config-option">
          <span className="config-option__label">Quem pode ver sua imagem de perfil</span>
          <select
            className="config-select"
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Gerentes">Gerentes</option>
            <option value="Ninguém">Ninguém</option>
          </select>
        </div>
      </div>
    </div>
  );
}
