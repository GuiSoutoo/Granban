export const createEmptyMeta = () => ({
  list: [],
  executors: new Set(),
  creatorUsernames: new Set(),
  creatorEmails: new Set(),
  creatorUids: new Set(),
});

export const collectMetaForTask = (task, meta) => {
  if (!task || !meta) return;
  if (task.executor) meta.executors.add(task.executor);
  const rawCreator = task.rawCreator || {};
  if (rawCreator.username) meta.creatorUsernames.add(rawCreator.username);
  if (rawCreator.email) meta.creatorEmails.add(rawCreator.email);
  if (rawCreator.uid) meta.creatorUids.add(rawCreator.uid);
};
