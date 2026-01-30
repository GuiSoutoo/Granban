export const chunkArray = (list, size) => {
  if (!Array.isArray(list) || size <= 0) return [];
  const output = [];
  for (let index = 0; index < list.length; index += size) {
    output.push(list.slice(index, index + size));
  }
  return output;
};

export const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : '');

export const sanitizePublicLabel = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return '';
  if (normalized.includes('@')) return '';
  return normalized;
};

export const normalizeComparable = (value) => {
  const normalized = normalizeValue(value);
  return normalized ? normalized.toLowerCase() : '';
};

/**
 * Cria um Set com identificadores normalizados do usuário para comparação
 */
export const buildExecutorComparableSet = (currentUser) => {
  const executorComparable = new Set();

  const registerCandidate = (value) => {
    const normalized = normalizeValue(value);
    if (!normalized) return;
    executorComparable.add(normalized.toLowerCase());
  };

  if (currentUser) {
    registerCandidate(currentUser.username);
    registerCandidate(currentUser.name);
    registerCandidate(currentUser.email);
  }

  return executorComparable;
};

/**
 * Verifica se uma tarefa pertence ao usuário atual (apenas por executor)
 */
export const createTaskMatcher = (executorComparable) => {
  return (task) => {
    if (!task) return false;

    // Match apenas por executor
    if (executorComparable.size > 0) {
      const executorKey = normalizeComparable(task.executor);
      if (executorKey && executorComparable.has(executorKey)) {
        return true;
      }
    }

    return false;
  };
};
