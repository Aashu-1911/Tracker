import { useCallback } from "react";
import { fetchStats, fetchTodayProgress } from "../services/api";
import { loadProgressBackup, saveProgressBackup } from "../utils/storage";
import useAsyncResource from "./useAsyncResource";

const useFetchStats = (options = {}) => {
  const { enabled = true } = options;

  const fetcher = useCallback(async () => {
    const [stats, today] = await Promise.all([fetchStats(), fetchTodayProgress()]);
    return { stats, today };
  }, []);

  const { data, loading, error, fromCache, refetch, invalidateCache } = useAsyncResource(
    fetcher,
    [enabled],
    {
      enabled,
      cacheKey: "stats:today",
      initialData: { stats: null, today: null },
      onSuccess: (result) => {
        saveProgressBackup({ stats: result.stats, today: result.today });
      },
      fallback: () => {
        const backup = loadProgressBackup();
        if (!backup?.stats && !backup?.today) {
          return null;
        }
        return {
          stats: backup.stats || null,
          today: backup.today || null,
          fromBackup: true,
        };
      },
    }
  );

  return {
    stats: data?.stats || null,
    today: data?.today || null,
    loading,
    error,
    fromCache: fromCache || Boolean(data?.fromBackup),
    refetch,
    invalidateCache,
  };
};

export default useFetchStats;
