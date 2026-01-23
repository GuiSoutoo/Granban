import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import ArcIcon from '../../assets/ArchivedIcon.svg';

export function Column({ title, tasks, id, onDelete, onEdit, onOpenDetails, onOpenReview, movingTaskId }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleColumn = () => {
    if (id === 'archived') {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`column-wrapper ${id === 'archived' ? 'archived-wrapper' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <h3 
        className={id}  
        onClick={toggleColumn}
        style={{ cursor: id === 'archived' ? 'pointer' : 'default' }}
      >
        {title == 'Arquivado' ? <img src={ArcIcon} alt="Archived Icon"  width='25px'/> : title}
      </h3>
      <div 
        ref={setNodeRef}
        className={`col col-status ${id}Col ${isExpanded ? 'expanded' : ''}`}
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
            onOpenDetails={onOpenDetails}
            onOpenReview={onOpenReview}
            isMoving={task.id === movingTaskId}
            isExpanded={id === 'archived' ? isExpanded : true}
          />
        ))}
      </div>
    </div>
  );
}