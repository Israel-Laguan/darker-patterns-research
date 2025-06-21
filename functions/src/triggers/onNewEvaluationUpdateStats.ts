import * as admin from 'firebase-admin';
import type { Timestamp as FirebaseAdminTimestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import type { AdminSettingsData, DPOEntry, EvaluationData, ResponseAggregates } from '../types';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Updates overview statistics in response to a new evaluation being created.
 * This includes metrics like total evaluations, average time, agreement rate, etc.
 */
export const onNewEvaluationUpdateStats = onDocumentCreated('evaluations/{evaluationId}', async (event) => {
  const snap = event.data;
  const context = { params: event.params };
  const evaluationData = snap?.data() as EvaluationData | undefined;
  if (!evaluationData) {
    functions.logger.error('No data in new evaluation snapshot.', {
      evaluationId: context.params.evaluationId,
    });
    return null;
  }

  const overviewStatsRef = db.doc('cached_statistics/overview_stats');
  const dpoEntryRef = db.doc(`dpo_entries/${evaluationData.dpoEntryId}`);
  const adminSettingsRef = db.doc('admin_settings/global_config');
  const responseAggregatesRef = db.doc('cached_statistics/response_aggregates');

  try {
    return await db.runTransaction(async (transaction) => {
      const overviewStatsDoc = await transaction.get(overviewStatsRef);
      const dpoEntryDoc = await transaction.get(dpoEntryRef);
      const adminSettingsDoc = await transaction.get(adminSettingsRef);
      const responseAggregatesDoc = await transaction.get(responseAggregatesRef);

      const currentOverviewStats = overviewStatsDoc.data() || {};
      const currentResponseAggregates = responseAggregatesDoc.data() || {};

      const totalEvals = (currentOverviewStats.totalEvaluationsSubmitted || 0) + 1;
      let currentAvgTime = currentOverviewStats.averageTimePerEvaluationMs || 0;
      let evalCountForAvg = currentOverviewStats.evaluationsCountForAvg || 0;
      let currentFullyReviewedCount = currentOverviewStats.fullyReviewedEntriesCount || 0;
      let totalAgreementCount = currentOverviewStats.totalAgreementCount || 0;

      const newTimeSpent = evaluationData.timeSpentMs || 0;
      currentAvgTime = (currentAvgTime * evalCountForAvg + newTimeSpent) / (evalCountForAvg + 1);
      evalCountForAvg += 1;

      if (dpoEntryDoc.exists) {
        const entryData = dpoEntryDoc.data() as DPOEntry | undefined;
        const adminSettings = adminSettingsDoc.data() as AdminSettingsData | undefined;
        const actualReviewCount = (entryData?.reviewCount || 0) + 1;
        const targetReviews = adminSettings?.minTargetReviewsPerEntry || 10;

        if (
          actualReviewCount === targetReviews &&
          (entryData?.previousReviewCountForFullyReviewedCheck || 0) < targetReviews
        ) {
          currentFullyReviewedCount = (currentFullyReviewedCount < 0 ? 0 : currentFullyReviewedCount) + 1;
          transaction.update(dpoEntryRef, { previousReviewCountForFullyReviewedCheck: targetReviews });
        } else if (
          actualReviewCount > targetReviews &&
          (entryData?.previousReviewCountForFullyReviewedCheck || 0) < targetReviews
        ) {
          currentFullyReviewedCount = (currentFullyReviewedCount < 0 ? 0 : currentFullyReviewedCount) + 1;
          transaction.update(dpoEntryRef, { previousReviewCountForFullyReviewedCheck: targetReviews });
        }
      } else {
        functions.logger.warn(`DPO entry ${evaluationData.dpoEntryId} not found while updating stats.`, {
          evaluationId: context.params.evaluationId,
        });
      }

      if (evaluationData.wasChosenActuallyAccepted) {
        totalAgreementCount += 1;
      }
      const newAgreementRate = totalEvals > 0 ? (totalAgreementCount / totalEvals) * 100 : 0;

      transaction.set(
        overviewStatsRef,
        {
          totalEvaluationsSubmitted: totalEvals,
          averageTimePerEvaluationMs: parseFloat(currentAvgTime.toFixed(1)),
          evaluationsCountForAvg: evalCountForAvg,
          fullyReviewedEntriesCount: currentFullyReviewedCount,
          totalAgreementCount: totalAgreementCount,
          agreementRate: parseFloat(newAgreementRate.toFixed(1)),
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
        },
        { merge: true },
      );

      const newRatingDistribution = currentResponseAggregates.ratingDistribution || {};
      newRatingDistribution[evaluationData.rating] = (newRatingDistribution[evaluationData.rating] || 0) + 1;
      let commentSubmissions = currentResponseAggregates.commentSubmissions || 0;
      if (evaluationData.comment && evaluationData.comment.trim() !== '') {
        commentSubmissions += 1;
      }
      const newCommentRate = totalEvals > 0 ? (commentSubmissions / totalEvals) * 100 : 0;

      transaction.set(
        responseAggregatesRef,
        {
          ratingDistribution: newRatingDistribution,
          commentSubmissions: commentSubmissions,
          commentSubmissionRatePercent: parseFloat(newCommentRate.toFixed(1)),

          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
        } as ResponseAggregates,
        { merge: true },
      );

      return null;
    });
  } catch (error) {
    functions.logger.error('Transaction failure onNewEvaluationUpdateStats:', error, {
      evaluationId: context.params.evaluationId,
    });
    return null;
  }
});
