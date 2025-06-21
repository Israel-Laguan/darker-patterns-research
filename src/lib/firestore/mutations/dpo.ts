import { db, functions } from '@/lib/firebase';
import type { DPOEntry, ParticipantFlag } from '@/types/dpo';
import { addDoc, collection, doc, increment, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export const addDPOEntry = async (entry: Omit<DPOEntry, 'id'>) => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const docRef = await addDoc(collection(db, 'dpoEntries'), {
      ...entry,
      createdAt: serverTimestamp(),
    });
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
    const entryRef = doc(db, 'dpoEntries', entryId);
    await updateDoc(entryRef, {
      ...entry,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating DPO entry: ', error);
    throw new Error('Failed to update DPO entry in the database.');
  }
};

export const reviseDpoEntry = async (originalEntryId: string, correctedData: Partial<DPOEntry>) => {
  if (!functions) {
    throw new Error('Firebase Functions is not initialized');
  }

  const reviseDpoEntryFn = httpsCallable<unknown, { success: boolean; newEntryId: string; message: string }>(
    functions,
    'reviseDpoEntry',
  );

  try {
    const result = await reviseDpoEntryFn({ originalEntryId, correctedData });
    return result.data;
  } catch (error) {
    console.error('Error revising DPO entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during revision.';
    return { success: false, newEntryId: '', message: errorMessage };
  }
};

export const flagDPOEntry = async (entryId: string, flagData: Omit<ParticipantFlag, 'id' | 'flaggedAt'>) => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const entryRef = doc(db, 'dpoEntries', entryId);
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
  if (!functions) {
    throw new Error('Firebase Functions is not initialized');
  }

  const deleteDpoEntryFn = httpsCallable<unknown, { success: boolean; message: string }>(functions, 'deleteDpoEntry');

  try {
    const result = await deleteDpoEntryFn({ entryId });
    return result.data;
  } catch (error) {
    console.error('Error deleting DPO entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during deletion.';
    return { success: false, message: errorMessage };
  }
};
