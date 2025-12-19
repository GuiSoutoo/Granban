import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export function useTarefa() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tarefasRef = collection(db, "tarefas");
    const unsubscribe = onSnapshot(tarefasRef, (snapshot) => {
      let lista = [];
      snapshot.forEach((doc) => {
        lista.push({
          id: doc.id,
          nome: doc.data().titulo,
          titulo: doc.data().titulo,
          status: doc.data().status
        })
      })
      setTarefas(lista); 
    })
    
    return () => unsubscribe(); 
  }, [])

  const adicionarTarefa = async (titulo) => {
    if (!titulo.trim()) {
      alert("Por favor, digite uma tarefa.");
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, "tarefas"), {
        titulo: titulo,
        criadoEm: new Date(),
        status: 'todo',
      });
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      alert("Erro! Veja o console (F12).");
    }
    setLoading(false);
  };

  const excluirTarefa = async (id) => {
    try {
      const docRef = doc(db, "tarefas", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const atualizarStatusTarefa = async (id, status) => {
    try {
      const docRef = doc(db, "tarefas", id);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  const getTarefasPorColuna = (colunaId) => {
    return tarefas.filter(tarefa => tarefa.status === colunaId)
  }

  return {
    tarefas,
    loading,
    adicionarTarefa,
    excluirTarefa,
    atualizarStatusTarefa,
    getTarefasPorColuna
  };
}