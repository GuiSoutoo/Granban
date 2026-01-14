import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TaskButton } from './TaskButton';
import { useTarefa } from '../../hooks/UseTarefas';
import '../../style/Task.css';

export function TaskCard({ task, index, onDelete, onEdit, isMoving }) {
  const { atualizarStatusTarefa } = useTarefa();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  // Esconde o card se está sendo movido (evita o "fantasma")
  if (isMoving) {
    return null;
  }

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    userSelect: 'none',
    padding: '16px',
    margin: '0 0 8px 0',
    minHeight: '50px',
    backgroundColor: 'white',
    borderRadius: '5px',
    boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
    borderLeft: task.completada ? '5px solid #36B37E' : '5px solid #FFAB00',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 1,
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cardTask"
    >
      <div className="headTask">
        <div className="infoTask">
          <p>{task.tag}</p>
          <h5>{task.tag}</h5>
        </div>
        <div className="dateTask">
          <p>{task.dataEntrega ? new Date(task.dataEntrega).toLocaleDateString('pt-BR') : '-'}</p>
          <p>{task.criadoEm}</p>
        </div>
      </div>
      
      <h3>{task.titulo}</h3>
      <div className="ownersTask">
        <p>Executor: {task.executor}</p>
        <p>Criador: {task.criador}</p>
      </div>
      
      <div className="buttonTask">
        <div className="actionButtons">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✏️
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            style={{ background: 'transparent', border: 'none', color: '#ff5630', cursor: 'pointer', fontWeight: 'bold' }}
          >
            X
          </button>
        </div>

        <TaskButton
          status={task.status}
          taskId={task.id}
          onStatusChange={(id, newStatus) => atualizarStatusTarefa(id, newStatus)}
        />
      </div>
    </div>
  );
}