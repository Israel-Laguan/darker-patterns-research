// src/lib/cache/types.ts

/**
 * Defines the persistence level of a cache entry, determining its TTL.
 */
export enum CacheLevel {
  CRITICAL = 'critical', // Very short-lived data (e.g., live events)
  STANDARD = 'standard', // Regularly updated content (e.g., posts)
  STABLE = 'stable', // Data that changes infrequently (e.g., user profiles)
  PERSISTENT = 'persistent', // Data that rarely changes (e.g., app settings)
  CONFIG = 'config', // Long-term data (e.g., feature flags)
}

/**
 * Maps each cache level to its duration in milliseconds.
 */
export const CACHE_TTL_MAP: Record<CacheLevel, number> = {
  [CacheLevel.CRITICAL]: 1000 * 60 * 5, // 5 minutes
  [CacheLevel.STANDARD]: 1000 * 60 * 30, // 30 minutes
  [CacheLevel.STABLE]: 1000 * 60 * 60 * 4, // 4 hours
  [CacheLevel.PERSISTENT]: 1000 * 60 * 60 * 24, // 24 hours
  [CacheLevel.CONFIG]: 1000 * 60 * 60 * 24 * 7, // 1 week
};

/**
 * Represents the structure of an entry in the IndexedDB cache.
 */
/**
 * Defines the standard interface for a cache manager, whether client-side or server-side.
 */
/**
 * Extends the base CacheManager with client-side specific properties and methods.
 */
export interface CacheContextValue extends CacheManager {
  cleanupExpired: () => Promise<void>;
  cleanupByLevel: (level: CacheLevel) => Promise<void>;
  isReady: boolean;
  error: Error | null;
}

export interface CacheManager {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, data: T, level?: CacheLevel, customTtlMs?: number) => Promise<void>;
  invalidateByPattern: (pattern: string) => Promise<void>;
}

/**
 * Represents the structure of an entry in the IndexedDB cache.
 */
export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  createdAt: number;
  expiresAt: number;
  level: CacheLevel;
}
