import { submitFlagForEntry as submitFlag } from '@/lib/firestore/mutations/survey';
import type { DPOEntry } from '@/types/dpo';

export async function submitFlagForEntry({
  currentDisplayEntry,
  participantSessionUid,
  reason,
  comment,
  onSuccess,
  onError,
  onFinally,
}: {
  currentDisplayEntry: DPOEntry | null;
  participantSessionUid: string;
  reason: string;
  comment: string;
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
  onFinally?: () => void;
}) {
  if (
    !currentDisplayEntry ||
    !currentDisplayEntry.id ||
    !participantSessionUid ||
    !currentDisplayEntry.categories ||
    currentDisplayEntry.categories.length === 0
  ) {
    alert('Cannot submit flag: missing entry data, session information, or category.');
    onFinally?.();
    return;
  }

  try {
    await submitFlag({
      dpoEntryId: currentDisplayEntry.id,
      dpoEntryCategory: currentDisplayEntry.categories[0], // Use the first category
      participantSessionUid,
      reason,
      comment,
    });
    alert('Entry flagged successfully. Thank you for your feedback.');
    onSuccess?.();
  } catch (err) {
    console.error('Error submitting flag:', err);
    alert(`Failed to submit flag. Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    onError?.(err);
  } finally {
    onFinally?.();
  }
}
