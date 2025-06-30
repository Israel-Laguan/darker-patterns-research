/* eslint-disable max-lines-per-function */
// src/hooks/useCacheDatabase.ts
import { CACHE_TTL_MAP, CacheEntry, CacheLevel } from '@/lib/cache/types';
import Dexie, { Table } from 'dexie';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

class CacheDB extends Dexie {
  cache!: Table<CacheEntry>;
  constructor(dbName: string) {
    super(dbName);
    this.version(1).stores({ cache: '&key, expiresAt, level, createdAt' });
  }
}

// Create a singleton instance of the database to prevent re-initialization.
let dbInstance: CacheDB | null = null;
const initializeDb = (dbName: string): CacheDB => {
  if (dbInstance) {
    return dbInstance;
  }
  // eslint-disable-next-line no-console
  console.log(`[Cache Debug] Initializing new Dexie DB instance: ${dbName}`);
  dbInstance = new CacheDB(dbName);
  return dbInstance;
};

interface UseCacheDatabaseProps {
  dbName?: string;
  cleanupIntervalMs?: number;
}

/**
 * Logs whether a cache entry is being created or updated.
 * @param db - The Dexie database instance.
 * @param key - The cache key.
 */
async function logCacheStatus(db: CacheDB, key: string) {
  const existingEntry = await db.cache.get(key);
  if (existingEntry) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[Cache] Entry updated for key: ${key}`);
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[Cache] Entry created for key: ${key}`);
    }
  }
}

const getCacheEntry = async <T>(
  db: CacheDB,
  key: string,
  handleCacheError: (operation: string, error: unknown) => void,
): Promise<CacheEntry<T> | null> => {
  try {
    const record = await db.cache.get(key);
    if (!record) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[Cache] No cache found for key: ${key}`);
      }
      return null;
    }

    if (record.expiresAt <= Date.now()) {
      await db.cache.delete(key);
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[Cache] Data retrieved from cache for key: ${key}`);
    }
    return record as CacheEntry<T>;
  } catch (e) {
    handleCacheError(`get: ${key}`, e);
    return null;
  }
};

const cleanupExpiredEntries = async (db: CacheDB, handleCacheError: (operation: string, error: unknown) => void) => {
  try {
    await db.cache.where('expiresAt').belowOrEqual(Date.now()).delete();
  } catch (e) {
    handleCacheError('cleanupExpired', e);
  }
};

const cleanupEntriesByLevel = async (
  db: CacheDB,
  level: CacheLevel,
  handleCacheError: (operation: string, error: unknown) => void,
) => {
  try {
    await db.cache.where('level').equals(level).delete();
  } catch (e) {
    handleCacheError(`cleanupByLevel: ${level}`, e);
  }
};

function useCacheMethods(
  dbRef: React.MutableRefObject<CacheDB | undefined>,
  handleCacheError: (context: string, error: unknown) => void,
) {
  const get = useCallback(
    async <T>(key: string): Promise<T | null> => {
      if (!dbRef.current) return null;
      const entry = await getCacheEntry<T>(dbRef.current, key, handleCacheError);
      return entry ? entry.data : null;
    },
    [dbRef, handleCacheError],
  );

  const set = useCallback(
    async <T>(key: string, data: T, level: CacheLevel = CacheLevel.STANDARD, customTtlMs?: number) => {
      if (!dbRef.current) return;
      try {
        await logCacheStatus(dbRef.current, key);
        const now = Date.now();
        const ttl = customTtlMs ?? CACHE_TTL_MAP[level];
        const expiresAt = now + ttl;
        await dbRef.current.cache.put({ key, data, level, createdAt: now, expiresAt });
      } catch (e) {
        handleCacheError(`set: ${key}`, e);
      }
    },
    [dbRef, handleCacheError],
  );

  const invalidate = useCallback(
    async (key: string) => {
      if (!dbRef.current) return;
      try {
        await dbRef.current.cache.delete(key);
      } catch (e) {
        handleCacheError(`invalidate: ${key}`, e);
      }
    },
    [dbRef, handleCacheError],
  );

  const invalidateByPattern = useCallback(
    async (pattern: string) => {
      if (!dbRef.current) return;
      try {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const prefix = pattern.split('*')[0];
        const keys = await dbRef.current.cache.where('key').startsWith(prefix).keys();
        const matchingKeys = (keys as string[]).filter((key) => regex.test(key));
        if (matchingKeys.length > 0) {
          await dbRef.current.cache.bulkDelete(matchingKeys);
        }
      } catch (e) {
        handleCacheError(`invalidateByPattern: ${pattern}`, e);
      }
    },
    [dbRef, handleCacheError],
  );

  const cleanupExpired = useCallback(async () => {
    if (!dbRef.current) return;
    await cleanupExpiredEntries(dbRef.current, handleCacheError);
  }, [dbRef, handleCacheError]);

  const cleanupByLevel = useCallback(
    async (level: CacheLevel) => {
      if (!dbRef.current) return;
      await cleanupEntriesByLevel(dbRef.current, level, handleCacheError);
    },
    [dbRef, handleCacheError],
  );

  const getOrSet = useCallback(
    async <T>(
      key: string,
      setter: () => Promise<T>,
      level: CacheLevel = CacheLevel.STANDARD,
      customTtlMs?: number,
    ): Promise<T> => {
      const existing = await get<T>(key);
      if (existing !== null && existing !== undefined) {
        return existing;
      }
      const value = await setter();
      await set<T>(key, value, level, customTtlMs);
      return value;
    },
    [get, set],
  );

  return useMemo(
    () => ({
      get,
      set,
      invalidate,
      invalidateByPattern,
      cleanupExpired,
      cleanupByLevel,
      getOrSet,
    }),
    [set, get, invalidate, invalidateByPattern, cleanupExpired, cleanupByLevel, getOrSet],
  );
}

export function useCacheDatabase({
  dbName = 'AppCacheDB',
  cleanupIntervalMs = 1000 * 60 * 10,
}: UseCacheDatabaseProps = {}) {
  const dbRef = useRef<CacheDB | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCacheError = useCallback((context: string, error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[CacheDatabase Hook Error: ${context}]`, err);
    setError(err);
  }, []);

  useEffect(() => {
    if (dbRef.current) {
      return; // Already initialized
    }

    const db = initializeDb(dbName);

    db.open()
      .then(() => {
        // eslint-disable-next-line no-console
        console.log(`[Cache Debug] Dexie DB "${dbName}" opened successfully.`);
        dbRef.current = db;
        // Perform initial cleanup of expired items
        return db.cache.where('expiresAt').belowOrEqual(Date.now()).delete();
      })
      .then(() => setIsReady(true))
      .catch((e) => handleCacheError('Initialization', e));
  }, [dbName, handleCacheError]);

  useEffect(() => {
    if (!isReady) return;
    const performCleanup = () => {
      dbRef.current?.cache
        .where('expiresAt')
        .belowOrEqual(Date.now())
        .delete()
        .catch((e) => handleCacheError('Auto Cleanup', e));
    };
    window.addEventListener('focus', performCleanup);
    const intervalId = setInterval(performCleanup, cleanupIntervalMs);
    return () => {
      window.removeEventListener('focus', performCleanup);
      clearInterval(intervalId);
    };
  }, [isReady, cleanupIntervalMs, handleCacheError, dbRef]);

  const cacheMethods = useCacheMethods(dbRef, handleCacheError);

  return useMemo(
    () => ({
      isReady,
      error,
      ...cacheMethods,
    }),
    [isReady, error, cacheMethods],
  );
}
