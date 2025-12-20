import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';

export function Column({ title, tasks, id, onDelete }) {
  return (
    <div className="col">
      <h3 className={id}>{title}</h3>
      <div className="col col-status">
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                flexGrow: 1,
                minHeight: '100px',
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
    </div>
  );
}