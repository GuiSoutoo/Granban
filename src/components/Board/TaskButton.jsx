import '../../style/Task.css';

export function TaskButton({ status, taskId, onStatusChange }) {
    const botaoStatus = (currentStatus) => {
      switch(currentStatus) {
        case 'to-do':
          return { text: 'Iniciar', className: 'ToDo', proximoStatus: 'in-progress' };
        case 'in-progress':
          return { text: 'Prosseguir', className: 'InProgress', proximoStatus: 'in-review' };
        case 'in-review':
          return { text: 'Revisar', className: 'InReview', proximoStatus: 'concluded' };
        case 'rejected':
          return { text: 'Retornar', className: 'Rejected', proximoStatus: 'in-review' };
        case 'concluded':
          return { text: 'Arquivar', className: 'Concluded', proximoStatus: 'archived' };
        default:
          return { text: 'Próximo', className: '', proximoStatus: '' };
      }
    };

    const handleClick = () => {
      const { proximoStatus } = botaoStatus(status);
        if (onStatusChange && proximoStatus) {
          onStatusChange(taskId, proximoStatus);
        }
    };
    const botaoInfo = botaoStatus(status);
    return (
        <div className='botãoTask'>
          <button onClick={handleClick} className={botaoInfo.className}>
            {botaoInfo.text}
          </button>
        </div>
    );
}