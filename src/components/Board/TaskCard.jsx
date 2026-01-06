import { Draggable } from '@hello-pangea/dnd';

export function TaskCard({ task, index, onDelete, onEdit }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            userSelect: 'none',
            padding: '16px',
            margin: '0 0 8px 0',
            minHeight: '50px',
            backgroundColor: 'white',
            borderRadius: '5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            borderLeft: task.completada ? '5px solid #36B37E' : '5px solid #FFAB00',
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Tarefa: {task.titulo}</span>
            <span>Tag: {task.tag}</span>
            <span>Prioridade: {task.prioridade}</span>
            <span>Data de Entrega: {task.dataEntrega}</span>
            <span>Criado Em: {task.criadoEm}</span>
            <span>Criador: {task.criador}</span>
            <span>Executor: {task.executor}</span>
            
          </div>
          <div>
            <button 
                onClick={() => onEdit(task)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✏️
            </button>
            <button 
                onClick={() => onDelete(task.id)}
                style={{ background: 'transparent', border: 'none', color: '#ff5630', cursor: 'pointer', fontWeight: 'bold' }}
            >
                X
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}