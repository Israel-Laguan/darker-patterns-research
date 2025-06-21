import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import type { DPOEntry, OverviewStats, ResponseAggregates } from '../types';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

export const onDpoEntryWrite = onDocumentWritten('dpo_entries/{entryId}', async (event) => {
  const beforeData = event.data?.before.data() as DPOEntry | undefined;
  const afterData = event.data?.after.data() as DPOEntry | undefined;

  const overviewStatsRef = db.doc('cached_statistics/overview_stats');
  const responseAggregatesRef = db.doc('cached_statistics/response_aggregates');

  return db.runTransaction(async (transaction) => {
    const overviewStatsDoc = await transaction.get(overviewStatsRef);
    const overviewStats = overviewStatsDoc.data() as OverviewStats;

    let totalEntriesInDataset = overviewStats.totalEntriesInDataset || 0;
    let totalAnnotatedEntries = overviewStats.totalAnnotatedEntries || 0;
    let fullyReviewedEntriesCount = overviewStats.fullyReviewedEntriesCount || 0;
    let totalEntriesWithUnresolvedFlags = overviewStats.totalEntriesWithUnresolvedFlags || 0;

    // Entry created
    if (!beforeData && afterData) {
      totalEntriesInDataset++;
    }

    // Entry deleted
    if (beforeData && !afterData) {
      totalEntriesInDataset--;
      if (beforeData.reviewCount > 0) {
        totalAnnotatedEntries--;
      }
      if (beforeData.reviewCount >= 10) {
        fullyReviewedEntriesCount--;
      }
      if ((beforeData.isFlaggedCount ?? 0) > 0) {
        totalEntriesWithUnresolvedFlags--;
      }
    }

    // Entry updated
    if (beforeData && afterData) {
      // Annotated status changed
      if (beforeData.reviewCount === 0 && afterData.reviewCount > 0) {
        totalAnnotatedEntries++;
      } else if (beforeData.reviewCount > 0 && afterData.reviewCount === 0) {
        totalAnnotatedEntries--;
      }

      // Fully reviewed status changed
      if (beforeData.reviewCount < 10 && afterData.reviewCount >= 10) {
        fullyReviewedEntriesCount++;
      } else if (beforeData.reviewCount >= 10 && afterData.reviewCount < 10) {
        fullyReviewedEntriesCount--;
      }

      // Unresolved flags status changed
      if ((beforeData.isFlaggedCount ?? 0) === 0 && (afterData.isFlaggedCount ?? 0) > 0) {
        totalEntriesWithUnresolvedFlags++;
      } else if ((beforeData.isFlaggedCount ?? 0) > 0 && (afterData.isFlaggedCount ?? 0) === 0) {
        totalEntriesWithUnresolvedFlags--;
      }
    }

    const newOverviewStats: Partial<OverviewStats> = {
      totalEntriesInDataset,
      totalAnnotatedEntries,
      fullyReviewedEntriesCount,
      totalEntriesWithUnresolvedFlags,
      lastUpdatedAt: FieldValue.serverTimestamp() as any,
    };

    const overallAnnotationPercent =
      totalEntriesInDataset > 0 ? Math.round((totalAnnotatedEntries / totalEntriesInDataset) * 100) : 0;
    const min10ReviewsPercent =
      totalEntriesInDataset > 0 ? Math.round((fullyReviewedEntriesCount / totalEntriesInDataset) * 100) : 0;
    const unresolvedFlagsPercent =
      totalEntriesInDataset > 0 ? Math.round((totalEntriesWithUnresolvedFlags / totalEntriesInDataset) * 100) : 0;

    const newResponseAggregates: Partial<ResponseAggregates> = {
      overallAnnotationPercent,
      min10ReviewsPercent,
      unresolvedFlagsPercent,
      lastUpdatedAt: FieldValue.serverTimestamp() as any,
    };

    transaction.update(overviewStatsRef, newOverviewStats);
    transaction.update(responseAggregatesRef, newResponseAggregates);
  });
});
