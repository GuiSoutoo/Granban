import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Layout/Navbar';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { logout } from '../services/auth';
import '../style/Configuracoes.css';
import PrivacidadeConfig from '../components/Configuracoes/PrivacidadeConfig';
import PerfilConfig from '../components/Configuracoes/PerfilConfig';
import SobreConfig from '../components/Configuracoes/SobreConfig';
import SuporteConfig from '../components/Configuracoes/SuporteConfig';
import TermosConfig from '../components/Configuracoes/TermosConfig';

import PrivIcon from '../assets/ConfigIcon/PrivIcon.svg';
import ProfileIcon from '../assets/ConfigIcon/ProfileIcon.svg';
import InfoIcon from '../assets/ConfigIcon/InfoIcon.svg';
import SupIcon from '../assets/ConfigIcon/SupIcon.svg';
import TermIcon from '../assets/ConfigIcon/TermIcon.svg';
import ExitIcon from '../assets/ConfigIcon/ExitIcon.svg';
import ConfigIcon from '../assets/ConfigIcon.svg';

const menuItems = [
  {
    id: 'privacidade',
    label: 'Configurações de privacidade',
    icon: PrivIcon,
  },
  {
    id: 'perfil',
    label: 'Ver, editar, excluir perfil',
    icon: ProfileIcon,
  },
  {
    id: 'sobre',
    label: 'Sobre o Granban',
    icon: InfoIcon,
  },
  {
    id: 'suporte',
    label: 'Ajuda e suporte',
    icon: SupIcon,
  },
  {
    id: 'termos',
    label: 'Termos de uso',
    icon: TermIcon,
  },
];

const contentCards = [
  {
    id: 'privacidade',
    icon: PrivIcon,
    title: 'Privacidade',
  },
  {
    id: 'perfil',
    icon: ProfileIcon,
    title: 'Perfil',
  },
  {
    id: 'sobre',
    icon: InfoIcon,
    title: 'Informações',
  },
  {
    id: 'suporte',
    icon: SupIcon,
    title: 'Suporte',
  },
  {
    id: 'termos',
    icon: TermIcon,
    title: 'Termos',
  },
];

export default function Configuracoes() {
  const navigate = useNavigate();
  const { userProfile } = useCurrentUser();
  const [activeSection, setActiveSection] = useState('privacidade');

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'privacidade':
        return (
          <PrivacidadeConfig userName={userProfile?.name || 'Nome do usuário'} />
        );
      case 'perfil':
        return (
          <PerfilConfig profile={userProfile} userName={userProfile?.name || 'Nome do usuário'} />
        );
      case 'sobre':
        return (
          <SobreConfig userName={userProfile?.name || 'Nome do usuário'} />
        );
      case 'suporte':
        return (
          <SuporteConfig userName={userProfile?.name || 'Nome do usuário'} />
        );
      case 'termos':
        return (
          <TermosConfig userName={userProfile?.name || 'Nome do usuário'} />
        );
      
      default:
        return (
          <>
            <div className="configuracoes-header">
              <div className="configuracoes-title">
                <img src={ConfigIcon} alt="" className="configuracoes-title__icon" />
                <div>
                  <h1 className="configuracoes-title__heading">Configurações</h1>
                  <p className="configuracoes-title__subtitle">{userProfile?.name || 'Nome do usuário'}</p>
                </div>
              </div>
            </div>

            <p className="configuracoes-instruction">
              Selecione uma opção para configurar. Lembre de salvar para efetivar as alterações :)
            </p>

            <div className="configuracoes-cards">
              {contentCards.map((card) => (
                <button
                  key={card.id}
                  className="config-card"
                  onClick={() => setActiveSection(card.id)}
                >
                  <img src={card.icon} alt="" className="config-card__icon" />
                </button>
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <>
      <Navbar />
      <div className="configuracoes-container">
        <aside className="configuracoes-sidebar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <img src={item.icon} alt="" className="sidebar-item__icon" />
              <span className="sidebar-item__label">{item.label}</span>
            </button>
          ))}

          <button
            className="sidebar-item sidebar-item--exit"
            onClick={handleLogout}
            title="Finalizar sessão"
          >
            <img src={ExitIcon} alt="" className="sidebar-item__icon" />
            <span className="sidebar-item__label">Sair</span>
          </button>
        </aside>

        <main className="configuracoes-main">
          <div className="configuracoes-main__content">
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
}
