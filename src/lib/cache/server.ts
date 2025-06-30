// src/lib/cache/server.ts
import { CacheLevel, CacheEntry, CacheManager, CACHE_TTL_MAP } from './types';

/**
 * A simple in-memory cache for server-side use.
 * This is a basic implementation and might not be suitable for all use cases.
 */

declare global {
  // eslint-disable-next-line no-var
  var serverCacheInstance: CacheManager | undefined;
}

class ServerCache implements CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[Cache] No cache found for key: ${key}`);
      }
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[Cache] Data retrieved from cache for key: ${key}`);
    }
    return entry.data as T;
  }

  async set<T>(key: string, data: T, level: CacheLevel = CacheLevel.STANDARD, customTtlMs?: number): Promise<void> {
    const now = Date.now();
    const ttl = customTtlMs ?? CACHE_TTL_MAP[level];
    const expiresAt = now + ttl;

    if (process.env.NODE_ENV !== 'production') {
      if (this.cache.has(key)) {
        // eslint-disable-next-line no-console
        console.log(`[Cache] Entry updated for key: ${key}`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[Cache] Entry created for key: ${key}`);
      }
    }

    this.cache.set(key, { key, data, level, createdAt: now, expiresAt });
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async getOrSet<T>(
    key: string,
    setter: () => Promise<T>,
    level: CacheLevel = CacheLevel.STANDARD,
    customTtlMs?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[Server Cache] HIT: ${key}`);
      }
      return cached;
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[Server Cache] MISS: ${key}`);
    }
    const value = await setter();
    await this.set(key, value, level, customTtlMs);
    return value;
  }
}

// In development, use the global object to preserve the cache instance across hot reloads.
// In production, a new instance is created for each serverless function invocation.
export const serverCache: CacheManager =
  process.env.NODE_ENV === 'production'
    ? new ServerCache()
    : global.serverCacheInstance || (global.serverCacheInstance = new ServerCache());
