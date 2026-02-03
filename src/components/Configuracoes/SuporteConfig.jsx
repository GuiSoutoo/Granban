import SupIcon from '../../assets/ConfigIcon/SupIcon.svg';

export default function SuporteConfig({ userName = 'Nome do usuário' }) {
  return (
    <div className="config-content">
      <div className="config-content-header">
        <img src={SupIcon} alt="" className="config-content-header__icon" />
        <div>
          <h2 className="config-content-header__title">Ajuda e suporte</h2>
          <p className="config-content-header__subtitle">{userName}</p>
        </div>
      </div>

      <div className="config-section">
        <p className="configuracoes-instruction">
          Em breve você poderá acessar canais de suporte e FAQs aqui.
        </p>
      </div>
    </div>
  );
}
