// src/lib/firestore/queries/admin.ts
import type { AdminEntriesFilter, AdminEntriesSortConfig } from '@/hooks/useAdminEntries';
import { db } from '@/lib/firebase';
import { getMockDashboardData, getMockStatisticsData } from '@/lib/firestore/mocks/admin';
import { GlobalConfig } from '@/lib/firestore/schemas';
import type { DPOEntry, EvaluationData, ParticipantFlag } from '@/types/dpo';
import type { DisplayEntry } from '@/types/entries';
import type { DemographicsSummary, OverviewStats, ResponseAggregates } from '@/types/stats';
import {
  collection,
  doc,
  documentId,
  endBefore,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  limit,
  limitToLast,
  orderBy,
  query,
  type Query,
  type QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { notFound } from 'next/navigation';

export async function getGlobalConfig(): Promise<GlobalConfig<Date>> {
  if (!db) throw new Error('Firebase is not initialized');

  const configDocRef = doc(db, 'admin_settings', 'global_config');
  const configSnap = await getDoc(configDocRef);

  if (configSnap.exists()) {
    const data = configSnap.data() as GlobalConfig<Timestamp>;

    // Ensure all dates are properly converted to Date objects
    return {
      isSurveyActive: data.isSurveyActive ?? false,
      targetReviews: data.targetReviews ?? 5,
      updates: (data.updates || []).map((update) => ({
        ...update,
        date: update.date?.toDate?.() || new Date(),
      })),
    };
  } else {
    console.warn('getGlobalConfig: No global_config document found! Returning default data.');
    return {
      isSurveyActive: false,
      targetReviews: 5,
      updates: [],
    };
  }
}

export interface GetDpoEntryResult {
  entry: DPOEntry;
  evaluations: EvaluationData[];
  flags: ParticipantFlag[];
  demographics?: DemographicsSummary;
  responseAggregates?: ResponseAggregates;
}

export async function getDpoEntry(entryId: string): Promise<GetDpoEntryResult> {
  if (!db) throw new Error('Firebase is not initialized');

  const entryRef = doc(db, 'dpo_entries', entryId);
  const evaluationsQuery = query(
    collection(db, 'evaluations'),
    where('dpoEntryId', '==', entryId),
    orderBy('submittedAt', 'desc'),
  );
  const flagsQuery = query(collection(db, 'participant_flags'), where('dpoEntryId', '==', entryId));
  const statsRef = doc(db, 'stats_demographics', entryId);
  const aggregatesRef = doc(db, 'stats_responses', entryId);

  const [entrySnap, evaluationsSnap, flagsSnap, statsSnap, aggregatesSnap] = await Promise.all([
    getDoc(entryRef),
    getDocs(evaluationsQuery),
    getDocs(flagsQuery),
    getDoc(statsRef),
    getDoc(aggregatesRef),
  ]);

  if (!entrySnap.exists()) {
    notFound();
  }

  const entry = { id: entrySnap.id, ...entrySnap.data() } as DPOEntry;
  const evaluations = evaluationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as EvaluationData[];
  const flags = flagsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ParticipantFlag[];
  const demographics = statsSnap.data() as DemographicsSummary | undefined;
  const responseAggregates = aggregatesSnap.data() as ResponseAggregates | undefined;

  return { entry, evaluations, flags, demographics, responseAggregates };
}

export async function incrementEntryViewCount(entryId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not initialized');
  const entryRef = doc(db, 'dpo_entries', entryId);
  await updateDoc(entryRef, {
    viewCount: increment(1),
  });
}

export function buildDpoEntriesQuery(
  filters: AdminEntriesFilter,
  sort: AdminEntriesSortConfig,
  targetReviews: number,
  pageSize: number,
  pageDirection: 'next' | 'prev' | 'current',
  cursors: {
    first: QueryDocumentSnapshot | null;
    last: QueryDocumentSnapshot | null;
  },
  showArchived: boolean,
) {
  if (!db) throw new Error('Firebase is not initialized');

  const dpoEntriesRef = collection(db, 'dpo_entries');
  let baseQuery = query(dpoEntriesRef);

  const filterConstraints = [];
  // By default, filter out archived entries unless explicitly requested
  if (!showArchived) {
    filterConstraints.push(where('isArchived', '==', false));
  }

  if (filters.category && filters.category.length > 0) {
    filterConstraints.push(where('categories', 'array-contains-any', filters.category.slice(0, 10)));
  } else if (filters.status) {
    if (filters.status === 'needs_reviews') {
      filterConstraints.push(where('reviewCount', '<', targetReviews));
    } else if (filters.status === 'completed') {
      filterConstraints.push(where('reviewCount', '>=', targetReviews));
    }
  }

  if (filterConstraints.length > 0) {
    baseQuery = query(baseQuery, ...filterConstraints);
  }

  if (sort.key) {
    baseQuery = query(baseQuery, orderBy(sort.key, sort.direction));
  }
  if (sort.key !== 'id' && sort.key !== documentId().toString()) {
    baseQuery = query(baseQuery, orderBy(documentId(), sort.direction));
  }

  const countQuery = query(baseQuery);
  let mainQuery = query(baseQuery, limit(pageSize));

  if (pageDirection === 'next' && cursors.last) {
    mainQuery = query(mainQuery, startAfter(cursors.last));
  } else if (pageDirection === 'prev' && cursors.first) {
    mainQuery = query(baseQuery, endBefore(cursors.first), limitToLast(pageSize));
  }

  return { mainQuery, countQuery };
}

export function transformDpoEntry(doc: QueryDocumentSnapshot, targetReviews: number): DisplayEntry {
  const data = doc.data() as DPOEntry;
  const reviewProgress =
    targetReviews > 0 ? Math.min(100, Math.round(((data.reviewCount || 0) / targetReviews) * 100)) : 0;

  return {
    ...data,
    id: doc.id,
    // Convert Firestore Timestamp to a serializable format (ISO string) so it can be
    // passed from Server to Client Components.
    date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
    reviewProgress,
    statusText: (data.reviewCount || 0) >= targetReviews ? 'Completed' : `${data.reviewCount || 0}/${targetReviews}`,
  } as DisplayEntry;
}

export async function fetchDpoEntriesCount(countQuery: Query) {
  const countSnapshot = await getCountFromServer(countQuery);
  return countSnapshot.data().count;
}

export async function fetchDpoEntriesData(mainQuery: Query, targetReviews: number) {
  const querySnapshot = await getDocs(mainQuery);
  const entries = querySnapshot.docs.map((doc) => transformDpoEntry(doc, targetReviews));
  return {
    entries,
    cursors: {
      first: querySnapshot.docs[0] || null,
      last: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
    },
  };
}

export async function getDashboardData() {
  if (!db) {
    console.error('Firebase is not initialized.');
    // Return a default or empty state
    return getMockDashboardData();
  }

  try {
    const overviewStatsRef = doc(db, 'cached_statistics', 'overview_stats');
    const overviewStatsSnap = await getDoc(overviewStatsRef);

    if (!overviewStatsSnap.exists()) {
      console.warn('Overview stats document not found.');
      return {
        totalEntries: 0,
        totalReviews: 0,
        averageReviews: 0,
        completionPercentage: 0,
      };
    }

    const stats = overviewStatsSnap.data() as OverviewStats;

    const totalEntries = stats.totalEntriesInDataset || 0;
    const totalReviews = stats.totalEvaluationsSubmitted || 0;
    const fullyReviewed = stats.fullyReviewedEntriesCount || 0;

    const averageReviews = totalEntries > 0 ? totalReviews / totalEntries : 0;
    const completionPercentage = totalEntries > 0 ? (fullyReviewed / totalEntries) * 100 : 0;

    return {
      totalEntries,
      totalReviews,
      averageReviews,
      completionPercentage,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return a default or empty state in case of error
    return {
      totalEntries: 0,
      totalReviews: 0,
      averageReviews: 0,
      completionPercentage: 0,
    };
  }
}

export async function getStatisticsData() {
  if (!db) {
    console.error('Firebase is not initialized.');
    return getMockStatisticsData();
  }

  try {
    const overviewRef = doc(db, 'stats_overview', 'global_stats');
    const responsesRef = doc(db, 'stats_responses', 'global_stats');
    const demographicsRef = doc(db, 'stats_demographics', 'global_stats');

    const [overviewSnap, responsesSnap, demographicsSnap] = await Promise.all([
      getDoc(overviewRef),
      getDoc(responsesRef),
      getDoc(demographicsRef),
    ]);

    const overviewStats = overviewSnap.exists() ? (overviewSnap.data() as OverviewStats) : null;
    const responseAggregates = responsesSnap.exists() ? (responsesSnap.data() as ResponseAggregates) : null;
    const demographicsSummary = demographicsSnap.exists() ? (demographicsSnap.data() as DemographicsSummary) : null;

    return {
      overviewStats,
      responseAggregates,
      demographicsSummary,
    };
  } catch (error) {
    console.error('Error fetching statistics data:', error);
    return {
      demographicsSummary: null,
      overviewStats: null,
      responseAggregates: null,
    };
  }
}
