import TermIcon from '../../assets/ConfigIcon/TermIcon.svg';

export default function TermosConfig({ userName = 'Nome do usuário' }) {
  return (
    <div className="config-content">
      <div className="config-content-header">
        <img src={TermIcon} alt="" className="config-content-header__icon" />
        <div>
          <h2 className="config-content-header__title">Termos de uso</h2>
          <p className="config-content-header__subtitle">{userName}</p>
        </div>
      </div>

      <div className="config-section">
        <p className="configuracoes-instruction">
          Em breve você poderá visualizar os termos de uso aqui.
        </p>
      </div>
    </div>
  );
}
