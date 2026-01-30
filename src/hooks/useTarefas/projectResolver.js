/**
 * Resolve o ID do projeto a partir de options ou usa o padrão
 */
export const resolveProjectId = (projectId, options) => {
  if (typeof options === 'string') return options;
  if (options && typeof options.projectId === 'string') return options.projectId;
  return projectId || '';
};

/**
 * Resolve o nome do projeto a partir de options ou usa o padrão
 */
export const resolveProjectName = (targetProjectId, projectName, options) => {
  if (!targetProjectId) return '';
  if (options && typeof options.projectName === 'string') return options.projectName;
  return projectName || '';
};
