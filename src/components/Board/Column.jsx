import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';

export function Column({ title, tasks, id, onDelete, onEdit, movingTaskId }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="col">
      <h3 className={id}>{title}</h3>
      <div 
        ref={setNodeRef}
        className="col col-status"
        style={{
          flexGrow: 1,
          minHeight: '100px',
          transition: 'background 0.2s ease',
          backgroundColor: isOver ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
        }}
      >
        {tasks && tasks.map((task, index) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            index={index} 
            onDelete={onDelete}
            onEdit={onEdit}
            isMoving={task.id === movingTaskId}
          />
        ))}
      </div>
    </div>
  );
}