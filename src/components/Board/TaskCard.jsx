import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TaskButton } from './TaskButton';
import { useTarefa } from '../../hooks/UseTarefas';
import '../../style/Task.css';

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

export function TaskCard({ task, index, onDelete, onEdit, isMoving }) {
  const { atualizarStatusTarefa } = useTarefa();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  // Esconde o card se está sendo movido (evita o "fantasma")
  if (isMoving) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cardTask ${task.status}Card`}
    >
      <div className="headTask">
        <div className="infoTask">
          <p>{task.tag}</p>
          <h5>Nome Projeto</h5>
        </div>
          <p className="deliveryDate">{task.dataEntrega ? new Date(task.dataEntrega).toLocaleDateString('pt-BR') : '-'}</p>
      </div>

      <p className="dateTask">{formatarTempoDecorrido(task.criadoEm)}</p>
      <h4>{task.titulo}</h4>
      <div className="bottomTask">
        <p className={task.prioridade}>{task.prioridade} prioridade</p>
        <p><a>Executor</a> {task.executor}</p>
      </div>
      
      <div className="buttonTask">
        {/* <div className="actionButtons">
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
        </div> */}

        <h1>...</h1>

        <TaskButton
          status={task.status}
          taskId={task.id}
          onStatusChange={(id, newStatus) => atualizarStatusTarefa(id, newStatus)}
        />
      </div>
    </div>
  );
}