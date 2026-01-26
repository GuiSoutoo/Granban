import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export function useTarefa(projectId, projectName) {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tarefasRef = projectId
      ? collection(db, 'projects', projectId, 'tasks')
      : collection(db, 'tarefas');

    const unsubscribe = onSnapshot(tarefasRef, (snapshot) => {
      let lista = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        lista.push({
          id: doc.id,
          nome: data.titulo,
          titulo: data.titulo,
          status: data.status,
          tag: data.tag,
          executor: data.executor,
          dataEntrega: data.dataEntrega,
          descricao: data.descricao,
          criadoEm: data.criadoEm ? data.criadoEm.toDate().toLocaleDateString() : '',
          criador: data.criador,
          prioridade: data.prioridade,
          projectId: projectId ? (data.projectId || projectId) : (data.projectId || ''),
          projectName: projectId ? (data.projectName || projectName || '') : (data.projectName || ''),
        })
      })
      setTarefas(lista); 
    })
    
    return () => unsubscribe(); 
  }, [projectId, projectName])

  const adicionarTarefa = async (dados) => {
    if (!dados.titulo.trim()) {
      alert("Por favor, digite um título");
      return;
    }
    
    setLoading(true);
    try {
      const tarefasRef = projectId
        ? collection(db, 'projects', projectId, 'tasks')
        : collection(db, 'tarefas');

      await addDoc(tarefasRef, {
        titulo: dados.titulo,
        status: dados.status || 'to-do',
        tag: dados.tag || '',
        executor: dados.executor || '',
        dataEntrega: dados.dataEntrega || '',
        descricao: dados.descricao || '',
        criadoEm: new Date(),
        prioridade: dados.prioridade || '',
        ...(projectId ? { projectId, projectName: projectName || '' } : {}),
      });
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      alert("Erro! Veja o console (F12).");
    }
    setLoading(false);
  };

  const atualizarTarefa = async (id, dados) => {
    if (!dados.titulo.trim()) {
      alert("Por favor, digite um título");
      return;
    }

    setLoading(true);
    try {
      const docRef = projectId
        ? doc(db, 'projects', projectId, 'tasks', id)
        : doc(db, 'tarefas', id);
      await updateDoc(docRef, {
        titulo: dados.titulo,
        status: dados.status || 'to-do',
        tag: dados.tag || '',
        executor: dados.executor || '',
        dataEntrega: dados.dataEntrega || '',
        descricao: dados.descricao || '',
        atualizadoEm: new Date(),
        prioridade: dados.prioridade || '',
        ...(projectId ? { projectId, projectName: projectName || '' } : {}),
      });
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      alert("Erro! Veja o console (F12).");
    }
    setLoading(false);
  };
  
  const excluirTarefa = async (id) => {
    try {
      const docRef = projectId
        ? doc(db, 'projects', projectId, 'tasks', id)
        : doc(db, 'tarefas', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const atualizarStatusTarefa = async (id, status) => {
    try {
      const docRef = projectId
        ? doc(db, 'projects', projectId, 'tasks', id)
        : doc(db, 'tarefas', id);
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
    atualizarTarefa,
    atualizarStatusTarefa,
    getTarefasPorColuna
  };
}