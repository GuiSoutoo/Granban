import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, getDocs, query, where, collectionGroup, getDoc } from 'firebase/firestore';

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

    const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : '');

    const createEmptyMeta = () => ({
      list: [],
      executors: new Set(),
      creatorUsernames: new Set(),
      creatorEmails: new Set(),
      creatorUids: new Set(),
    });

    const collectMetaForTask = (task, meta) => {
      if (!meta) return;
      if (task.executor) meta.executors.add(task.executor);
      if (task.criador) meta.creatorUsernames.add(task.criador);
      if (task.criadorEmail) meta.creatorEmails.add(task.criadorEmail);
      if (task.criadorUid) meta.creatorUids.add(task.criadorUid);
    };

    const resolveUserMaps = async (meta) => {
      const nameByUsername = new Map();
      const nameByEmail = new Map();
      const nameByUid = new Map();

      if (!meta) {
        return { nameByUsername, nameByEmail, nameByUid };
      }

      const usernamesToFetch = new Set([
        ...meta.executors,
        ...meta.creatorUsernames,
      ]);
      const emailsToFetch = new Set(meta.creatorEmails);
      const uidsToFetch = new Set(meta.creatorUids);

      if (
        usernamesToFetch.size === 0 &&
        emailsToFetch.size === 0 &&
        uidsToFetch.size === 0
      ) {
        return { nameByUsername, nameByEmail, nameByUid };
      }

      const usersCol = collection(db, 'users');
      const seenDocs = new Map();

      const pushDoc = (docSnap) => {
        if (!docSnap?.exists?.()) return;
        const data = docSnap.data() || {};
        seenDocs.set(docSnap.id, data);
      };

      const fetchByField = async (field, valuesSet) => {
        if (!valuesSet || valuesSet.size === 0) return;
        const values = Array.from(valuesSet).map(normalizeValue).filter(Boolean);
        if (values.length === 0) return;

        const batches = chunkArray(values, 10);
        const snaps = await Promise.all(
          batches.map((batch) => getDocs(query(usersCol, where(field, 'in', batch))))
        );

        snaps.forEach((snap) => {
          snap.forEach((docSnap) => {
            pushDoc(docSnap);
          });
        });
      };

      await fetchByField('username', usernamesToFetch);
      await fetchByField('email', emailsToFetch);

      if (uidsToFetch.size > 0) {
        const uidList = Array.from(uidsToFetch).map(normalizeValue).filter(Boolean);
        if (uidList.length > 0) {
          await Promise.all(
            uidList.map(async (uid) => {
              try {
                const docRef = doc(db, 'users', uid);
                const snap = await getDoc(docRef);
                pushDoc(snap);
              } catch (error) {
                console.error('Erro ao buscar usuário por UID:', error);
              }
            })
          );
        }
      }

      seenDocs.forEach((data, docId) => {
        const displayName = normalizeValue(data.name) || normalizeValue(data.username) || normalizeValue(data.email) || docId;
        const username = normalizeValue(data.username);
        const email = normalizeValue(data.email);

        if (username) nameByUsername.set(username, displayName);
        if (email) nameByEmail.set(email, displayName);
        nameByUid.set(docId, displayName);
      });

      return { nameByUsername, nameByEmail, nameByUid };
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
      const executor = normalizeValue(data.executor);
      const parentProjectId = fallbackProjectId || taskDoc.ref.parent?.parent?.id || normalizeValue(data.projectId) || '';
      const parentProjectName = fallbackProjectName || normalizeValue(data.projectName) || '';

      const creatorValue =
        normalizeValue(data?.criador) ||
        normalizeValue(data?.createdBy) ||
        normalizeValue(data?.createdByName) ||
        normalizeValue(data?.createdByEmail);

      const creatorUid = normalizeValue(data?.criadorUid) || normalizeValue(data?.createdByUid);
      const creatorEmail = normalizeValue(data?.criadorEmail) || normalizeValue(data?.createdByEmail);

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
        criador: creatorValue,
        criadorUid: creatorUid,
        criadorEmail: creatorEmail,
        prioridade: data.prioridade,
        projectId: parentProjectId,
        projectName: parentProjectName,
        sourceCollection: parentProjectId ? 'project' : 'personal',
      };
    };

    const applyList = async (list, meta) => {
      if (cancelled) return;

      const effectiveMeta = meta || createEmptyMeta();
      const requiresLookup = Boolean(
        (effectiveMeta.executors && effectiveMeta.executors.size) ||
        (effectiveMeta.creatorUsernames && effectiveMeta.creatorUsernames.size) ||
        (effectiveMeta.creatorEmails && effectiveMeta.creatorEmails.size) ||
        (effectiveMeta.creatorUids && effectiveMeta.creatorUids.size)
      );

      if (!requiresLookup) {
        setTarefas(
          list.map((task) => ({
            ...task,
            executorName: task.executor,
            criadorName: task.criador || task.criadorEmail || '',
          }))
        );
        return;
      }

      const currentToken = ++requestToken;

      try {
        const { nameByUsername, nameByEmail, nameByUid } = await resolveUserMaps(effectiveMeta);
        if (cancelled || currentToken !== requestToken) return;

        setTarefas(
          list.map((task) => {
            const executorName = nameByUsername.get(task.executor) || task.executor;
            const creatorName =
              (task.criadorUid && nameByUid.get(task.criadorUid)) ||
              (task.criadorEmail && nameByEmail.get(task.criadorEmail)) ||
              (task.criador && nameByUsername.get(task.criador)) ||
              task.criador ||
              task.criadorEmail ||
              '';

            return {
              ...task,
              executorName,
              criadorName: creatorName,
            };
          })
        );
      } catch (error) {
        console.error('Erro ao carregar nomes dos usuários:', error);
        if (!cancelled && currentToken === requestToken) {
          setTarefas(
            list.map((task) => ({
              ...task,
              executorName: task.executor,
              criadorName: task.criador || task.criadorEmail || '',
            }))
          );
        }
      }
    };

    if (projectId) {
      const tarefasRef = collection(db, 'projects', projectId, 'tasks');

      const unsubscribe = onSnapshot(tarefasRef, (snapshot) => {
        const meta = createEmptyMeta();

        snapshot.forEach((taskDoc) => {
          const task = buildTask(taskDoc, projectId, projectName || '');
          meta.list.push(task);
          collectMetaForTask(task, meta);
        });

        applyList(meta.list, meta);
      });

      return () => {
        cancelled = true;
        unsubscribe();
      };
    }

    const personalRef = collection(db, 'tarefas');
    let personalMeta = createEmptyMeta();
    let projectMeta = createEmptyMeta();

    const updateCombined = () => {
      const combinedList = [...personalMeta.list, ...projectMeta.list];
      const combinedMeta = {
        list: combinedList,
        executors: new Set([...personalMeta.executors, ...projectMeta.executors]),
        creatorUsernames: new Set([...personalMeta.creatorUsernames, ...projectMeta.creatorUsernames]),
        creatorEmails: new Set([...personalMeta.creatorEmails, ...projectMeta.creatorEmails]),
        creatorUids: new Set([...personalMeta.creatorUids, ...projectMeta.creatorUids]),
      };

      applyList(combinedList, combinedMeta);
    };

    const unsubscribePersonal = onSnapshot(personalRef, (snapshot) => {
      const meta = createEmptyMeta();

      snapshot.forEach((taskDoc) => {
        const task = buildTask(taskDoc);
        if (!matchesCurrentUser(task.executor)) return;
        meta.list.push(task);
        collectMetaForTask(task, meta);
      });

      personalMeta = meta;
      updateCombined();
    });

    let unsubscribeProjectTasks = () => {};

    if (currentUser?.username) {
      const tasksQuery = query(collectionGroup(db, 'tasks'), where('executor', '==', currentUser.username));

      unsubscribeProjectTasks = onSnapshot(tasksQuery, (snapshot) => {
        const meta = createEmptyMeta();

        snapshot.forEach((taskDoc) => {
          const task = buildTask(taskDoc);
          if (!matchesCurrentUser(task.executor)) return;
          meta.list.push(task);
          collectMetaForTask(task, meta);
        });

        projectMeta = meta;
        updateCombined();
      });
    } else {
      projectMeta = createEmptyMeta();
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

      const creatorName = typeof currentUser?.name === 'string' ? currentUser.name.trim() : '';
      const creatorUsername = typeof currentUser?.username === 'string' ? currentUser.username.trim() : '';
      const creatorEmail = typeof currentUser?.email === 'string' ? currentUser.email.trim() : '';
      const creatorUid = typeof currentUser?.uid === 'string' ? currentUser.uid.trim() : '';

      const creatorLabel = creatorName || creatorUsername || creatorEmail;

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
        criadorEmail: creatorEmail || '',
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