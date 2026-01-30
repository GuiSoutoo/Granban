import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { createEmptyMeta, collectMetaForTask } from './useTarefas/taskMetaUtils';
import { buildTask, toPublicTask } from './useTarefas/taskMapper';
import { resolveUserMaps } from './useTarefas/userLookup';
import { deriveTaskPrefix, computeNextTaskId } from './useTarefas/taskIdGenerator';
import { sanitizePublicLabel, buildExecutorComparableSet, createTaskMatcher } from './useTarefas/taskUtils';
import { resolveProjectId, resolveProjectName } from './useTarefas/projectResolver';
import { useProjectTasksObserver } from './UseProjects';

export function useTarefa(projectId, projectName, currentUser) {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Memoiza funções para o observer de projetos
  const executorComparable = buildExecutorComparableSet(currentUser);
  const matchesCurrentUserTask = useCallback(
    createTaskMatcher(executorComparable),
    [currentUser?.username, currentUser?.name, currentUser?.email]
  );

  // Refs para combinar tarefas pessoais e de projetos
  const personalMetaRef = useRef(createEmptyMeta());
  const projectTasksRef = useRef([]);
  const requestTokenRef = useRef(0);
  const cancelledRef = useRef(false);

  // Função para aplicar lista de tarefas com resolução de nomes
  const applyList = useCallback(async (list, meta, markLoaded) => {
    if (cancelledRef.current) return;

    const effectiveMeta = meta || createEmptyMeta();
    const requiresLookup = Boolean(
      (effectiveMeta.executors && effectiveMeta.executors.size) ||
      (effectiveMeta.creatorUsernames && effectiveMeta.creatorUsernames.size) ||
      (effectiveMeta.creatorEmails && effectiveMeta.creatorEmails.size) ||
      (effectiveMeta.creatorUids && effectiveMeta.creatorUids.size)
    );

    if (!requiresLookup) {
      setTarefas(
        list.map((task) =>
          toPublicTask(task, task.executor, task.storedCreatorDisplayName)
        )
      );
      markLoaded?.();
      return;
    }

    const currentToken = ++requestTokenRef.current;

    try {
      const { nameByUsername, nameByEmail, nameByUid } = await resolveUserMaps(effectiveMeta);
      if (cancelledRef.current || currentToken !== requestTokenRef.current) return;

      setTarefas(
        list.map((task) => {
          const executorName = nameByUsername.get(task.executor) || task.executor;
          const creatorName =
            (task.rawCreator?.uid && nameByUid.get(task.rawCreator.uid)) ||
            (task.rawCreator?.email && nameByEmail.get(task.rawCreator.email)) ||
            (task.rawCreator?.username && nameByUsername.get(task.rawCreator.username)) ||
            task.storedCreatorDisplayName ||
            '';

          return toPublicTask(task, executorName, creatorName);
        })
      );
      markLoaded?.();
    } catch (error) {
      console.error('Erro ao carregar nomes dos usuários:', error);
      if (!cancelledRef.current && currentToken === requestTokenRef.current) {
        setTarefas(
          list.map((task) =>
            toPublicTask(task, task.executor, task.storedCreatorDisplayName)
          )
        );
        markLoaded?.();
      }
    }
  }, []);

  // Função para combinar tarefas pessoais e de projetos
  const updateCombined = useCallback(() => {
    const personalMeta = personalMetaRef.current;
    const projectTasks = projectTasksRef.current;

    // Coleta meta das tarefas de projetos
    const projectMeta = createEmptyMeta();
    projectTasks.forEach((task) => {
      projectMeta.list.push(task);
      collectMetaForTask(task, projectMeta);
    });

    const combinedList = [...personalMeta.list, ...projectMeta.list];
    const combinedMeta = {
      list: combinedList,
      executors: new Set([...personalMeta.executors, ...projectMeta.executors]),
      creatorUsernames: new Set([...personalMeta.creatorUsernames, ...projectMeta.creatorUsernames]),
      creatorEmails: new Set([...personalMeta.creatorEmails, ...projectMeta.creatorEmails]),
      creatorUids: new Set([...personalMeta.creatorUids, ...projectMeta.creatorUids]),
    };

    applyList(combinedList, combinedMeta, () => setLoading(false));
  }, [applyList]);

  // Callback para quando tarefas de projetos são atualizadas
  const handleProjectTasksUpdate = useCallback((tasks) => {
    projectTasksRef.current = tasks;
    updateCombined();
  }, [updateCombined]);

  // Observer de tarefas de projetos (só ativo quando não tem projectId específico)
  useProjectTasksObserver(
    projectId ? null : currentUser,
    buildTask,
    matchesCurrentUserTask,
    handleProjectTasksUpdate
  );

  // Effect para projeto específico ou tarefas pessoais
  useEffect(() => {
    cancelledRef.current = false;

    setLoading(true);

    const markLoaded = () => {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    };

    // Se não temos projectId e também não temos nenhum identificador do usuário,
    // aguardamos até ter informações para buscar tarefas
    if (!projectId && executorComparable.size === 0) {
      markLoaded();
      return () => { cancelledRef.current = true; };
    }

    // Modo projeto específico
    if (projectId) {
      const tarefasRef = collection(db, 'projects', projectId, 'tasks');

      const unsubscribe = onSnapshot(
        tarefasRef,
        (snapshot) => {
          const meta = createEmptyMeta();

          snapshot.forEach((taskDoc) => {
            const task = buildTask(taskDoc, projectId, projectName || '');
            meta.list.push(task);
            collectMetaForTask(task, meta);
          });

          applyList(meta.list, meta, markLoaded);
        },
        (error) => {
          console.error('Erro ao observar tarefas do projeto:', error);
          markLoaded();
        }
      );

      return () => {
        cancelledRef.current = true;
        unsubscribe();
      };
    }

    // Modo board pessoal - observa tarefas pessoais
    const personalRef = collection(db, 'tarefas');
    personalMetaRef.current = createEmptyMeta();

    const unsubscribePersonal = onSnapshot(
      personalRef,
      (snapshot) => {
        const meta = createEmptyMeta();

        snapshot.forEach((taskDoc) => {
          const task = buildTask(taskDoc);
          if (!matchesCurrentUserTask(task)) return;
          meta.list.push(task);
          collectMetaForTask(task, meta);
        });

        personalMetaRef.current = meta;
        updateCombined();
      },
      (error) => {
        console.error('Erro ao observar tarefas pessoais:', error);
        markLoaded();
      }
    );

    return () => {
      cancelledRef.current = true;
      unsubscribePersonal();
    };
  }, [projectId, projectName, executorComparable.size, matchesCurrentUserTask, applyList, updateCombined]);

  const adicionarTarefa = async (dados, options) => {
    if (!dados.titulo.trim()) {
      alert("Por favor, digite um título");
      return;
    }
    
    setLoading(true);
    try {
      const targetProjectId = resolveProjectId(projectId, options);
      const targetProjectName = resolveProjectName(targetProjectId, projectName, options);

      const tarefasRef = targetProjectId
        ? collection(db, 'projects', targetProjectId, 'tasks')
        : collection(db, 'tarefas');

      const prefixNameSource = targetProjectId ? targetProjectName : (currentUser?.username || currentUser?.name || 'Personal');
      const prefixIdSource = targetProjectId || currentUser?.uid || currentUser?.email || '';
      const taskIdPrefix = deriveTaskPrefix(prefixNameSource, prefixIdSource);
      const newTaskId = await computeNextTaskId(tarefasRef, taskIdPrefix);

      const creatorName = typeof currentUser?.name === 'string' ? currentUser.name.trim() : '';
      const creatorUsername = typeof currentUser?.username === 'string' ? currentUser.username.trim() : '';
      const creatorUid = typeof currentUser?.uid === 'string' ? currentUser.uid.trim() : '';

      const creatorLabel = sanitizePublicLabel(creatorName) || sanitizePublicLabel(creatorUsername) || 'Usuário não identificado';

      await addDoc(tarefasRef, {
        titulo: dados.titulo,
        status: dados.status || 'to-do',
        tag: dados.tag || '',
        executor: dados.executor || '',
        dataEntrega: dados.dataEntrega || '',
        descricao: dados.descricao || '',
        criadoEm: new Date(),
        criador: creatorLabel || '',
        criadorUid: creatorUid || '',
        creatorDisplayName: creatorLabel,
        prioridade: dados.prioridade || '',
        TaskId: newTaskId,
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
      const targetProjectId = resolveProjectId(projectId, options);
      const targetProjectName = resolveProjectName(targetProjectId, projectName, options);

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
      const targetProjectId = resolveProjectId(projectId, options);

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
      const targetProjectId = resolveProjectId(projectId, options);

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