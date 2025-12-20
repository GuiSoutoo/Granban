import { useState } from 'react';
import { Column } from '../components/Board/Column';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTarefa } from '../hooks/UseTarefas';
import { COLUNAS } from '../constants/boardConfig';
import '../style/Granban.css';
import { Heading } from '../components/Layout/Heading';
import { Navbar } from '../components/Layout/Navbar';

export default function Granban() {
  const {
    loading,
    adicionarTarefa,
    excluirTarefa,
    atualizarStatusTarefa,
    getTarefasPorColuna
  } = useTarefa();

  const [tarefaInput, setTarefaInput] = useState('');

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
            {/* <input 
              value={tarefaInput}
              onChange={(e) => setTarefaInput(e.target.value)}
              placeholder="Nova tarefa..."
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <button 
              onClick={() => {
                adicionarTarefa(tarefaInput);
                setTarefaInput('');
              }}
              disabled={loading}
              >
              {loading ? 'Salvando...' : 'Adicionar'}
            </button> */}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
            
            {COLUNAS.map(coluna => (
              <Column
                key={coluna.id}
                id={coluna.id}
                title={coluna.titulo}
                tasks={getTarefasPorColuna(coluna.id)}
                onDelete={excluirTarefa}
              />
            ))}
            
          </div>
        </DragDropContext>

      </div>
    </>
  )
}

