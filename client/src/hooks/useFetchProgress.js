import { useCallback, useMemo } from "react";
import { fetchProgressRange } from "../services/api";
import { loadProgressBackup, saveProgressBackup } from "../utils/storage";
import useAsyncResource from "./useAsyncResource";

const useFetchProgress = (startDate, endDate, options = {}) => {
  const { enabled = true } = options;

  const cacheKey = useMemo(
    () => (startDate && endDate ? `progress:${startDate}:${endDate}` : null),
    [startDate, endDate]
  );

  const fetcher = useCallback(() => {
    if (!startDate || !endDate) {
      return Promise.resolve({ progress: [], summary: null });
    }
    return fetchProgressRange(startDate, endDate);
  }, [startDate, endDate]);

  const { data, loading, error, fromCache, refetch, invalidateCache } = useAsyncResource(
    fetcher,
    [cacheKey, enabled],
    {
      enabled: enabled && Boolean(startDate && endDate),
      cacheKey: () => cacheKey,
      initialData: { progress: [], summary: null },
      onSuccess: (result) => {
        saveProgressBackup({ range: result, startDate, endDate });
      },
      fallback: () => {
        const backup = loadProgressBackup();
        if (!backup?.range) {
          return null;
        }
        return { ...backup.range, fromBackup: true };
      },
    }
  );

  return {
    progress: data?.progress || [],
    summary: data?.summary || null,
    loading,
    error,
    fromCache: fromCache || Boolean(data?.fromBackup),
    refetch,
    invalidateCache,
  };
};

export default useFetchProgress;
