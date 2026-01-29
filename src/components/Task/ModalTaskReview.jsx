import { useEffect } from 'react';
import '../../style/Modal.css';

import AlterIcon from '../../assets/TagIcon/AlterIcon.svg';
import BugIcon from '../../assets/TagIcon/BugIcon.svg';
import EssentialIcon from '../../assets/TagIcon/EssentialIcon.svg';
import FuncIcon from '../../assets/TagIcon/FuncIcon.svg';
import LayoutIcon from '../../assets/TagIcon/LayoutIcon.svg';
import RemIcon from '../../assets/TagIcon/RemIcon.svg';
import UpgradeIcon from '../../assets/TagIcon/UpgradeIcon.svg';

const tagIcons = {
  'Alteração': AlterIcon,
  'Bug': BugIcon,
  'Essencial': EssentialIcon,
  'Funcionalidade': FuncIcon,
  'Layout': LayoutIcon,
  'Remoção': RemIcon,
  'Melhoria': UpgradeIcon,
};

const getTagIcon = (tag) => {
  if (!tag) return null;
  const lowerTag = String(tag).toLowerCase();
  const foundKey = Object.keys(tagIcons).find((key) => lowerTag.includes(key.toLowerCase()));
  return foundKey ? tagIcons[foundKey] : null;
};

const getShortName = (fullName = '') => {
  const trimmed = fullName.trim();
  if (!trimmed) return '-';
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 2) return trimmed;
  return `${parts[0]} ${parts[1]}`;
};

export default function ModalTaskReview({ task, onClose, onStatusChange }) {
  const isOpen = !!task;

  if (!isOpen) return null;

  const createdLabel = task.criadoEm || '-';
  const rawCreator = String(task.creatorDisplayName || '').trim();
  const creatorLabel = rawCreator ? getShortName(rawCreator) : 'Nome do Criador';
  const deliveryLabel = task.dataEntrega
    ? (() => {
        const date = new Date(task.dataEntrega);
        const datePart = date.toLocaleDateString('pt-BR');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${datePart}, ${hours}h${minutes}`;
      })()
    : '-';

  const tagIcon = getTagIcon(task.tag);

  const handleReject = async () => {
    if (!task?.id) return;
    await onStatusChange?.(task.id, 'rejected', { projectId: task.projectId });
    onClose?.();
  };

  const handleConclude = async () => {
    if (!task?.id) return;
    await onStatusChange?.(task.id, 'concluded', { projectId: task.projectId });
    onClose?.();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-details-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-details-card">
          <div className="modal-details-header">
            <div className="modal-details-headerLeft">
              <div className="modal-details-appIcon" aria-hidden="true" style={{ width: 42, height: 42 }}>
                {tagIcon ? (
                  <img
                    src={tagIcon}
                    alt={task.tag || ''}
                  />
                ) : (
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {(task.tag || '--').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="modal-details-tagWrap">
                <div className="modal-details-tag">{task.tag || '—'}</div>
                <div className="modal-details-created">Criado em {createdLabel} por {creatorLabel}</div>
              </div>
            </div>

            <button
              type="button"
              className="modal-details-closeBtn"
              onClick={() => onClose?.()}
              aria-label="Fechar"
              title="Fechar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="modal-details-title">{task.titulo || 'Sem título'}</div>

          <div className="modal-details-meta">
            <div className="modal-details-metaRow">
              <span className="modal-details-metaLabel">Prioridade</span>
              <span className={`modal-details-metaValue priority-${(task.prioridade || '').replace(/\s+/g, '')}`}>{task.prioridade || '-'}</span>
            </div>

            <div className="modal-details-metaRow">
              <span className="modal-details-metaLabel">Prazo</span>
              <span className="modal-details-metaValue">{deliveryLabel}</span>
            </div>

            <div className="modal-details-metaRow">
              <span className="modal-details-metaLabel">Status</span>
              <select
                className="modal-details-statusSelect status--in-review"
                value="in-review"
                disabled
                aria-readonly="true"
              >
                <option value="in-review">Revisão</option>
              </select>
            </div>

            <div className="modal-details-metaRow modal-details-metaRow--executor">
              <span className="modal-details-metaLabel">Executor</span>
              <span className="modal-details-metaValue">{getShortName(task.executorName || task.executor)}</span>
            </div>
          </div>

          <div className="modal-details-divider" />

          <div className="modal-details-description">
            {task.descricao || ''}
          </div>

          <div className="modal-details-divider" />

          <footer className="modal-edit-footer">
            <button
              type="button"
              className="modal-edit-btn modal-review-btnReject"
              onClick={handleReject}
            >
              Rejeitar
            </button>
            <button
              type="button"
              className="modal-edit-btn modal-review-btnConclude"
              onClick={handleConclude}
            >
              Concluir
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
