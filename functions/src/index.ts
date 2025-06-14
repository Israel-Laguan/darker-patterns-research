import * as admin from 'firebase-admin';
import type { Timestamp as FirebaseAdminTimestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as functions from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import type {
  ActivityLogItemFc,
  AdminSettingsData,
  DemographicData,
  DPOEntry,
  EvaluationData,
  ParticipantFlag,
  ParticipantSession,
} from './types';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- Function to update overview_stats on new evaluation ---
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

      let totalEvals = (currentOverviewStats.totalEvaluationsSubmitted || 0) + 1;
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
          fullyReviewedEntriesCount: currentFullyReviewedCount,
          averageTimePerEvaluationMs: Math.round(currentAvgTime),
          evaluationsCountForAvg: evalCountForAvg,
          totalAgreementCount: totalAgreementCount,
          agreementRate: parseFloat(newAgreementRate.toFixed(1)),
          lastEvaluationAt: evaluationData.submittedAt || admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
        },
        { merge: true },
      );

      const ratingKey = `${evaluationData.rating}_star` as keyof NonNullable<
        typeof currentResponseAggregates.ratingDistribution
      >;
      const newRatingDistribution = {
        ...(currentResponseAggregates.ratingDistribution || {}),
        [ratingKey]: (currentResponseAggregates.ratingDistribution?.[ratingKey] || 0) + 1,
      };

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
        },
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

const updateIncrement = (obj: Record<string, number> | undefined, key: string): Record<string, number> => {
  const currentObj = obj || {};
  return {
    ...currentObj,
    [key]: (currentObj[key] || 0) + 1,
  };
};

export const onNewParticipantUpdateDemographics = onDocumentCreated(
  'survey_participants/{participantId}',
  async (event) => {
    const snap = event.data;
    const context = { params: event.params };
    const participantData = snap?.data() as ParticipantSession | undefined;
    const demographics = participantData?.demographics as DemographicData | undefined;

    if (!demographics || Object.keys(demographics).length === 0) {
      functions.logger.info('No demographics data to update for participant.', {
        participantId: context.params.participantId,
      });
      return null;
    }
    const summaryRef = db.doc('cached_statistics/demographics_summary');

    try {
      return await db.runTransaction(async (transaction) => {
        const summaryDoc = await transaction.get(summaryRef);
        const currentSummary = summaryDoc.data() || {};

        const newSummaryData: any = {
          totalParticipantsWithDemographics: (currentSummary.totalParticipantsWithDemographics || 0) + 1,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
        };

        if (demographics.ageGroup)
          newSummaryData.ageGroupDistribution = updateIncrement(
            currentSummary.ageGroupDistribution,
            demographics.ageGroup,
          );
        if (demographics.gender)
          newSummaryData.genderDistribution = updateIncrement(currentSummary.genderDistribution, demographics.gender);
        if (demographics.educationLevel)
          newSummaryData.educationDistribution = updateIncrement(
            currentSummary.educationDistribution,
            demographics.educationLevel,
          );
        if (demographics.fieldOfExpertise)
          newSummaryData.expertiseDistribution = updateIncrement(
            currentSummary.expertiseDistribution,
            demographics.fieldOfExpertise,
          );
        if (demographics.aiFamiliarity)
          newSummaryData.aiFamiliarityDistribution = updateIncrement(
            currentSummary.aiFamiliarityDistribution,
            demographics.aiFamiliarity,
          );

        transaction.set(summaryRef, newSummaryData, { merge: true });
        return null;
      });
    } catch (error) {
      functions.logger.error('Transaction failure onNewParticipantUpdateDemographics:', error, {
        participantId: context.params.participantId,
      });
      return null;
    }
  },
);

