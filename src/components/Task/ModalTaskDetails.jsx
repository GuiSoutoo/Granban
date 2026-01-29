import { useEffect, useState } from 'react';
import '../../style/Modal.css';

import ChangeExecutorIcon from '../../assets/changeExecutorIcon.svg';
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

export default function ModalTaskDetails({ task, onClose, onEdit, onDelete, onStatusChange }) {
  const isOpen = !!task;
  const [currentStatus, setCurrentStatus] = useState(task?.status || 'to-do');

  useEffect(() => {
    if (task?.status) {
      setCurrentStatus(task.status);
    }
  }, [task?.status]);

  if (!isOpen) return null;

  const createdLabel = task.criadoEm || '-';
  const rawCreator = String(task.creatorDisplayName || '').trim();
  const creatorLabel = rawCreator ? getShortName(rawCreator) : '';
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

  const handleDelete = async () => {
    if (!task?.id) return;
    const confirmed = window.confirm('Deseja excluir esta tarefa?');
    if (!confirmed) return;
    await onDelete?.(task);
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
                <div className="modal-details-created">
                  Criado em {createdLabel}
                  {creatorLabel ? ` por ${creatorLabel}` : ' · Criador não registrado'}
                </div>
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
                className={`modal-details-statusSelect status--${currentStatus}`}
                value={currentStatus}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setCurrentStatus(newStatus);
                  onStatusChange?.(task.id, newStatus, { projectId: task.projectId });
                }}
              >
                <option value="to-do">A fazer</option>
                <option value="in-progress">Em progresso</option>
                <option value="in-review">Revisão</option>
                <option value="rejected">Rejeitado</option>
                <option value="concluded">Concluído</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div className="modal-details-metaRow modal-details-metaRow--executor">
              <span className="modal-details-metaLabel">Executor</span>
              <span className="modal-details-metaValue">{getShortName(task.executorName || task.executor || '')}</span>

              <div className="modal-details-actions">
              
                <button
                  type="button"
                  className="modal-details-iconBtn"
                  aria-label="Editar"
                  title="Editar"
                  onClick={() => onEdit?.(task)}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z" fill="currentColor"/>
                    <path d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
                  </svg>
                </button>

                {onDelete ? (
                  <button
                    type="button"
                    className="modal-details-iconBtn modal-details-iconBtn--danger"
                    aria-label="Excluir"
                    title="Excluir"
                    onClick={handleDelete}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="modal-details-divider" />

          <div className="modal-details-description">
            {task.descricao || ''}
          </div>
        </div>
      </div>
    </div>
  );
}
