import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { TaskButton } from './TaskButton';
import { useTarefa } from '../../hooks/UseTarefas';
import '../../style/Task.css';

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

const getIcon = (tag) => {
  if (!tag) return null;
  const lowerTag = tag.toLowerCase();
  const foundKey = Object.keys(tagIcons).find(key => lowerTag.includes(key.toLowerCase()));
  return foundKey ? tagIcons[foundKey] : null;
};

function getShortName(fullName = '') {
  const trimmed = fullName.trim();
  if (!trimmed) return '-';
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 2) return trimmed;
  return `${parts[0]} ${parts[1]}`;
}

// Formata a data de criação para exibição relativa (Hoje, Há X dias)
function formatarTempoDecorrido(dataString) {
  if (!dataString) return '-';
  
  const partes = dataString.split('/');
  if (partes.length !== 3) return dataString;
  
  const dataCriacao = new Date(partes[2], partes[1] - 1, partes[0]);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataCriacao.setHours(0, 0, 0, 0);
  
  const dias = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24));
  
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Há 1 dia';
  return `Há ${dias} dias`;
}

function formatarDataPrazo(value) {
  if (!value) return '-';

  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    if (d instanceof Date && !Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR');
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString('pt-BR');
  }

  const str = String(value).trim();
  if (!str) return '-';

  const cleaned = str.split('T')[0].split(' ')[0];

  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length >= 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (day && month && year) {
        const localDate = new Date(year, month - 1, day);
        return localDate.toLocaleDateString('pt-BR');
      }
    }
  }

  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length >= 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]);
      const year = Number(parts[2]);
      if (day && month && year) {
        const localDate = new Date(year, month - 1, day);
        return localDate.toLocaleDateString('pt-BR');
      }
    }
  }

  const fallback = new Date(str);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toLocaleDateString('pt-BR');
  }

  return str;
}

export function TaskCard({ task, index, onDelete, onEdit, onOpenDetails, onOpenReview, isMoving, isExpanded = true, showOnlyTitle = false, onCardClick, hideDetailsButton = false }) {
  const { atualizarStatusTarefa } = useTarefa();
  const navigate = useNavigate();

  const openDetails = (e) => {
    e?.stopPropagation?.();
    if (typeof onOpenDetails === 'function') onOpenDetails(task);
  };

  const handleProjectClick = (e) => {
    e.stopPropagation();
    if (task.projectId) {
      navigate(`/granban/${task.projectId}`);
    }
  };

  const dragId = task.uniqueKey || `${task.projectId || 'personal'}::${task.id}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: {
      docId: task.id,
      projectId: task.projectId || '',
      source: task.sourceCollection || (task.projectId ? 'project' : 'personal'),
    },
  });

  const dragStyle = transform
    ? {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? 'none' : undefined,
      }
    : undefined;

  // Esconde o card se está sendo movido (evita o "fantasma")
  if (isMoving) {
    return null;
  }

  const isArchived = task.status === 'archived';
  const explicitTaskId = typeof task.taskId === 'string' && task.taskId.trim() ? task.taskId.trim().toUpperCase() : '';
  const shortId = explicitTaskId || (task.id ? String(task.id).slice(0, 4).toUpperCase() : '');
  const creatorRaw = String(task.creatorDisplayName || task.createdByName || '').trim();
  const creatorDisplay = creatorRaw ? getShortName(creatorRaw) : '';
  const priorityText = task.priority
    ? (task.priority === 'Urgente' ? 'Urgente' : `${task.priority} prioridade`)
    : 'Sem prioridade';

  // Coluna Arquivado recolhida: mostra apenas o código
  if (isArchived && !isExpanded) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`cardTask ${task.status}Card archivedCodeOnly`}
        title={task.title}
        style={dragStyle}
      >
        <span className="archivedCodeOnly-text">{shortId ? `#${shortId}` : '#----'}</span>
      </div>
    );
  }

  // Modo compacto (recolher global): título + id curto
  if (showOnlyTitle) {
    const priorityClass = task.priority ? `${task.priority}Card` : '';
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`cardTask ${task.status}Card titleOnly ${priorityClass}`.trim()}
        title={task.title}
        style={dragStyle}
      >
        <h4 className="titleOnly-text">
          {shortId && <span className="titleOnly-id">#{shortId}</span>}
          {task.title}
        </h4>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cardTask ${task.status}Card ${task.priority}Card`}
      style={dragStyle}
      onClick={(e) => {
        if (typeof onCardClick === 'function') onCardClick(task, e);
      }}
    >
      <div className="headTask">
        {getIcon(task.tag) && (
          <div className="iconContainer">
            <img src={getIcon(task.tag)} alt={task.tag}/>
          </div>
        )}
        <div className="infoTask">
          <div className="headerTop">
            <p className="tagName">{task.tag}</p>
            <p className="deliveryDate">{formatarDataPrazo(task.dueDate)}</p>
          </div>
          <h5 
            className="projectName" 
            onClick={handleProjectClick}
            style={{ cursor: task.projectId ? 'pointer' : 'default' }}
            title={task.projectId ? `Ir para ${task.projectName || 'projeto'}` : undefined}
          >
            {task.projectName || 'Sem projeto'}
          </h5>
        </div>
      </div>

      <p className="dateTask">
        {shortId && <span className="inline-id">#{shortId} </span>}
        <span className="dateTask-meta">· {formatarTempoDecorrido(task.createdAt)}</span>
        <span className="dateTask-meta">
          {' '}·{' '}
          {creatorDisplay ? `Criado por ${creatorDisplay}` : 'Criador não registrado'}
        </span>
      </p>
      <h4>{task.title}</h4>
      <hr></hr>
      <div className="bottomTask">
        <p className={task.priority}>{priorityText}</p>
        <p><a>Executor</a> {getShortName(task.executorName || task.executor)}</p>
      </div>
      
      <div className="buttonTask">
        {!hideDetailsButton && (
          <button
            type="button"
            className="task-details-btn"
            aria-label="Abrir detalhes"
            title="Detalhes"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={openDetails}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetails(e);
              }
            }}
          >
            ...
          </button>
        )}

        {!isArchived && (
        <TaskButton
          task={task}
          status={task.status}
          taskId={task.id}
          onReview={onOpenReview}
          onStatusChange={atualizarStatusTarefa}
        />
        )}
      </div>
    </div>
  );
}