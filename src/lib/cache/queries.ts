// src/lib/cache/queries.ts
import { CacheContextValue, CacheManager } from '@/lib/cache/types';
import { getEntryDetails } from '@/lib/callable-functions';
import {
  getDpoEntry,
  GetDpoEntryResult,
  getGlobalConfig,
  getRevisionById,
  getStatisticsData,
  getSubmissionById,
} from '@/lib/firestore/queries/admin';
import { getDashboardData } from '@/lib/firestore/queries/dashboard';
import { fetchAllResearchers } from '@/lib/firestore/queries/users';
import { GlobalConfig } from '@/lib/firestore/schemas';
import { DPORevision } from '@/types/dpo';
import { EntryWithDetails } from '@/types/entryDetails';
import { DisplaySubmission } from '@/types/submissions';
import { AppUser } from '@/types/user';
import { serverCache } from './server';
import { CacheLevel } from './types';

/**
 * A higher-order function that wraps a Firestore query with caching logic.
 *
 * @param queryFn The original async function to fetch data from Firestore.
 * @param cache The cache context object from the useCache hook.
 * @param cacheKey The key to use for storing the data in the cache.
 * @param level The cache level to determine the TTL.
 * @returns A new function that returns cached data if available, otherwise fetches from Firestore and caches the result.
 */
async function withCache<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  level: CacheLevel,
  cache?: CacheContextValue, // Client-side cache hook
): Promise<T> {
  // Use the client-side cache if it's ready, otherwise fall back to the server-side cache.
  const cacheManager: CacheManager = cache && cache.isReady ? cache : serverCache;
  const cachedData = await cacheManager.get<T>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // eslint-disable-next-line no-console
  console.log(`[Cache] No cache found for key: ${cacheKey}`);

  const freshData = await queryFn();

  await cacheManager.set(cacheKey, freshData, level);

  return freshData;
}

/**
 * Cached version of getGlobalConfig.
 */
export const cachedGetGlobalConfig = (cache?: CacheContextValue): Promise<GlobalConfig<Date>> =>
  withCache(getGlobalConfig, 'globalConfig', CacheLevel.CONFIG, cache);

export const cachedGetDpoEntry = (entryId: string, cache?: CacheContextValue): Promise<GetDpoEntryResult> =>
  withCache(() => getDpoEntry(entryId), `dpo-entry-${entryId}`, CacheLevel.STANDARD, cache);

export const cachedGetRevisionById = (revisionId: string, cache?: CacheContextValue): Promise<DPORevision | null> =>
  withCache(() => getRevisionById(revisionId), `revision-${revisionId}`, CacheLevel.STANDARD, cache);

export const cachedGetSubmissionById = (
  submissionId: string,
  cache?: CacheContextValue,
): Promise<DisplaySubmission | null> =>
  withCache(() => getSubmissionById(submissionId), `submission-${submissionId}`, CacheLevel.STANDARD, cache);

export const cachedGetEntryDetails = (entryId: string, cache?: CacheContextValue): Promise<EntryWithDetails> =>
  withCache(() => getEntryDetails(entryId), `entry-details-${entryId}`, CacheLevel.STANDARD, cache);

export const cachedFetchAllResearchers = (cache?: CacheContextValue): Promise<AppUser[]> =>
  withCache(fetchAllResearchers, 'all-researchers', CacheLevel.PERSISTENT, cache);

export const cachedGetStatisticsData = async () => {
  const cacheKey = 'statistics-data';
  return serverCache.getOrSet(
    cacheKey,
    getStatisticsData,
    CacheLevel.STANDARD,
    1000 * 60 * 60, // 1 hour
  );
};

export const cachedGetDashboardData = async () => {
  const cacheKey = 'dashboard-data';
  return serverCache.getOrSet(
    cacheKey,
    getDashboardData,
    CacheLevel.STANDARD,
    1000 * 60 * 60, // 1 hour
  );
};
