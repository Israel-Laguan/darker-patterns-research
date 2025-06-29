import type { LandingUpdate } from '@/components/landing/types';
import { db } from '@/lib/firebase';
import type { LandingStats, ResponseAggregates } from '@/types/stats';
import { doc, getDoc } from 'firebase/firestore';
import { cachedGetGlobalConfig } from '@/lib/cache/queries';

// Mock data for test environment or if Firestore fetch fails
const mockStatsData: LandingStats = {
  totalEvaluationsSubmitted: 8500,
  agreementRate: 92,
  totalAgreementCount: 3,
  usersWithEmailAddressCount: 1,
  fullyReviewedEntriesCount: 1,
  lastUpdatedAt: { seconds: Math.floor(Date.now() / 1000) - 3600, nanoseconds: 0 },
};

const mockUpdatesData: LandingUpdate[] = [
  {
    id: 'mock-update-1',
    title: 'Test Mode: Project Kickoff!',
    date: new Date(Date.now() - 86400 * 7 * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    description: 'This is a mock update for test environment. The DPV project has officially started.',
    iconName: 'Milestone',
  },
  {
    id: 'mock-update-2',
    title: 'Test Mode: Alpha Version Released',
    date: new Date(Date.now() - 86400 * 2 * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    description: 'Alpha version is now available for internal testing. Features include X, Y, Z.',
    iconName: 'Newspaper',
  },
];

export async function getCachedStats(): Promise<LandingStats | null> {
  if (!db) {
    console.warn('StatsSection: DB not available, returning mock stats.');
    return mockStatsData;
  }
  try {
    const statsDocRef = doc(db, 'cached_statistics', 'overview_stats');
    const docSnap = await getDoc(statsDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as LandingStats;
    }
    console.warn('StatsSection: No cached_stats/overview_stats document found! Returning mock data.');
    return mockStatsData;
  } catch (error) {
    console.error('StatsSection: Error fetching cached stats:', error);
    return mockStatsData;
  }
}

export async function getProjectProgress(): Promise<{ label: string; percentage: number; colorClass: string }[]> {
  const colorClasses = ['bg-brand-purple-500', 'bg-accent-cyan', 'bg-accent-pink'];
  const mockProgressData = [
    { label: 'Overall Dataset Annotation', percentage: 45, colorClass: colorClasses[0] },
    { label: 'Entries without Unresolved Flags', percentage: 95, colorClass: colorClasses[1] },
    { label: 'Min. 10 Reviews per Entry Target', percentage: 60, colorClass: colorClasses[2] },
  ];

  if (!db) {
    console.warn('getProjectProgress: DB not available, returning mock progress.');
    return mockProgressData;
  }

  try {
    const statsDocRef = doc(db, 'cached_statistics', 'response_aggregates');
    const docSnap = await getDoc(statsDocRef);

    if (docSnap.exists()) {
      const stats = docSnap.data() as ResponseAggregates;
      const overallAnnotationPercent = stats.overallAnnotationPercent ?? 0;
      const min10ReviewsPercent = stats.min10ReviewsPercent ?? 0;
      const unresolvedFlagsPercent = stats.unresolvedFlagsPercent ?? 0;
      // The metric is for "without unresolved flags" which means resolved.
      const resolvedFlagsPercent = 100 - unresolvedFlagsPercent;

      return [
        { label: 'Overall Dataset Annotation', percentage: overallAnnotationPercent, colorClass: colorClasses[0] },
        { label: 'Entries without Unresolved Flags', percentage: resolvedFlagsPercent, colorClass: colorClasses[1] },
        { label: 'Min. 10 Reviews per Entry Target', percentage: min10ReviewsPercent, colorClass: colorClasses[2] },
      ];
    }

    console.warn('getProjectProgress: No cached_statistics/response_aggregates document found! Returning mock data.');
    return mockProgressData;
  } catch (error) {
    console.error('getProjectProgress: Error fetching project progress stats:', error);
    return mockProgressData;
  }
}

export async function getLandingUpdates(): Promise<LandingUpdate[]> {
  try {
    const config = await cachedGetGlobalConfig();
    const landingUpdates: LandingUpdate[] = config.updates.map((update, index) => ({
      id: `update-${index}`,
      title: update.title,
      description: update.description,
      date: update.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      iconName: 'Newspaper', // Default icon
    }));

    return landingUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('UpdatesSection: Error fetching landing updates:', error);
    // Fallback to mock data in case of an error
    return mockUpdatesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
