import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Navbar } from '../components/Layout/Navbar';
import { Column } from '../components/Board/Column';
import { DragDropContext } from '@hello-pangea/dnd';

export default function Granban() {
  const [loading, setLoading] = useState(false);
  const [tarefas, setTarefas] = useState([]);
  const [tarefaInput, setTarefaInput] = useState('');

useEffect(() => {
    async function carregarTarefas(){
      const tarefasRef = collection(db, "tarefas");
      onSnapshot(tarefasRef, (snapshot) => {
        let lista = [];

        snapshot.forEach((doc) => {
          lista.push({
            id: doc.id,
            nome: doc.data().titulo,
            completada: doc.data().completada
          })
        })

        setTarefas(lista); 
      })
    }
    carregarTarefas();
  }, [])

  const adicionarTarefa = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "tarefas"), {
        titulo: tarefaInput,
        criadoEm: new Date(),
        completada: false
      });
      alert("Sucesso! Tarefa enviada para o banco.")
    } catch (error){
      console.error("Erro ao adicionar:", error);
      alert("Erro! Veja o console (F12).")
    }
    setLoading(false);
  };

  async function excluirTarefa(id){
    const docRef = doc(db, "tarefas", id);
    await deleteDoc(docRef);
  }

  async function editarTarefa(tarefa){
    const docRef = doc(db, "tarefas", tarefa.id);
    await updateDoc(docRef, {
      completada: !tarefa.completada
    })
  }

const onDragEnd = async (result) => {
  const { destination, source, draggableID } = result;
  if(!destination) return;
  if(destination.droppableId === source.droppableId && destination.index === source.index) return;
  const novoStatus = destination.droppableId === 'done';
  const docRef = doc(db, "tarefas", draggableId);
  await updateDoc(docRef, {
    completada: novoStatus
  });
};

  const tarefasAFazer = tarefas.filter(tarefa => !tarefa.completada);
  const tarefasConcluidas = tarefas.filter(tarefa => tarefa.completada);

  return (
    <div className="granban-container" style={{ padding: '20px', backgroundColor: '#f4f5f7', minHeight: '100vh' }}>
      
      <Navbar title="Granban - Conectado ao Firebase" />
++
      <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
          <input 
            value={tarefaInput}
            onChange={(e) => setTarefaInput(e.target.value)}
            placeholder="Nova tarefa..."
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button onClick={adicionarTarefa} disabled={loading} style={{ padding: '10px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '5px' }}>
            {loading ? 'Salvando...' : 'Adicionar'}
          </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          
          <Column 
              title="A Fazer" 
              id="todo" 
              tasks={tarefasAFazer} 
              onDelete={excluirTarefa}
          />

          <Column 
              title="Concluído" 
              id="done" 
              tasks={tarefasConcluidas} 
              onDelete={excluirTarefa}
          />
          
        </div>
      </DragDropContext>

    </div>
  )
}

