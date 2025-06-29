import { auth, db } from '@/lib/firebase';
import { serverCache } from '@/lib/cache/server';
import type { DPOEntry, DPORevision, ParticipantFlag } from '@/types/dpo';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

export const addDPOEntry = async (entry: Omit<DPOEntry, 'id'>) => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const overviewStatsRef = doc(db, 'cached_statistics', 'overview_stats');

  try {
    const docRef = await addDoc(collection(db, 'dpo_entries'), {
      ...entry,
      isArchived: false,
      createdAt: serverTimestamp(),
    });

    // Increment the total DPO entries count
    await updateDoc(overviewStatsRef, { totalDPOEntries: increment(1) });

    return docRef.id;
  } catch (error) {
    console.error('Error adding DPO entry: ', error);
    throw new Error('Failed to add DPO entry to the database.');
  }
};

export const updateDPOEntry = async (entryId: string, entry: Partial<DPOEntry>) => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const entryRef = doc(db, 'dpo_entries', entryId);
    await updateDoc(entryRef, {
      ...entry,
      updatedAt: serverTimestamp(),
    });

    // Invalidate both the main entry and the detailed entry caches
    await Promise.all([
      serverCache.invalidateByPattern(`dpo-entry-${entryId}`),
      serverCache.invalidateByPattern(`entry-details-${entryId}`),
    ]);
  } catch (error) {
    console.error('Error updating DPO entry: ', error);
    throw new Error('Failed to update DPO entry in the database.');
  }
};

