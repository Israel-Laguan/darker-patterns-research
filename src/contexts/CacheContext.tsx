// src/contexts/CacheContext.tsx
'use client';

import React, { createContext, useContext, useRef, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import Dexie, { Table } from 'dexie';
import { CacheLevel, CacheEntry, CACHE_TTL_MAP } from '@/lib/cache/types';

interface CacheContextValue {
  set: <T>(key: string, data: T, level?: CacheLevel, customTtlMs?: number) => Promise<void>;
  get: <T>(key: string) => Promise<T | null>;
  invalidateByPattern: (pattern: string) => Promise<void>;
  cleanupExpired: () => Promise<void>;
  cleanupByLevel: (level: CacheLevel) => Promise<void>;
  isReady: boolean;
  error: Error | null;
}

const CacheContext = createContext<CacheContextValue | null>(null);

class CacheDB extends Dexie {
  cache!: Table<CacheEntry>;

  constructor(dbName: string) {
    super(dbName);
    this.version(1).stores({
      cache: '&key, expiresAt, level, createdAt',
    });
  }
}

interface CacheProviderProps {
  children: ReactNode;
  dbName?: string;
  cleanupIntervalMs?: number;
}

export function CacheProvider({
  children,
  dbName = 'AppCacheDB',
  cleanupIntervalMs = 1000 * 60 * 10, // Default: 10 minutes
}: CacheProviderProps) {
  const dbRef = useRef<CacheDB>();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCacheError = useCallback((context: string, error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[CacheProvider Error: ${context}]`, err);
    setError(err);
  }, []);

  useEffect(() => {
    const db = new CacheDB(dbName);
    db.open()
      .then(() => {
        dbRef.current = db;
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
  }, [isReady, cleanupIntervalMs, handleCacheError]);

  const contextValue = useMemo<CacheContextValue>(
    () => ({
      isReady,
      error,
      async set<T>(key: string, data: T, level: CacheLevel = CacheLevel.STANDARD, customTtlMs?: number) {
        if (!dbRef.current) return;
        try {
          const now = Date.now();
          const ttl = customTtlMs ?? CACHE_TTL_MAP[level];
          const entry: CacheEntry<T> = { key, data, createdAt: now, expiresAt: now + ttl, level };
          await dbRef.current.cache.put(entry);
        } catch (e) {
          handleCacheError(`set: ${key}`, e);
        }
      },
      async get<T>(key: string): Promise<T | null> {
        if (!dbRef.current) return null;
        try {
          const record = await dbRef.current.cache.get(key);
          if (!record) return null;

          if (record.expiresAt <= Date.now()) {
            await dbRef.current.cache.delete(key);
            return null;
          }
          return record.data as T;
        } catch (e) {
          handleCacheError(`get: ${key}`, e);
          return null;
        }
      },
      async invalidateByPattern(pattern: string) {
        if (!dbRef.current) return;
        try {
          const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
          const allEntries = await dbRef.current.cache.toArray();
          const keysToDelete = allEntries.filter((entry) => regex.test(entry.key)).map((entry) => entry.key);
          if (keysToDelete.length > 0) {
            await dbRef.current.cache.bulkDelete(keysToDelete);
          }
        } catch (e) {
          handleCacheError(`invalidateByPattern: ${pattern}`, e);
        }
      },
      async cleanupExpired() {
        if (!dbRef.current) return;
        try {
          await dbRef.current.cache.where('expiresAt').belowOrEqual(Date.now()).delete();
        } catch (e) {
          handleCacheError('cleanupExpired', e);
        }
      },
      async cleanupByLevel(level: CacheLevel) {
        if (!dbRef.current) return;
        try {
          await dbRef.current.cache.where('level').equals(level).delete();
        } catch (e) {
          handleCacheError(`cleanupByLevel: ${level}`, e);
        }
      },
    }),
    [isReady, error, handleCacheError],
  );

  return <CacheContext.Provider value={contextValue}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}
