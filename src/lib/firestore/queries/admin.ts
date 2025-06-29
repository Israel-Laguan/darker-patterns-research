/* eslint-disable max-lines */
// src/lib/firestore/queries/admin.ts
import type { AdminEntriesFilter, AdminEntriesSortConfig } from '@/hooks/useAdminEntries';
import type { AdminSubmissionsFilter, AdminSubmissionsSortConfig } from '@/hooks/useAdminSubmissions';

import { db } from '@/lib/firebase';
import { getMockDashboardData, getMockStatisticsData } from '@/lib/firestore/mocks/admin';
import { GlobalConfig } from '@/lib/firestore/schemas';
import type { DPOEntry, DPORevision, EvaluationData, ParticipantFlag } from '@/types/dpo';
import type { DisplayEntry } from '@/types/entries';
import type { DemographicsSummary, OverviewStats, ResponseAggregates } from '@/types/stats';
import type { DisplaySubmission } from '@/types/submissions';
import {
  collection,
  collectionGroup,
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

  const dpoEntriesRef = collectionGroup(db, 'dpo_entries');
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
    const sortField = sort.key === 'id' ? documentId() : sort.key;
    baseQuery = query(baseQuery, orderBy(sortField, sort.direction));
  }

  // Add documentId as a tie-breaker if not already the primary sort key.
  // This ensures consistent ordering for pagination.
  if (sort.key !== 'id') {
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

export async function getRevisionById(revisionId: string): Promise<DPORevision | null> {
  if (!db) throw new Error('Firebase is not initialized');

  const revisionRef = doc(db, 'dpo_revisions', revisionId);
  const revisionSnap = await getDoc(revisionRef);

  if (!revisionSnap.exists()) {
    return null;
  }

  return { id: revisionSnap.id, ...revisionSnap.data() } as DPORevision;
}

export async function getPendingRevisions(): Promise<DPORevision[]> {
  if (!db) throw new Error('Firebase is not initialized');

  const revisionsQuery = query(collection(db, 'dpo_revisions'), where('status', '==', 'pending'));

  const querySnapshot = await getDocs(revisionsQuery);
  const revisions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as DPORevision[];

  // Sort by date on the client-side to avoid composite index
  return revisions.sort((a, b) => {
    const getMillis = (ts: DPORevision['submittedAt']): number => {
      if (ts instanceof Timestamp) {
        return ts.toMillis();
      }
      if (ts instanceof Date) {
        return ts.getTime();
      }
      // FieldValue cannot be processed on the client, return a neutral value
      return 0;
    };
    return getMillis(b.submittedAt) - getMillis(a.submittedAt);
  });
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
    const overviewRef = doc(db, 'cached_statistics', 'overview_stats');
    const responsesRef = doc(db, 'cached_statistics', 'response_aggregates');
    const demographicsRef = doc(db, 'cached_statistics', 'demographics_summary');

    const [overviewSnap, responsesSnap, demographicsSnap] = await Promise.all([
      getDoc(overviewRef),
      getDoc(responsesRef),
      getDoc(demographicsRef),
    ]);

    const overviewStats = overviewSnap.exists() ? (overviewSnap.data() as OverviewStats) : null;
    const responseAggregates = responsesSnap.exists() ? (responsesSnap.data() as ResponseAggregates) : null;
    const demographicsSummary = demographicsSnap.exists() ? (demographicsSnap.data() as DemographicsSummary) : null;

    return {
      overviewStats: {
        ...overviewStats,
        lastEvaluationAt:
          overviewStats?.lastEvaluationAt instanceof Timestamp
            ? overviewStats.lastEvaluationAt.toDate()
            : overviewStats?.lastEvaluationAt,
        lastUpdatedAt:
          overviewStats?.lastUpdatedAt instanceof Timestamp
            ? overviewStats.lastUpdatedAt.toDate()
            : overviewStats?.lastUpdatedAt,
      },
      responseAggregates: {
        ...responseAggregates,
        lastUpdatedAt:
          responseAggregates?.lastUpdatedAt instanceof Timestamp
            ? responseAggregates.lastUpdatedAt.toDate()
            : responseAggregates?.lastUpdatedAt,
      },
      demographicsSummary: {
        ...demographicsSummary,
        lastUpdatedAt:
          demographicsSummary?.lastUpdatedAt instanceof Timestamp
            ? demographicsSummary.lastUpdatedAt.toDate()
            : demographicsSummary?.lastUpdatedAt,
      },
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

export function buildSubmissionsQuery(
  filters: AdminSubmissionsFilter,
  sort: AdminSubmissionsSortConfig,
  pageSize: number,
  pageDirection: 'next' | 'prev' | 'current',
  cursors: {
    first: QueryDocumentSnapshot | null;
    last: QueryDocumentSnapshot | null;
  },
) {
  if (!db) throw new Error('Firebase is not initialized');

  const submissionsRef = collection(db, 'participant_flags');
  let baseQuery: Query = query(submissionsRef);

  const filterConstraints = [];

  if (filters.status && filters.status.length > 0) {
    filterConstraints.push(where('status', 'in', filters.status.slice(0, 10)));
  }

  if (filters.reason && filters.reason.length > 0) {
    filterConstraints.push(where('reason', 'in', filters.reason.slice(0, 10)));
  }

  if (filters.searchTerm) {
    console.warn('Search term filtering is not yet implemented for submissions.');
  }

  if (filterConstraints.length > 0) {
    baseQuery = query(baseQuery, ...filterConstraints);
  }

  if (sort.key) {
    baseQuery = query(baseQuery, orderBy(sort.key, sort.direction), orderBy(documentId(), sort.direction));
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

export function transformSubmission(doc: QueryDocumentSnapshot): DisplaySubmission {
  const data = doc.data() as ParticipantFlag;

  return {
    ...data,
    id: doc.id,
    flaggedAt: (data.flaggedAt as Timestamp).toDate().toISOString(),
    remediatedAt: data.remediatedAt ? (data.remediatedAt as Timestamp).toDate().toISOString() : undefined,
  };
}

export async function getSubmissionById(submissionId: string): Promise<DisplaySubmission | null> {
  if (!db) {
    console.error('Firestore not initialized');
    return null;
  }
  const submissionDocRef = doc(db, 'participantFlags', submissionId);
  const submissionDoc = await getDoc(submissionDocRef);

  if (!submissionDoc.exists()) {
    return null;
  }

  return transformSubmission(submissionDoc);
}

export async function fetchSubmissionsCount(countQuery: Query) {
  const countSnapshot = await getCountFromServer(countQuery);
  return countSnapshot.data().count;
}

export async function fetchSubmissionsData(mainQuery: Query) {
  const submissionsSnapshot = await getDocs(mainQuery);
  const submissions = submissionsSnapshot.docs.map(transformSubmission);

  return {
    submissions,
    first: submissionsSnapshot.docs[0] ?? null,
    last: submissionsSnapshot.docs[submissionsSnapshot.docs.length - 1] ?? null,
  };
}