export const reviseDpoEntry = async (
  originalEntryId: string,
  proposedChanges: Partial<DPOEntry>,
  submissionId?: string,
): Promise<{ success: boolean; revisionId?: string; message: string }> => {
  if (!db || !auth || !auth.currentUser) {
    return {
      success: false,
      message: 'You must be logged in to submit a revision.',
    };
  }

  const revisionData: Omit<DPORevision, 'id'> = {
    originalEntryId,
    ...(submissionId && { submissionId }),
    proposedChanges,
    submittedBy: auth.currentUser.uid,
    submittedAt: serverTimestamp(),
    status: 'pending',
  };

  try {
    const docRef = await addDoc(collection(db, 'dpo_revisions'), revisionData);
    return { success: true, revisionId: docRef.id, message: 'Revision submitted for review.' };
  } catch (error) {
    console.error('Error submitting DPO entry revision:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred during revision submission.';
    return { success: false, message: errorMessage };
  }
};

export const approveRevision = async (revisionId: string) => {
  if (!db || !auth || !auth.currentUser) {
    throw new Error('You must be logged in to approve a revision.');
  }
  const firestoreDb = db;
  const currentUser = auth.currentUser;

  const revisionRef = doc(firestoreDb, 'dpo_revisions', revisionId);

  try {
    // We need the original entry ID and potential submission ID after the transaction to invalidate caches.
    // We fetch them before the transaction to avoid an extra read if the transaction fails.
    const revisionDocBefore = await getDoc(revisionRef);
    if (!revisionDocBefore.exists()) {
      throw new Error('Revision not found.');
    }
    const revisionDataBefore = revisionDocBefore.data() as DPORevision;
    const { originalEntryId, submissionId } = revisionDataBefore;

    await runTransaction(firestoreDb, async (transaction) => {
      const revisionDoc = await transaction.get(revisionRef); // Re-get inside transaction
      if (!revisionDoc.exists() || revisionDoc.data().status !== 'pending') {
        throw new Error('Revision not found or already reviewed.');
      }

      const revisionData = revisionDoc.data() as DPORevision;
      const entryRef = doc(firestoreDb, 'dpo_entries', revisionData.originalEntryId);

      // 1. Update the original DPO entry with the proposed changes
      transaction.update(entryRef, {
        ...revisionData.proposedChanges,
        updatedAt: serverTimestamp(),
      });

      // 2. Update the revision status to 'approved'
      transaction.update(revisionRef, {
        status: 'approved',
        reviewedBy: currentUser.uid,
        reviewedAt: serverTimestamp(),
      });

      // 3. If a submission is linked, update its status to 'resolved'
      if (revisionData.submissionId) {
        const submissionRef = doc(firestoreDb, 'participant_flags', revisionData.submissionId);
        transaction.update(submissionRef, {
          status: 'resolved',
          remediatedBy: currentUser.uid,
          remediatedAt: serverTimestamp(),
        });
      }
    });

    // Invalidate all relevant caches after the transaction is successful
    const invalidationPromises = [
      serverCache.invalidateByPattern(`dpo-entry-${originalEntryId}`),
      serverCache.invalidateByPattern(`entry-details-${originalEntryId}`),
      serverCache.invalidateByPattern(`revision-${revisionId}`),
    ];

    if (submissionId) {
      invalidationPromises.push(serverCache.invalidateByPattern(`submission-${submissionId}`));
    }
    await Promise.all(invalidationPromises);

    return { success: true, message: 'Revision approved and entry updated.' };
  } catch (error) {
    console.error('Error approving revision:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: errorMessage };
  }
};

export const rejectRevision = async (revisionId: string, reviewComments: string) => {
  if (!db || !auth || !auth.currentUser) {
    throw new Error('You must be logged in to reject a revision.');
  }
  const firestoreDb = db;
  const currentUser = auth.currentUser;

  const revisionRef = doc(firestoreDb, 'dpo_revisions', revisionId);

  try {
    await updateDoc(revisionRef, {
      status: 'rejected',
      reviewedBy: currentUser.uid,
      reviewedAt: serverTimestamp(),
      reviewComments,
    });
    return { success: true, message: 'Revision has been rejected.' };
  } catch (error) {
    console.error('Error rejecting revision:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: errorMessage };
  }
};

export const flagDPOEntry = async (entryId: string, flagData: Omit<ParticipantFlag, 'id' | 'flaggedAt'>) => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const entryRef = doc(db, 'dpo_entries', entryId);
  const flagsCollectionRef = collection(db, 'participantFlags');

  try {
    await runTransaction(db, async (transaction) => {
      const entryDoc = await transaction.get(entryRef);
      if (!entryDoc.exists()) {
        throw new Error('DPO entry does not exist!');
      }

      // Update the DPO entry's flag count and timestamp
      transaction.update(entryRef, {
        isFlaggedCount: increment(1),
        lastFlaggedAt: serverTimestamp(),
      });

      // Create a new participant flag document for auditing
      const newFlagRef = doc(flagsCollectionRef);
      transaction.set(newFlagRef, {
        ...flagData,
        dpoEntryId: entryId, // Associate flag with the DPO entry
        flaggedAt: serverTimestamp(),
      });
    });

    return { success: true, message: 'Entry flagged successfully.' };
  } catch (error) {
    console.error('Error flagging DPO entry: ', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during flagging.';
    return { success: false, message: errorMessage };
  }
};

export const deleteDpoEntry = async (entryId: string): Promise<{ success: boolean; message: string }> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const entryRef = doc(db, 'dpo_entries', entryId);
  const overviewStatsRef = doc(db, 'cached_statistics', 'overview_stats');

  try {
    await runTransaction(db, async (transaction) => {
      const entryDoc = await transaction.get(entryRef);
      if (!entryDoc.exists() || entryDoc.data().isArchived) {
        // To prevent decrementing twice if the function is called on an already archived entry.
        return;
      }

      transaction.update(entryRef, {
        isArchived: true,
        archivedAt: serverTimestamp(),
      });

      // Decrement the total DPO entries count
      transaction.update(overviewStatsRef, { totalDPOEntries: increment(-1) });
    });

    return { success: true, message: 'Entry archived successfully.' };
  } catch (error) {
    console.error('Error archiving DPO entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during archival.';
    return { success: false, message: errorMessage };
  }
};
