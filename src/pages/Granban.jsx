import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

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

  return (
    <div style={{padding: '50px'}}>
      <h1>Granban - Teste de Conexão</h1>
      <button onClick={adicionarTarefa} disabled={loading}>
        {loading ? 'Enviando...' : 'Criar Tarefa de Teste'}
      </button>
      <input
        placeholder="Digite sua tarefa"
        value={tarefaInput}
        onChange={(e) => setTarefaInput(e.target.value)}
        />
      <ul>
          {tarefas.map((tarefa) => (
            <li key={tarefa.id}>
            <span style={{ textDecoration: tarefa.completada ? 'line-through' : 'none' }}>
              {tarefa.nome}
            </span>
            <button onClick={() => editarTarefa(tarefa)}>
              {tarefa.completada ? "Desmarcar" : "Concluir"}
            </button>
            <button onClick={() => excluirTarefa(tarefa.id)}>
              Excluir
            </button>
          </li>
          ))}
        </ul>
    </div>
  )
}

