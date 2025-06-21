// src/lib/firestore/mocks/admin.ts
import type { GetDpoEntryResult } from '@/lib/firestore/queries/admin';
import { HARM_CATEGORIES } from '@/lib/harm-categories';
import type { DPOEntry, EvaluationData, ParticipantFlag } from '@/types/dpo';
import type { DisplayEntry } from '@/types/entries';
import type { DemographicsSummary, OverviewStats, ResponseAggregates } from '@/types/stats';
import { Timestamp } from 'firebase/firestore';

export function getMockDpoEntries(count: number = 10): DisplayEntry[] {
  return Array.from({ length: count }).map((_, i) => {
    const id = `mockEntry${i + 1}-${Math.random().toString(36).substring(2, 6)}`;
    const reviewCount = Math.floor(Math.random() * 10);
    const targetReviewCount = 10;
    const reviewProgress = Math.min(100, Math.round((reviewCount / targetReviewCount) * 100));
    return {
      id,
      instruction: `Mock instruction for entry ${i + 1}`,
      prompt: `Mock prompt for entry ${i + 1}`,
      acceptedResponse: `Mock accepted response for entry ${i + 1}`,
      rejectedResponse: `Mock rejected response for entry ${i + 1}`,
      categories: [
        HARM_CATEGORIES[i % HARM_CATEGORIES.length].id,
        HARM_CATEGORIES[(i + 1) % HARM_CATEGORIES.length].id,
      ],
      discussion: `Mock discussion for entry ${i + 1}`,
      reviewCount,
      targetReviewCount,
      reviewProgress,
      statusText: reviewCount >= targetReviewCount ? 'Completed' : `${reviewCount}/${targetReviewCount}`,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      isFlaggedCount: Math.floor(Math.random() * 3),
      isArchived: false,
    };
  });
}

export function getMockDpoEntryDetails(entryId: string): GetDpoEntryResult {
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const entry: DPOEntry = {
    id: entryId,
    instruction: 'Click the button to continue with your purchase',
    prompt: 'Generate a dark pattern for an e-commerce checkout flow',
    acceptedResponse: 'Continue to secure checkout',
    rejectedResponse: 'Warning: You may lose your cart items',
    categories: ['Urgency'],
    discussion: 'This pattern creates false urgency by implying potential loss.',
    reviewCount: randomInt(5, 15),
    targetReviewCount: 10,
    lastReviewedAt: lastWeek,
    createdAt: lastWeek,
    date: lastWeek,
    isFlaggedCount: randomInt(0, 3),
    lastFlaggedAt: now,
    isArchived: false,
  };

  const evaluations: EvaluationData[] = [
    {
      id: 'eval1',
      dpoEntryId: entryId,
      participantSessionUid: 'participant1',
      rating: 4,
      comment: 'Strong example of dark pattern usage',
      submittedAt: lastWeek,
      chosenOptionKey: 'A',
      wasChosenActuallyAccepted: true,
      categories: entry.categories,
      timeSpentMs: randomInt(10000, 60000),
    },
    {
      id: 'eval2',
      dpoEntryId: entryId,
      participantSessionUid: 'participant2',
      rating: 5,
      comment: 'Clear manipulation of user behavior',
      submittedAt: now,
      chosenOptionKey: 'B',
      wasChosenActuallyAccepted: false,
      timeSpentMs: randomInt(10000, 60000),
      categories: entry.categories,
    },
  ];

  const flags: ParticipantFlag[] = Array.from({ length: randomInt(0, 2) }).map((_, i) => ({
    id: `flag${i}`,
    dpoEntryId: entryId,
    participantSessionUid: `participant${randomInt(1, 5)}`,
    reason: 'This is a mock flag reason.',
    flaggedAt: now,
    categories: entry.categories,
  }));

  return {
    entry,
    evaluations,
    flags,
  };
}

export function getMockStatisticsData(): {
  demographicsSummary: DemographicsSummary;
  overviewStats: OverviewStats;
  responseAggregates: ResponseAggregates;
} {
  const now = new Date();
  const nowTimestamp = Timestamp.fromDate(now);

  const demographicsSummary: DemographicsSummary = {
    ageGroupDistribution: {
      '18-24': 120,
      '25-34': 250,
      '35-44': 180,
      '45-54': 90,
      '55+': 40,
    },
    genderDistribution: {
      Male: 350,
      Female: 310,
      'Non-binary': 15,
      'Prefer not to say': 5,
    },
    educationDistribution: {
      'High School': 50,
      Bachelors: 400,
      Masters: 200,
      PhD: 30,
    },
    expertiseDistribution: {
      'Software Engineering': 150,
      'UX/UI Design': 120,
      'Data Science': 80,
      'Product Management': 70,
      Other: 260,
    },
    aiFamiliarityDistribution: {
      'Not familiar': 20,
      'Slightly familiar': 150,
      'Moderately familiar': 300,
      'Very familiar': 210,
    },
    totalParticipantsWithDemographics: 680,
    lastUpdatedAt: nowTimestamp,
  };

  const overviewStats: OverviewStats = {
    totalEntriesInDataset: 1250,
    totalEvaluationsSubmitted: 8500,
    fullyReviewedEntriesCount: 850,
    usersWithEmailAddressCount: 450,
    averageTimePerEvaluationMs: 35000,
    evaluationsCountForAvgTime: 8500,
    participantFlagCount: 120,
    totalAgreementCount: 6800,
    agreementRate: (6800 / 8500) * 100, // 80%
    lastEvaluationAt: nowTimestamp,
    lastUpdatedAt: nowTimestamp,
  };

  const responseAggregates: ResponseAggregates = {
    ratingDistribution: {
      '1_star': 500,
      '2_star': 800,
      '3_star': 2000,
      '4_star': 3200,
      '5_star': 2000,
    },
    commentSubmissions: 4000,
    commentSubmissionRatePercent: (4000 / 8500) * 100, // ~47%
    lastUpdatedAt: nowTimestamp,
  };

  return { demographicsSummary, overviewStats, responseAggregates };
}

export function getMockDashboardData() {
  return {
    totalEntries: 125,
    totalReviews: 850,
    averageReviews: 6.8,
    completionPercentage: 75,
  };
}
