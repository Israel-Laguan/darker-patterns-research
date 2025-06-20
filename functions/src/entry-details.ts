import type { DPOEntry, EvaluationData, ParticipantFlag, EntryWithDetails } from './types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Converts a Firestore Timestamp to a JavaScript Date object.
 * If the field is not a Timestamp, it returns the field unchanged.
 * @param {unknown} field The field to convert.
 * @return {Date | unknown} The converted Date object or the original field.
 */
function convertTimestamp(field: unknown): Date | unknown {
  if (field instanceof Timestamp) {
    return field.toDate();
  }
  return field;
}

/**
 * Processes a DPO entry and its associated evaluations and flags to create a detailed object.
 * This object includes calculated analytics and formatted data suitable for display.
 * @param {DPOEntry} entry The DPO entry to process.
 * @param {EvaluationData[]} evaluations An array of evaluations for the entry.
 * @param {ParticipantFlag[]} flags An array of flags for the entry.
 * @return {EntryWithDetails} A detailed entry object with analytics.
 */
export function processEntryDetails(
  entry: DPOEntry,
  evaluations: EvaluationData[],
  flags: ParticipantFlag[],
): EntryWithDetails {
  const processedEntry = Object.fromEntries(
    Object.entries(entry).map(([key, value]) => [key, convertTimestamp(value)]),
  );

  const totalEvaluations = evaluations.length;
  const correctEvaluations = evaluations.filter((e) => e.wasChosenActuallyAccepted).length;
  const ratingDistribution = evaluations.reduce(
    (acc, e) => {
      acc[e.rating] = (acc[e.rating] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );
  const totalRating = evaluations.reduce((acc, e) => acc + e.rating, 0);
  const averageRating = totalEvaluations > 0 ? totalRating / totalEvaluations : 0;

  const categoryDistribution = evaluations.reduce(
    (acc, e) => {
      if (e.categories) {
        e.categories.forEach((category: string) => {
          acc[category] = (acc[category] || 0) + 1;
        });
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const result = {
    ...(processedEntry as unknown as DPOEntry),
    analytics: {
      views: entry.viewCount || 1,
      flags: flags.length,
      totalEvaluations,
      correctness: totalEvaluations > 0 ? (correctEvaluations / totalEvaluations) * 100 : 0,
      averageRating,
      ratingDistribution,
      categoryDistribution,
    },
    evaluations: evaluations
      .filter((e): e is typeof e & { id: string } => !!e.id)
      .map((e) => ({
        id: e.id,
        rating: e.rating,
        comment: e.comment,
        categories: e.categories,
        submittedAt: convertTimestamp(e.submittedAt),
        chosenOptionKey: e.chosenOptionKey,
        wasChosenActuallyAccepted: e.wasChosenActuallyAccepted,
      })),
  };

  return result as EntryWithDetails;
}
