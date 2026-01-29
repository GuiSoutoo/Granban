import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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

export function TaskCard({ task, index, onDelete, onEdit, onOpenDetails, onOpenReview, isMoving, isExpanded = true, showOnlyTitle = false }) {
  const { atualizarStatusTarefa } = useTarefa();

  const openDetails = (e) => {
    e?.stopPropagation?.();
    if (typeof onOpenDetails === 'function') onOpenDetails(task);
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
  const shortId = task.id ? String(task.id).slice(0, 4).toUpperCase() : '';
  const creatorRaw = String(task.criadorName || task.criador || task.criadorEmail || '').trim();
  const creatorDisplay = creatorRaw ? getShortName(creatorRaw) : '';
  const priorityText = task.prioridade
    ? (task.prioridade === 'Urgente' ? 'Urgente' : `${task.prioridade} prioridade`)
    : 'Sem prioridade';

  // Coluna Arquivado recolhida: mostra apenas o código
  if (isArchived && !isExpanded) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`cardTask ${task.status}Card archivedCodeOnly`}
        title={task.titulo}
        style={dragStyle}
      >
        <span className="archivedCodeOnly-text">{shortId ? `#${shortId}` : '#----'}</span>
      </div>
    );
  }

  // Modo compacto (recolher global): título + id curto
  if (showOnlyTitle) {
    const priorityClass = task.prioridade ? `${task.prioridade}Card` : '';
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`cardTask ${task.status}Card titleOnly ${priorityClass}`.trim()}
        title={task.titulo}
        style={dragStyle}
      >
        <h4 className="titleOnly-text">
          {shortId && <span className="titleOnly-id">#{shortId}</span>}
          {task.titulo}
        </h4>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cardTask ${task.status}Card ${task.prioridade}Card`}
      style={dragStyle}
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
            <p className="deliveryDate">{task.dataEntrega ? new Date(task.dataEntrega).toLocaleDateString('pt-BR') : '-'}</p>
          </div>
          <h5 className="projectName">{task.projectName || 'Sem projeto'}</h5>
        </div>
      </div>

      <p className="dateTask">
        {shortId &&<span className="inline-id">#{shortId} </span>}
        <span>· {formatarTempoDecorrido(task.criadoEm)}</span>
        <span>
          {' '}·{' '}
          {creatorDisplay ? `Criado por ${creatorDisplay}` : 'Criador não registrado'}
        </span>
        
      </p>
      <h4>{task.titulo}</h4>
      <hr></hr>
      <div className="bottomTask">
        <p className={task.prioridade}>{priorityText}</p>
        <p><a>Executor</a> {getShortName(task.executorName || task.executor)}</p>
      </div>
      
      <div className="buttonTask">
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