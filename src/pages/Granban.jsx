import { useState } from 'react';
import { Column } from '../components/Board/Column';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTarefa } from '../hooks/UseTarefas';
import { COLUNAS } from '../constants/boardConfig';
import '../style/Granban.css';
import { Heading } from '../components/Layout/Heading';
import { Navbar } from '../components/Layout/Navbar';
import ModalNewTask from '../components/Task/ModalNewTask';
import ModalEditTask from '../components/Task/ModalEditTask';

export default function Granban() {
  const {
    loading,
    adicionarTarefa,
    excluirTarefa,
    atualizarStatusTarefa,
    getTarefasPorColuna
  } = useTarefa();

  const [tarefaInput, setTarefaInput] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = (task) => { setEditingTask(task); setShowEditModal(true);  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if(!destination) return;
    if(destination.droppableId === source.droppableId && destination.index === source.index) return;

    atualizarStatusTarefa(draggableId, destination.droppableId)
  };

  return (
      <>
        <Navbar page="Granban"/>
        <div className="granban-container dark">
        <Heading page="Kanban pessoal"/>
        <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
        </div>

        {showEditModal && (
          <ModalEditTask
            task={editingTask}
            onClose={() => setShowEditModal(false)}
          />
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
            
            {COLUNAS.map(coluna => (
              <Column
                key={coluna.id}
                id={coluna.id}
                title={coluna.titulo}
                tasks={getTarefasPorColuna(coluna.id)}
                onDelete={excluirTarefa}
                onEdit={handleEdit}
              />
            ))}
            
          </div>
        </DragDropContext>

      </div>
    </>
  )
}

