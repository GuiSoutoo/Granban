import InfoIcon from '../../assets/ConfigIcon/InfoIcon.svg';

export default function SobreConfig({ userName = 'Nome do usuário' }) {
  return (
    <div className="config-content">
      <div className="config-content-header">
        <img src={InfoIcon} alt="" className="config-content-header__icon" />
        <div>
          <h2 className="config-content-header__title">Sobre o Granban</h2>
          <p className="config-content-header__subtitle">{userName}</p>
        </div>
      </div>

      <div className="config-section">
        <p className="configuracoes-instruction">
          Em breve você verá informações sobre o Granban e novidades aqui.
        </p>
      </div>
    </div>
  );
}
