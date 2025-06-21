import * as admin from 'firebase-admin';
import type { Timestamp as FirebaseAdminTimestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { ActivityLogItemFc } from '../types';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

export const deleteDpoEntry = onCall(async (request) => {
  // 1. Authentication/Authorization
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const auth = request.auth;

  const user = await admin.auth().getUser(auth.uid);
  if (user.customClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'The function must be called by an admin.');
  }

  const { entryId } = request.data;
  if (!entryId || typeof entryId !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with a valid "entryId".');
  }

  const entryRef = db.doc(`dpo_entries/${entryId}`);
  const evaluationsRef = db.collection('evaluations').where('dpoEntryId', '==', entryId);
  const flagsRef = db.collection(`dpo_entries/${entryId}/participant_flags`);

  try {
    await db.runTransaction(async (transaction) => {
      const entryDoc = await transaction.get(entryRef);
      if (!entryDoc.exists) {
        throw new HttpsError('not-found', `DPO entry with ID ${entryId} not found.`);
      }

      // 2. Cascade Deletion
      const evaluationsSnapshot = await evaluationsRef.get();
      evaluationsSnapshot.forEach((doc) => {
        transaction.delete(doc.ref);
      });

      const flagsSnapshot = await flagsRef.get();
      flagsSnapshot.forEach((doc) => {
        transaction.delete(doc.ref);
      });

      transaction.delete(entryRef);

      // 3. Update Statistics

      // 4. Logging
      const logRef = db.collection('activity_logs').doc();
      const logData: ActivityLogItemFc = {
        eventType: 'dpo_entry_deleted',
        dpoEntryId: entryId,
        details: {
          deletedBy: auth.uid,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp() as FirebaseAdminTimestamp,
        displayText: `Admin deleted DPO entry ${entryId}`,
        iconName: 'delete',
      };
      transaction.set(logRef, logData);
    });

    return { success: true, message: `DPO entry ${entryId} and all associated data have been deleted.` };
  } catch (error) {
    functions.logger.error(`Error deleting DPO entry ${entryId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'An unexpected error occurred while deleting the entry.');
  }
});
