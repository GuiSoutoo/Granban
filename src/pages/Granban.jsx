import { useState } from 'react';
import { Column } from '../components/Board/Column';
import { useTarefa } from '../hooks/UseTarefas';
import { COLUNAS } from '../constants/boardConfig';
import '../style/Granban.css';
import { Heading } from '../components/Layout/Heading';
import { Navbar } from '../components/Layout/Navbar';
import ModalTask from '../components/Task/ModalTask';
import ModalTaskDetails from '../components/Task/ModalTaskDetails';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

export default function Granban() {
  const {
    excluirTarefa,
    atualizarStatusTarefa,
    getTarefasPorColuna
  } = useTarefa();

  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);

  const handleEdit = (task) => { setEditingTask(task); setShowEditModal(true); };
  const handleOpenDetails = (task) => { setDetailsTask(task); };
  const handleAddTask = () => {
    setDetailsTask(null);
    setEditingTask(null);
    setShowEditModal(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.id;
    const newStatus = over.id;
    
    // Verifica se o over.id é uma coluna válida
    const isValidColumn = COLUNAS.some(col => col.id === newStatus);
    if (!isValidColumn) return;
    
    // Esconde o card temporariamente para evitar o "fantasma"
    setMovingTaskId(taskId);
    atualizarStatusTarefa(taskId, newStatus);
    
    // Limpa após um pequeno delay para garantir que o estado atualizou
    setTimeout(() => setMovingTaskId(null), 100);
  };

  return (
    <>
      <Navbar page="Granban"/>
      <div className="granban-container dark">
        <Heading page="Kanban pessoal" onFuncClick={handleAddTask} />
        <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
        </div>

        {showEditModal && (
          <ModalTask
            task={editingTask}
            onClose={() => setShowEditModal(false)}
          />
        )}

        {detailsTask && (
          <ModalTaskDetails
            task={detailsTask}
            onClose={() => setDetailsTask(null)}
            onEdit={(task) => {
              setDetailsTask(null);
              handleEdit(task);
            }}
            onStatusChange={atualizarStatusTarefa}
          />
        )}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="board-granban">
            {COLUNAS.map(coluna => (
              <Column
                key={coluna.id}
                id={coluna.id}
                title={coluna.titulo}
                tasks={getTarefasPorColuna(coluna.id)}
                onDelete={excluirTarefa}
                onEdit={handleEdit}
                onOpenDetails={handleOpenDetails}
                movingTaskId={movingTaskId}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </>
  );
}

