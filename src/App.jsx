import { useState, useEffect } from 'react';
import { db } from './services/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';

function App() {
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
        status: "todo",
        criadoEm: new Date()
      });
      alert("Sucesso! Tarefa enviada para o banco.")
    } catch (error){
      console.error("Erro ao adicionar:", error);
      alert("Erro! Veja o console (F12).")
    }
    setLoading(false);
  };

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
              {tarefa.nome}
            </li>
          ))}
        </ul>
    </div>
  )
}

export default App
