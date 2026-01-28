import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, getDocs, query, where, collectionGroup } from 'firebase/firestore';

function chunkArray(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function useTarefa(projectId, projectName, currentUser) {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let requestToken = 0;

    const resolveExecutorNames = async (executorsSet) => {
      const namesMap = new Map();
      if (executorsSet.size === 0) return namesMap;

      const usernames = Array.from(executorsSet);
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
          namesMap.set(username, name || username);
        });
      });

      return namesMap;
    };

    const matchesCurrentUser = (executor) => {
      const comparableExecutor = typeof executor === 'string' ? executor.trim() : '';
      if (!currentUser) return true;
      const username = typeof currentUser.username === 'string' ? currentUser.username.trim() : '';
      const name = typeof currentUser.name === 'string' ? currentUser.name.trim() : '';
      const email = typeof currentUser.email === 'string' ? currentUser.email.trim() : '';

      if (!username && !name && !email) return true;
      if (!comparableExecutor) return false;

      return [username, name, email].some((value) => value && value === comparableExecutor);
    };

    const buildTask = (taskDoc, fallbackProjectId = '', fallbackProjectName = '') => {
      const data = taskDoc.data();
      const executor = typeof data.executor === 'string' ? data.executor.trim() : '';
      const parentProjectId = fallbackProjectId || taskDoc.ref.parent?.parent?.id || data.projectId || '';
      const parentProjectName = fallbackProjectName || data.projectName || '';

      return {
        id: taskDoc.id,
        uniqueKey: `${parentProjectId || 'personal'}::${taskDoc.id}`,
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
        projectId: parentProjectId,
        projectName: parentProjectName,
        sourceCollection: parentProjectId ? 'project' : 'personal',
      };
    };

    const applyList = async (list, executors) => {
      if (cancelled) return;
      if (executors.size === 0) {
        setTarefas(list);
        return;
      }

      const currentToken = ++requestToken;

      try {
        const namesMap = await resolveExecutorNames(executors);
        if (cancelled || currentToken !== requestToken) return;

        setTarefas(
          list.map((task) => ({
            ...task,
            executorName: namesMap.get(task.executor) || task.executor,
          }))
        );
      } catch (error) {
        console.error('Erro ao carregar nomes dos executores:', error);
        if (!cancelled && currentToken === requestToken) {
          setTarefas(list);
        }
      }
    };

    if (projectId) {
      const tarefasRef = collection(db, 'projects', projectId, 'tasks');

      const unsubscribe = onSnapshot(tarefasRef, (snapshot) => {
        const executors = new Set();
        const list = [];

        snapshot.forEach((taskDoc) => {
          const task = buildTask(taskDoc, projectId, projectName || '');
          list.push(task);
          if (task.executor) executors.add(task.executor);
        });

        applyList(list, executors);
      });

      return () => {
        cancelled = true;
        unsubscribe();
      };
    }

    const personalRef = collection(db, 'tarefas');
    let personalTasks = [];
    let personalExecutors = new Set();
    let projectTasks = [];
    let projectExecutors = new Set();

    const updateCombined = () => {
      const combined = [...personalTasks, ...projectTasks];
      const executors = new Set([...personalExecutors, ...projectExecutors]);
      applyList(combined, executors);
    };

    const unsubscribePersonal = onSnapshot(personalRef, (snapshot) => {
      const list = [];
      const executors = new Set();

      snapshot.forEach((taskDoc) => {
        const task = buildTask(taskDoc);
        if (!matchesCurrentUser(task.executor)) return;
        list.push(task);
        if (task.executor) executors.add(task.executor);
      });

      personalTasks = list;
      personalExecutors = executors;
      updateCombined();
    });

    let unsubscribeProjectTasks = () => {};

    if (currentUser?.username) {
      const tasksQuery = query(collectionGroup(db, 'tasks'), where('executor', '==', currentUser.username));

      unsubscribeProjectTasks = onSnapshot(tasksQuery, (snapshot) => {
        const list = [];
        const executors = new Set();

        snapshot.forEach((taskDoc) => {
          const task = buildTask(taskDoc);
          if (!matchesCurrentUser(task.executor)) return;
          list.push(task);
          if (task.executor) executors.add(task.executor);
        });

        projectTasks = list;
        projectExecutors = executors;
        updateCombined();
      });
    } else {
      projectTasks = [];
      projectExecutors = new Set();
      updateCombined();
    }

    return () => {
      cancelled = true;
      unsubscribePersonal();
      unsubscribeProjectTasks();
    };
  }, [projectId, projectName, currentUser?.username, currentUser?.name, currentUser?.email]);

  const resolveProjectId = (override) => {
    if (typeof override === 'string') return override;
    if (override && typeof override.projectId === 'string') return override.projectId;
    return projectId || '';
  };

  const resolveProjectName = (targetProjectId, override) => {
    if (!targetProjectId) return '';
    if (override && typeof override.projectName === 'string') return override.projectName;
    return projectName || '';
  };

  const adicionarTarefa = async (dados, options) => {
    if (!dados.titulo.trim()) {
      alert("Por favor, digite um título");
      return;
    }
    
    setLoading(true);
    try {
      const targetProjectId = resolveProjectId(options);
      const targetProjectName = resolveProjectName(targetProjectId, options);

      const tarefasRef = targetProjectId
        ? collection(db, 'projects', targetProjectId, 'tasks')
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
        ...(targetProjectId ? { projectId: targetProjectId, projectName: targetProjectName } : {}),
      });
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      alert("Erro! Veja o console (F12).");
    }
    setLoading(false);
  };

  const atualizarTarefa = async (id, dados, options) => {
    if (!dados.titulo.trim()) {
      alert("Por favor, digite um título");
      return;
    }

    setLoading(true);
    try {
      const targetProjectId = resolveProjectId(options);
      const targetProjectName = resolveProjectName(targetProjectId, options);

      const docRef = targetProjectId
        ? doc(db, 'projects', targetProjectId, 'tasks', id)
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
        ...(targetProjectId ? { projectId: targetProjectId, projectName: targetProjectName } : {}),
      });
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      alert("Erro! Veja o console (F12).");
    }
    setLoading(false);
  };
  
  const excluirTarefa = async (id, options) => {
    try {
      const targetProjectId = resolveProjectId(options);

      const docRef = targetProjectId
        ? doc(db, 'projects', targetProjectId, 'tasks', id)
        : doc(db, 'tarefas', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const atualizarStatusTarefa = async (id, status, options) => {
    try {
      const targetProjectId = resolveProjectId(options);

      const docRef = targetProjectId
        ? doc(db, 'projects', targetProjectId, 'tasks', id)
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