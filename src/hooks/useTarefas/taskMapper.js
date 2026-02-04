import { normalizeValue, sanitizePublicLabel } from './taskUtils';

/**
 * Converte um documento do Firestore para objeto de tarefa interno
 * Estrutura esperada do Firestore:
 * - title, taskId, status, executor, description, priority, tag, dueDate, createdAt, createdByUid, createdByName
 */
export const buildTask = (taskDoc, fallbackProjectId = '', fallbackProjectName = '') => {
  const data = taskDoc.data();
  const executor = normalizeValue(data.executor);
  const parentProjectId =
    fallbackProjectId || taskDoc.ref.parent?.parent?.id || '';
  const parentProjectName = fallbackProjectName || '';

  // Suporte a campos antigos para migração gradual
  const title = normalizeValue(data.title) || normalizeValue(data.titulo) || '';
  const description = normalizeValue(data.description) || normalizeValue(data.descricao) || '';
  const priority = normalizeValue(data.priority) || normalizeValue(data.prioridade) || '';
  const taskId = normalizeValue(data.taskId) || normalizeValue(data.TaskId) || '';
  const dueDate = data.dueDate || data.dataEntrega || '';
  const createdByUid = normalizeValue(data.createdByUid) || normalizeValue(data.criadorUid) || '';
  const createdByName = normalizeValue(data.createdByName) || normalizeValue(data.criador) || normalizeValue(data.creatorDisplayName) || '';

  // Formata data de criação
  let createdAt = '';
  let createdAtMs = 0;
  const rawCreatedAt = data.createdAt || data.criadoEm;
  if (rawCreatedAt) {
    try {
      const date = typeof rawCreatedAt.toDate === 'function' ? rawCreatedAt.toDate() : new Date(rawCreatedAt);
      if (date instanceof Date && !Number.isNaN(date.getTime())) createdAtMs = date.getTime();
      createdAt = date.toLocaleDateString('pt-BR');
    } catch {
      createdAt = '';
    }
  }

  // Normaliza dueDate para facilitar filtros/ordenação (ms desde epoch)
  let dueDateMs = 0;
  if (dueDate) {
    try {
      const dueRaw = typeof dueDate?.toDate === 'function' ? dueDate.toDate() : new Date(dueDate);
      if (dueRaw instanceof Date && !Number.isNaN(dueRaw.getTime())) dueDateMs = dueRaw.getTime();
    } catch {
      dueDateMs = 0;
    }
  }

  return {
    id: taskDoc.id,
    uniqueKey: `${parentProjectId || 'personal'}::${taskDoc.id}`,
    title,
    status: data.status || 'to-do',
    tag: data.tag || '',
    executor,
    description,
    priority,
    taskId,
    dueDate,
    dueDateMs,
    createdAt,
    createdAtMs,
    createdByUid,
    createdByName,
    projectId: parentProjectId,
    projectName: parentProjectName,
    sourceCollection: parentProjectId ? 'project' : 'personal',
  };
};

/**
 * Converte tarefa interna para formato público (exibição)
 */
export const toPublicTask = (task, executorLabel, creatorLabel) => {
  const safeExecutorName = sanitizePublicLabel(executorLabel) || task.executor || '';
  const safeCreatorName = sanitizePublicLabel(creatorLabel) || task.createdByName || '';

  return {
    ...task,
    executorName: safeExecutorName,
    creatorDisplayName: safeCreatorName,
  };
};
