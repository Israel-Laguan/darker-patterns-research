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
 * Represents the structure of an entry in the cache.
 */
export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  createdAt: number;
  expiresAt: number;
  level: CacheLevel;
}

/**
 * Defines the standard interface for a cache manager, whether client-side or server-side.
 * This is the base interface that must be implemented by all cache managers.
 */
export interface CacheManager {
  /**
   * Gets a value from the cache, or sets it using the provided setter if not found.
   * @param key The cache key
   * @param setter Function that returns a promise with the value to cache if not found
   * @param level The cache level (determines TTL if customTtlMs is not provided)
   * @param customTtlMs Optional custom TTL in milliseconds
   */
  getOrSet: <T>(key: string, setter: () => Promise<T>, level?: CacheLevel, customTtlMs?: number) => Promise<T>;

  /**
   * Gets a value from the cache by key.
   * Returns null if the key doesn't exist or the entry has expired.
   */
  get: <T>(key: string) => Promise<T | null>;

  /**
   * Sets a value in the cache.
   * @param key The cache key
   * @param data The data to cache
   * @param level The cache level (determines TTL if customTtlMs is not provided)
   * @param customTtlMs Optional custom TTL in milliseconds
   */
  set: <T>(key: string, data: T, level?: CacheLevel, customTtlMs?: number) => Promise<void>;

  /**
   * Invalidates cache entries matching the given pattern.
   * Note: Implementation may be limited on the client side.
   */
  invalidateByPattern: (pattern: string) => Promise<void>;
}

/**
 * Extends the base CacheManager with client-side specific properties and methods.
 * This is the interface used by the useCache hook.
 */
export interface CacheContextValue extends CacheManager {
  /** Removes all expired entries from the cache */
  cleanupExpired: () => Promise<void>;

  /** Removes all entries of a specific cache level */
  cleanupByLevel: (level: CacheLevel) => Promise<void>;

  /** Whether the cache is ready to be used */
  isReady: boolean;

  /** Any error that occurred during cache operations */
  error: Error | null;
}