export const onParticipantEmailUpdate = onDocumentWritten('survey_participants/{participantId}', async (event) => {
  if (!event.data) return null;
  const beforeData = event.data.before?.data() as ParticipantSession | undefined;
  const afterData = event.data.after?.data() as ParticipantSession | undefined;
  const context = { params: event.params };
  const overviewStatsRef = db.doc('cached_statistics/overview_stats');

  const emailExistsBefore = !!beforeData?.email?.trim() && !!beforeData?.optedInForPaper;
  const emailExistsAfter = !!afterData?.email?.trim() && !!afterData?.optedInForPaper;

  if (emailExistsBefore === emailExistsAfter) return null; // No change in opted-in email status

  try {
    return await db.runTransaction(async (transaction) => {
      const overviewStatsDoc = await transaction.get(overviewStatsRef);
      let count = overviewStatsDoc.data()?.usersWithEmailAddressCount || 0;
      if (emailExistsAfter && !emailExistsBefore) {
        count++;
      } else if (!emailExistsAfter && emailExistsBefore) {
        count = Math.max(0, count - 1);
      }
      transaction.set(
        overviewStatsRef,
        {
          usersWithEmailAddressCount: count,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
        },
        { merge: true },
      );
      return null;
    });
  } catch (error) {
    functions.logger.error('Transaction failure onParticipantEmailUpdate:', error, {
      participantId: context.params.participantId,
    });
    return null;
  }
});

export const logNewEvaluationActivity = onDocumentCreated('evaluations/{evaluationId}', async (event) => {
  const snap = event.data;
  const context = { params: event.params };
  const evalData = snap?.data() as EvaluationData | undefined;
  if (!evalData) {
    functions.logger.error('No data in new evaluation snapshot for activity log.', {
      evaluationId: context.params.evaluationId,
    });
    return null;
  }
  const activityLogRef = db.collection('activity_log').doc();
  const displayText = `Evaluation for entry ${evalData.dpoEntryId.substring(0, 6)}... by PUID ${evalData.participantSessionUid.substring(0, 6)}...`;
  const iconName = 'CheckSquare';
  try {
    await activityLogRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
      eventType: 'evaluation_submitted',
      participantSessionUid: evalData.participantSessionUid,
      dpoEntryId: evalData.dpoEntryId,
      details: {
        rating: evalData.rating,
        chosenOptionKey: evalData.chosenOptionKey,
        wasResearcherAgreement: evalData.wasChosenActuallyAccepted,
      },
      displayText: displayText,
      iconName: iconName,
      actionLink: `/admin/entries/${evalData.dpoEntryId}`,
      actionText: 'View Entry',
    } as ActivityLogItemFc);
    functions.logger.info('Activity logged: evaluation_submitted', {
      evaluationId: context.params.evaluationId,
    });
    return null;
  } catch (error) {
    functions.logger.error('Error logging new evaluation activity:', error, {
      evaluationId: context.params.evaluationId,
    });
    return null;
  }
});

export const logNewParticipantSessionActivity = onDocumentCreated(
  'survey_participants/{participantId}',
  async (event) => {
    const snap = event.data;
    const context = { params: event.params };
    const participantData = snap?.data() as ParticipantSession | undefined;
    if (!participantData) {
      functions.logger.error('No data in new participant session snapshot for activity log.', {
        participantId: context.params.participantId,
      });
      return null;
    }
    const activityLogRef = db.collection('activity_log').doc();
    const displayText = `New participant PUID ${context.params.participantId.substring(0, 6)}... started (${participantData.participationType}).`;
    const iconName = 'UserPlus';
    try {
      await activityLogRef.set({
        timestamp: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
        eventType: 'participant_session_started',
        participantSessionUid: context.params.participantId,
        details: {
          participationType: participantData.participationType,
          emailProvided: !!participantData.email,
        },
        displayText: displayText,
        iconName: iconName,
      } as ActivityLogItemFc);
      functions.logger.info('Activity logged: participant_session_started', {
        participantId: context.params.participantId,
      });
      return null;
    } catch (error) {
      functions.logger.error('Error logging new participant session:', error, {
        participantId: context.params.participantId,
      });
      return null;
    }
  },
);

