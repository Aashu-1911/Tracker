import { useCallback, useMemo } from "react";
import { fetchTasks } from "../services/api";
import { loadTasksBackup, saveTasksBackup } from "../utils/storage";
import useAsyncResource from "./useAsyncResource";

const useFetchTasks = (date, filters = {}, options = {}) => {
  const { enabled = true, limit = 100 } = options;

  const cacheKey = useMemo(
    () => `tasks:${date || "all"}:${filters.status || "all"}:${filters.category || "all"}:${filters.priority || "all"}`,
    [date, filters.status, filters.category, filters.priority]
  );

  const fetcher = useCallback(
    () => fetchTasks(date, filters, { page: 1, limit }),
    [date, filters, limit]
  );

  const { data, loading, error, fromCache, refetch, invalidateCache, setData } = useAsyncResource(
    fetcher,
    [cacheKey, enabled],
    {
      enabled,
      cacheKey: () => cacheKey,
      initialData: { tasks: [], count: 0 },
      onSuccess: (result) => {
        saveTasksBackup(result?.tasks || [], { date, filters });
      },
      fallback: () => {
        const backup = loadTasksBackup();
        if (!backup.length) {
          return null;
        }
        return { tasks: backup, count: backup.length, fromBackup: true };
      },
    }
  );

  const tasks = data?.tasks || [];
  const count = data?.count ?? tasks.length;

  return {
    tasks,
    count,
    loading,
    error,
    fromCache: fromCache || Boolean(data?.fromBackup),
    refetch,
    invalidateCache,
    setTasks: (nextTasks) => {
      const payload = { tasks: nextTasks, count: nextTasks.length };
      setData(payload);
      saveTasksBackup(nextTasks, { date, filters });
    },
  };
};

export default useFetchTasks;
