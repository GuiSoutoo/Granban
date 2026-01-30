export const createEmptyMeta = () => ({
  list: [],
  executors: new Set(),
  creatorUids: new Set(),
  creatorNames: new Set(),
});

export const collectMetaForTask = (task, meta) => {
  if (!task || !meta) return;
  if (task.executor) meta.executors.add(task.executor);
  if (task.createdByUid) meta.creatorUids.add(task.createdByUid);
  if (task.createdByName) meta.creatorNames.add(task.createdByName);
};
