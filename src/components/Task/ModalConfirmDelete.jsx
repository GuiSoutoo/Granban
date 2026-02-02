export default function ModalConfirmDelete({ task, onConfirm, onCancel, isLoading = false }) {
  if (!task) return null;

  const handleConfirm = async () => {
    await onConfirm?.();
  };

  return (
    <div
      className="project-leaveConfirmOverlay"
      role="presentation"
    >
      <div
        className="project-leaveConfirmCard"
        role="dialog"
        aria-label="Confirmar exclusão da tarefa"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-details-closeBtn project-leaveConfirmCloseBtn"
          onClick={onCancel}
          aria-label="Fechar"
          title="Fechar"
          disabled={isLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="project-leaveConfirmTitle">Excluir tarefa?</div>
        <div className="project-leaveConfirmText">
          Tem certeza que deseja excluir a tarefa <strong>"{task.title || 'Sem título'}"</strong>? Esta ação não pode ser desfeita.
        </div>
        <div className="project-leaveConfirmActions">
          <button
            type="button"
            className="project-leaveConfirmBtn"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="project-leaveConfirmBtn project-leaveConfirmBtn--danger"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
