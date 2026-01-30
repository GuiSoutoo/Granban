import { normalizeValue, sanitizePublicLabel } from './taskUtils';

const resolveCreatorLabel = (rawCreator) => {
  const creatorCandidates = [
    normalizeValue(rawCreator?.username),
    normalizeValue(rawCreator?.email),
    normalizeValue(rawCreator?.uid),
  ];

  for (const candidate of creatorCandidates) {
    const sanitized = sanitizePublicLabel(candidate);
    if (sanitized) {
      return sanitized;
    }
  }

  return '';
};

export const buildTask = (taskDoc, fallbackProjectId = '', fallbackProjectName = '') => {
  const data = taskDoc.data();
  const executor = normalizeValue(data.executor);
  const parentProjectId =
    fallbackProjectId || taskDoc.ref.parent?.parent?.id || normalizeValue(data.projectId) || '';
  const parentProjectName = fallbackProjectName || normalizeValue(data.projectName) || '';

  const rawCreator = {
    username:
      normalizeValue(data?.criador) ||
      normalizeValue(data?.createdBy) ||
      normalizeValue(data?.createdByName) ||
      '',
    email: normalizeValue(data?.criadorEmail) || normalizeValue(data?.createdByEmail) || '',
    uid: normalizeValue(data?.criadorUid) || normalizeValue(data?.createdByUid) || '',
  };

  const storedCreatorDisplayName =
    sanitizePublicLabel(data?.creatorDisplayName) || sanitizePublicLabel(rawCreator.username);

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
    prioridade: data.prioridade,
    projectId: parentProjectId,
    projectName: parentProjectName,
    sourceCollection: parentProjectId ? 'project' : 'personal',
    TaskId: normalizeValue(data?.TaskId),
    rawCreator,
    storedCreatorDisplayName,
  };
};

export const toPublicTask = (task, executorLabel, creatorLabel) => {
  const { rawCreator, storedCreatorDisplayName, ...rest } = task;
  const safeExecutorName = sanitizePublicLabel(executorLabel) || 'Responsável não identificado';

  const creatorCandidates = [
    creatorLabel,
    storedCreatorDisplayName,
    rawCreator?.username,
  ];

  let creatorDisplayName = '';
  for (const candidate of creatorCandidates) {
    const sanitized = sanitizePublicLabel(candidate);
    if (sanitized) {
      creatorDisplayName = sanitized;
      break;
    }
  }

  if (!creatorDisplayName) {
    creatorDisplayName = resolveCreatorLabel(rawCreator) || 'Usuário não identificado';
  }

  return {
    ...rest,
    executorName: safeExecutorName,
    creatorDisplayName,
  };
};
