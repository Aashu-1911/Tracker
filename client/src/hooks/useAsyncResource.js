import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic async hook with ref-based cache, loading/error state, and refetch.
 */
const useAsyncResource = (fetcher, deps = [], options = {}) => {
  const { enabled = true, cacheKey = null, initialData = null, onSuccess, onError } = options;
  const cacheRef = useRef(null);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);

  const refetch = useCallback(
    async (force = false) => {
      if (!enabled) {
        return data;
      }

      const key = typeof cacheKey === "function" ? cacheKey() : cacheKey;
      if (!force && key && cacheRef.current?.key === key) {
        setData(cacheRef.current.data);
        setFromCache(false);
        return cacheRef.current.data;
      }

      setLoading(true);
      setError("");
      setFromCache(false);

      try {
        const result = await fetcher();
        if (key) {
          cacheRef.current = { key, data: result };
        }
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err.message || "Failed to load data.";
        setError(message);
        onError?.(err);

        if (typeof options.fallback === "function") {
          const fallbackData = options.fallback();
          if (fallbackData != null) {
            setData(fallbackData);
            setFromCache(true);
            return fallbackData;
          }
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, fetcher, cacheKey, onSuccess, onError, options.fallback]
  );

  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled, refetch, deps]);

  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  return {
    data,
    loading,
    error,
    fromCache,
    refetch: () => refetch(true),
    invalidateCache,
    setData,
  };
};

export default useAsyncResource;
