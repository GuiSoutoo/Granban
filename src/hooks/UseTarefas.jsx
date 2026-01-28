import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';

function chunkArray(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function useTarefa(projectId, projectName) {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tarefasRef = projectId
      ? collection(db, 'projects', projectId, 'tasks')
      : collection(db, 'tarefas');

    const unsubscribe = onSnapshot(tarefasRef, (snapshot) => {
      const baseList = [];
      const executorUsernames = new Set();

      snapshot.forEach((taskDoc) => {
        const data = taskDoc.data();
        const executor = typeof data.executor === 'string' ? data.executor.trim() : '';
        if (executor) executorUsernames.add(executor);

        baseList.push({
          id: taskDoc.id,
          nome: data.titulo,
          titulo: data.titulo,
          status: data.status,
          tag: data.tag,
          executor,
          dataEntrega: data.dataEntrega,
          descricao: data.descricao,
          criadoEm: data.criadoEm ? data.criadoEm.toDate().toLocaleDateString() : '',
          criador: data.criador,
          prioridade: data.prioridade,
          projectId: projectId ? (data.projectId || projectId) : (data.projectId || ''),
          projectName: projectId ? (data.projectName || projectName || '') : (data.projectName || ''),
        });
      });

      if (executorUsernames.size === 0) {
        setTarefas(baseList);
        return;
      }

      (async () => {
        try {
          const usernames = Array.from(executorUsernames);
          const usernameToName = new Map();
          const usersCol = collection(db, 'users');
          const batches = chunkArray(usernames, 10);

          const snaps = await Promise.all(
            batches.map((batch) => getDocs(query(usersCol, where('username', 'in', batch))))
          );

          snaps.forEach((snap) => {
            snap.forEach((userDoc) => {
              const userData = userDoc.data();
              const username = typeof userData?.username === 'string' ? userData.username.trim() : '';
              if (!username) return;
              const name = typeof userData?.name === 'string' ? userData.name.trim() : '';
              usernameToName.set(username, name || username);
            });
          });

          const listWithNames = baseList.map((task) => ({
            ...task,
            executorName: usernameToName.get(task.executor) || task.executor,
          }));

          setTarefas(listWithNames);
        } catch (error) {
          console.error('Erro ao carregar nomes dos executores:', error);
          setTarefas(baseList);
        }
      })();
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