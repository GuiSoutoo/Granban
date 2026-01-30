import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { normalizeValue } from './useTarefas/taskUtils';

/**
 * Hook para observar projetos do usuário atual
 * @param {Object} currentUser - Usuário atual com email
 * @returns {Object} - { projects, loading, error, getProjectById }
 */
export function useProjects(currentUser) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentUserEmail = normalizeValue(currentUser?.email);

    if (!currentUserEmail) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const projectsQuery = query(
      collection(db, 'projects'),
      where('members', 'array-contains', currentUserEmail)
    );

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const projectList = [];
        snapshot.forEach((doc) => {
          projectList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setProjects(projectList);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao observar projetos:', err);
        setError(err?.message || 'Não foi possível carregar projetos.');
        setLoading(false);
      }
    );

    return () => {
      try { unsubscribe(); } catch {}
    };
  }, [currentUser?.email]);

  const getProjectById = useCallback(
    (projectId) => projects.find((p) => p.id === projectId) || null,
    [projects]
  );

  return {
    projects,
    loading,
    error,
    getProjectById,
  };
}

/**
 * Hook para observar tarefas de múltiplos projetos do usuário
 * Usado para o board pessoal (Granban) que mostra tarefas de todos os projetos
 * @param {Object} currentUser - Usuário atual
 * @param {Function} buildTaskFn - Função para construir tarefa a partir do doc
 * @param {Function} matchTaskFn - Função para filtrar tarefas do usuário
 * @param {Function} onTasksUpdate - Callback quando tarefas são atualizadas
 */
export function useProjectTasksObserver(currentUser, buildTaskFn, matchTaskFn, onTasksUpdate) {
  const bucketsRef = useRef(new Map());
  const taskUnsubscribersRef = useRef([]);
  const projectsUnsubRef = useRef(null);

  useEffect(() => {
    const currentUserEmail = normalizeValue(currentUser?.email);

    // Limpa estado anterior
    const cleanup = () => {
      taskUnsubscribersRef.current.forEach((fn) => { try { fn(); } catch {} });
      taskUnsubscribersRef.current = [];
      if (projectsUnsubRef.current) {
        try { projectsUnsubRef.current(); } catch {}
        projectsUnsubRef.current = null;
      }
      bucketsRef.current.clear();
    };

    if (!currentUserEmail) {
      cleanup();
      onTasksUpdate([]);
      return;
    }

    const rebuildAndNotify = () => {
      const allTasks = [];
      bucketsRef.current.forEach((list) => {
        allTasks.push(...list);
      });
      onTasksUpdate(allTasks);
    };

    const projectsQuery = query(
      collection(db, 'projects'),
      where('members', 'array-contains', currentUserEmail)
    );

    projectsUnsubRef.current = onSnapshot(
      projectsQuery,
      (projectsSnapshot) => {
        // Limpa observers antigos de tarefas
        taskUnsubscribersRef.current.forEach((fn) => { try { fn(); } catch {} });
        taskUnsubscribersRef.current = [];
        bucketsRef.current.clear();

        if (projectsSnapshot.empty) {
          rebuildAndNotify();
          return;
        }

        // Para cada projeto, observa suas tarefas
        projectsSnapshot.forEach((projectDoc) => {
          const projId = projectDoc.id;
          const projData = projectDoc.data();
          const projName = projData?.name || '';

          const tasksRef = collection(db, 'projects', projId, 'tasks');
          const unsubTasks = onSnapshot(
            tasksRef,
            (tasksSnapshot) => {
              const list = [];

              tasksSnapshot.forEach((taskDoc) => {
                const task = buildTaskFn(taskDoc, projId, projName);
                if (matchTaskFn && !matchTaskFn(task)) return;
                list.push(task);
              });

              bucketsRef.current.set(projId, list);
              rebuildAndNotify();
            },
            (error) => {
              console.error(`Erro ao observar tarefas do projeto ${projId}:`, error);
              bucketsRef.current.delete(projId);
              rebuildAndNotify();
            }
          );
          taskUnsubscribersRef.current.push(unsubTasks);
        });
      },
      (error) => {
        console.error('Erro ao observar projetos do usuário:', error);
      }
    );

    return cleanup;
  }, [currentUser?.email, buildTaskFn, matchTaskFn, onTasksUpdate]);
}
