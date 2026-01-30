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
  const rawCreatedAt = data.createdAt || data.criadoEm;
  if (rawCreatedAt) {
    try {
      const date = typeof rawCreatedAt.toDate === 'function' ? rawCreatedAt.toDate() : new Date(rawCreatedAt);
      createdAt = date.toLocaleDateString();
    } catch {
      createdAt = '';
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
    createdAt,
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
