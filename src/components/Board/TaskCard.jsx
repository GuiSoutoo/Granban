import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

export function TaskCard({ task, index, onDelete }) {
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
            ...provided.draggableProps.style, // Estilos essenciais da biblioteca
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{task.titulo || task.nome}</span>
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