import { useState } from 'react';
import { db } from './services/firebase';
import { collection, addDoc } from 'firebase/firestore';

function App() {
  const [loading, setLoading] = useState(false);

  const adicionarTarefaTeste = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "tarefas"), {
        título: "Configurar Firebase",
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
      <button onClick={adicionarTarefaTeste} disabled={loading}>
        {loading ? "Enviando..." : "Criar Tarefa de Teste"}
      </button>
    </div>
  )
}

export default App
