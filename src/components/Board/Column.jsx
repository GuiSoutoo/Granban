import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';

export function Column({ title, tasks, id, onDelete }) {
  return (
    <div style={{ 
      background: '#ebecf0', 
      padding: '10px', 
      borderRadius: '5px', 
      width: '300px', 
      marginRight: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ marginBottom: '15px', color: '#172b4d' }}>{title}</h3>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flexGrow: 1,
              minHeight: '100px',
              background: snapshot.isDraggingOver ? '#dfe1e6' : 'transparent',
              transition: 'background 0.2s ease'
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                onDelete={onDelete} 
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}