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

export default function ModalTaskDetails({ task, onClose, onEdit, onStatusChange }) {
  const isOpen = !!task;

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const createdLabel = task.criadoEm || '-';
  const creatorLabel = task.criador || 'Nome do Criador';
  const deliveryLabel = task.dataEntrega
    ? new Date(task.dataEntrega).toLocaleString('pt-BR')
    : '-';

  const tagIcon = getTagIcon(task.tag);

  return (
    <div className="modal-overlay" onClick={() => onClose?.()}>
      <div className="modal-details-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-details-caption">Detalhes de um card</div>

        <div className="modal-details-card">
          <div className="modal-details-header">
            <div className="modal-details-headerLeft">
              <div className="modal-details-appIcon" aria-hidden="true" style={{ width: 42, height: 42 }}>
                {tagIcon ? (
                  <img
                    src={tagIcon}
                    alt=""
                    style={{ width: 42, height: 42, objectFit: 'contain' }}
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
                className="modal-details-statusSelect"
                value={task.status || 'to-do'}
                onChange={(e) => onStatusChange?.(task.id, e.target.value)}
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
              <span className="modal-details-metaValue">{task.executor || '-'}</span>

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
              </div>
            </div>
          </div>

          <div className="modal-details-divider" />

          <div className="modal-details-description">
            {task.descricao || ''}
          </div>

          <div className="modal-details-image">
            <div className="modal-details-imageInner" aria-hidden="true">
              <svg width="78" height="78" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6C4 4.9 4.9 4 6 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V6Z" fill="#6A35D7"/>
                <path d="M8 14L10.5 11.5L14 15L16 13L20 17V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V17L8 14Z" fill="#4B2A7B"/>
                <path d="M15.5 10.5C16.3284 10.5 17 9.82843 17 9C17 8.17157 16.3284 7.5 15.5 7.5C14.6716 7.5 14 8.17157 14 9C14 9.82843 14.6716 10.5 15.5 10.5Z" fill="#4B2A7B"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
