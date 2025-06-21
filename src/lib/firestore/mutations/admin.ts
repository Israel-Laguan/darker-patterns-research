import { httpsCallable } from 'firebase/functions';
import { functions, db } from '@/lib/firebase';
import { GlobalConfig } from '../schemas';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export async function ingestDpoDataset(fileContent: string): Promise<{ success: boolean; message: string }> {
  if (!functions) {
    throw new Error('Firebase Functions is not initialized');
  }

  const ingestDpoDatasetFn = httpsCallable<unknown, { success: boolean; message: string }>(
    functions,
    'ingestDpoDataset',
  );

  try {
    const data = JSON.parse(fileContent);
    const result = await ingestDpoDatasetFn(data);
    return { success: result.data.success, message: result.data.message };
  } catch (error) {
    console.error('Error in ingestDpoDataset:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during ingestion.';
    return { success: false, message: errorMessage };
  }
}

export async function updateGlobalConfig(config: GlobalConfig<Date>): Promise<void> {
  if (!db) throw new Error('Firebase is not initialized');

  const configDocRef = doc(db, 'admin_settings', 'global_config');

  // Convert Date objects to Firestore Timestamps
  const dataToStore: GlobalConfig<Timestamp> = {
    ...config,
    updates: config.updates.map((update) => ({
      ...update,
      date: update.date instanceof Date ? Timestamp.fromDate(update.date) : Timestamp.now(),
    })),
  };

  await setDoc(configDocRef, dataToStore);
}
