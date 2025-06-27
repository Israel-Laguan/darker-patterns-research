// src/hooks/useAsyncCache.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { CacheLevel } from '@/lib/cache/types';
import { getQueryConfig } from '@/lib/cache/query-registry';

interface UseAsyncCacheOptions<T, P extends unknown[]> {
  queryName: string;
  params: P;
  initialData?: T;
  level?: CacheLevel;
  customTtlMs?: number;
  enabled?: boolean;
}

interface UseAsyncCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAsyncCache<T, P extends unknown[]>(options: UseAsyncCacheOptions<T, P>): UseAsyncCacheReturn<T> {
  const { queryName, params, initialData, level, customTtlMs, enabled = true } = options;

  const { get, set, isReady, error: cacheError } = useCache();
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const { key: getKey, fetcher, level: defaultLevel } = useMemo(() => getQueryConfig<T, P>(queryName), [queryName]);

  const cacheKey = useMemo(() => getKey(...params), [getKey, params]);
  const cacheLevel = level ?? defaultLevel;

  const handleFetch = useCallback(async () => {
    if (!isReady || !enabled) {
      if (!enabled) setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cachedData = await get<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      const fetchedData = await fetcher(...params);

      if (fetchedData !== null) {
        await set(cacheKey, fetchedData, cacheLevel, customTtlMs);
        setData(fetchedData);
      } else {
        setData(null);
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(`[useAsyncCache] Error fetching ${cacheKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetcher, params, get, set, isReady, cacheLevel, customTtlMs, enabled]);

  useEffect(() => {
    if (initialData) {
      set(cacheKey, initialData, cacheLevel, customTtlMs);
      setLoading(false);
    } else if (enabled) {
      handleFetch();
    }
  }, [cacheKey, handleFetch, initialData, set, cacheLevel, customTtlMs, enabled]);

  const combinedError = useMemo(() => error || cacheError, [error, cacheError]);

  return {
    data,
    loading,
    error: combinedError,
    refetch: handleFetch,
  };
}