export const logParticipantFlagActivity = onDocumentCreated(
  'dpo_entries/{entryId}/participant_flags/{flagId}',
  async (event) => {
    const snap = event.data;
    const context = { params: event.params };
    const flagData = snap?.data() as ParticipantFlag | undefined;
    if (!flagData) {
      functions.logger.error('No data in new flag snapshot for activity log.', {
        entryId: context.params.entryId,
        flagId: context.params.flagId,
      });
      return null;
    }
    const activityLogRef = db.collection('activity_log').doc();
    const displayText = `Entry ${context.params.entryId.substring(0, 6)}... flagged by PUID ${flagData.participantSessionUid.substring(0, 6)}... Reason: ${flagData.reason.substring(0, 30)}...`;
    const iconName = 'Flag';
    try {
      await activityLogRef.set({
        timestamp: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
        eventType: 'participant_flag_submitted',
        participantSessionUid: flagData.participantSessionUid,
        dpoEntryId: context.params.entryId,
        details: {
          reason: flagData.reason,
          commentProvided: !!flagData.comment,
        },
        displayText: displayText,
        iconName: iconName,
        actionLink: `/admin/entries/${context.params.entryId}`,
        actionText: 'Review Flag',
      } as ActivityLogItemFc);
      functions.logger.info('Activity logged: participant_flag_submitted', {
        entryId: context.params.entryId,
        flagId: context.params.flagId,
      });
      return null;
    } catch (error) {
      functions.logger.error('Error logging participant flag activity:', error, {
        entryId: context.params.entryId,
        flagId: context.params.flagId,
      });
      return null;
    }
  },
);

import type { CallableRequest } from 'firebase-functions/v2/https';
import { onCall } from 'firebase-functions/v2/https';

export const exportData = onCall({ region: 'us-central1' }, async (req: CallableRequest<any>) => {
  if (!req.auth || !(req.auth.token as any).admin) {
    functions.logger.warn('Unauthorized export attempt by UID:', req.auth?.uid);
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin to export data.');
  }
  const dataType = req.data.dataType;
  const bucket = getStorage().bucket(); // Default storage bucket
  const timestamp = Date.now();
  let fileContent = '';
  let fileName = '';
  let contentType = '';
  try {
    if (dataType === 'participantEmailsCSV') {
      fileName = `participant_emails_opted_in_${timestamp}.csv`;
      contentType = 'text/csv;charset=utf-8;';
      const participantsSnap = await db
        .collection('survey_participants')
        .where('email', '!=', null)
        .where('optedInForPaper', '==', true)
        .get();
      let csvHeader =
        'Email,OptedInForPaper,SessionUID,SubmittedAt,AgeGroup,Gender,EducationLevel,FieldOfExpertise,AIFamiliarity\n';
      let csvRows = participantsSnap.docs
        .map((docSnap) => {
          const pData = docSnap.data() as ParticipantSession;
          const demo = pData.demographics || {};
          const submittedAtDate =
            (pData.surveyCompletedAt as FirebaseAdminTimestamp)?.toDate() ||
            (pData.createdAt as FirebaseAdminTimestamp)?.toDate();
          const submittedAt = submittedAtDate ? submittedAtDate.toISOString() : 'N/A';
          return (
            `"${pData.email || ''}","${pData.optedInForPaper || false}","${docSnap.id}",` +
            `"${submittedAt}",` +
            `"${demo.ageGroup || ''}","${demo.gender || ''}","${demo.educationLevel || ''}",` +
            `"${demo.fieldOfExpertise || ''}","${demo.aiFamiliarity || ''}"`
          );
        })
        .join('\n');
      fileContent = csvHeader + csvRows;
    } else if (dataType === 'allResponsesJSON') {
      fileName = `all_evaluations_${timestamp}.json`;
      contentType = 'application/json;charset=utf-8;';
      const evaluationsSnap = await db.collection('evaluations').orderBy('submittedAt', 'asc').get();
      const evaluations = evaluationsSnap.docs.map((docSnap) => {
        const evalData = docSnap.data() as EvaluationData;
        const submittedAtDate = (evalData.submittedAt as FirebaseAdminTimestamp)?.toDate();
        const submittedAtISO = submittedAtDate ? submittedAtDate.toISOString() : null;
        return { id: docSnap.id, ...evalData, submittedAt: submittedAtISO };
      });
      fileContent = JSON.stringify(evaluations, null, 2);
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid dataType specified.');
    }
    const file = bucket.file(`admin_exports/${fileName}`);
    await file.save(Buffer.from(fileContent), { metadata: { contentType } });
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 });
    functions.logger.info(`Export generated: ${fileName}, URL: ${url.substring(0, 50)}...`, {
      uid: req.auth.uid,
      dataType,
    });
    return { downloadUrl: url };
  } catch (error: any) {
    functions.logger.error(`Error during export for dataType ${dataType}:`, error, { uid: req.auth?.uid });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to generate export file.');
  }
});
