const TASKS_KEY = "tracker_tasks_backup";
const PROGRESS_KEY = "tracker_progress_backup";
const SYNC_KEY = "tracker_last_sync";

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] Failed to read ${key}:`, error);
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(SYNC_KEY, new Date().toISOString());
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to write ${key}:`, error);
    return false;
  }
};

export const saveTasksBackup = (tasks, meta = {}) => {
  if (!Array.isArray(tasks)) {
    return false;
  }
  return writeJson(TASKS_KEY, { tasks, meta, savedAt: new Date().toISOString() });
};

export const loadTasksBackup = () => {
  const payload = readJson(TASKS_KEY, null);
  return payload?.tasks || [];
};

export const saveProgressBackup = (progress) => {
  if (!progress || typeof progress !== "object") {
    return false;
  }
  return writeJson(PROGRESS_KEY, { progress, savedAt: new Date().toISOString() });
};

export const loadProgressBackup = () => {
  const payload = readJson(PROGRESS_KEY, null);
  return payload?.progress || null;
};

export const getLastSyncTime = () => readJson(SYNC_KEY, null) || localStorage.getItem(SYNC_KEY);
