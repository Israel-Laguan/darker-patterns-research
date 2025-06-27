// src/lib/cache/query-registry.ts
import { CacheLevel } from './types';
import { createCacheKey } from './utils';
import { fetchUserProfile, UserProfile } from '@/lib/firestore/queries/users';

/**
 * Defines the configuration for a cacheable query.
 * @template T The expected return type of the fetcher.
 * @template P The parameters tuple type for the fetcher function.
 */
export interface QueryConfig<T, P extends unknown[]> {
  /**
   * A function that generates a unique cache key based on the query parameters.
   */
  key: (...params: P) => string;
  /**
   * The asynchronous function that fetches the data.
   */
  fetcher: (...params: P) => Promise<T>;
  /**
   * The default cache level (and TTL) for this query.
   */
  level: CacheLevel;
}

/**
 * A generic type for any query configuration, used for the registry.
 */
export type AnyQueryConfig = QueryConfig<unknown, unknown[]>;

/**
 * A type representing the registry of all query configurations.
 * The key is a unique name for the query.
 */
export type QueryRegistry = {
  [queryName: string]: AnyQueryConfig;
};

/**
 * The centralized registry of all cacheable queries in the application.
 * Each entry defines how to fetch and cache a specific piece of data.
 */
export const queryRegistry = {
  userProfile: {
    key: (userId: string) => createCacheKey('userProfile', userId),
    fetcher: (userId: string): Promise<UserProfile | null> => fetchUserProfile(userId),
    level: CacheLevel.STANDARD,
  },
  // Add other cacheable queries here, for example:
  // featureFlags: {
  //   key: () => createCacheKey('featureFlags'),
  //   fetcher: () => fetchFeatureFlags(),
  //   level: CacheLevel.SHORT,
  // },
};

/**
 * Retrieves a query configuration from the registry.
 * @param queryName The name of the query to retrieve.
 * @returns The configuration for the specified query.
 * @throws If the query is not found in the registry.
 */
export function getQueryConfig<T, P extends unknown[]>(queryName: string): QueryConfig<T, P> {
  const config = (queryRegistry as Record<string, AnyQueryConfig>)[queryName];
  if (!config) {
    throw new Error(`Query "${queryName}" not found in registry.`);
  }
  return config as QueryConfig<T, P>;
}
