// Firestore survey-related queries
// Move survey query functions here from src/lib/survey/database.ts

import { db } from '@/lib/firebase';
import type { DPOEntry } from '@/types/dpo';
import { collection, doc, Firestore, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import type { EvaluationData, ParticipantFlag } from '@/types/dpo';

export async function generateDummyEntries(count: number): Promise<DPOEntry[]> {
  return Array.from({ length: count }).map((_, i) => ({
    id: `dummyEntry${i + 1}-${crypto.randomUUID().substring(0, 4)}`,
    instruction: `This is the primary instruction for dummy DPO entry ${i + 1}. Analyze based on the prompt provided.`,
    prompt: `Original prompt example for entry ${i + 1}: "Explain quantum entanglement simply."`,
    acceptedResponse: `Response A for dummy entry ${i + 1}: (Better response with simpler language and clearer examples)`,
    rejectedResponse: `Response B for dummy entry ${i + 1}: (Less ideal response with potential dark patterns)`,
    categories: [i % 3 === 0 ? 'Obscuring Information' : i % 3 === 1 ? 'Misleading Content' : 'Privacy Harm'],
    discussion: `Expert discussion for entry ${i + 1}, explaining the rationale for the preferred response.`,
    reviewCount: Math.floor(Math.random() * 5),
    date: new Date(),
  }));
}

export async function fetchAndAssignEntries(count: number): Promise<DPOEntry[]> {
  if (!db) {
    throw new Error('Firebase is not initialized. Ensure your environment configuration is correct.');
  }
  try {
    const entriesCollectionRef = collection(db as Firestore, 'dpo_entries');
    const q = query(entriesCollectionRef, orderBy('reviewCount', 'asc'), limit(count));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.warn('No DPO entries found in the database. Returning an empty array.');
      return generateDummyEntries(count);
    }
    const entries = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DPOEntry[];
    return entries;
  } catch (error) {
    console.error('Error fetching DPO entries:', error);
    throw new Error('Failed to fetch DPO entries from the database.');
  }
}

export async function getEntryDetails(entryId: string): Promise<{
  entry: DPOEntry | null;
  evaluations: EvaluationData[];
  flags: ParticipantFlag[];
}> {
  if (!db) throw new Error('Firebase is not initialized');

  try {
    // Fetch DPO Entry
    const entryDocRef = doc(db, 'dpo_entries', entryId);
    const entrySnap = await getDoc(entryDocRef);

    if (!entrySnap.exists()) {
      return { entry: null, evaluations: [], flags: [] };
    }

    const entryData = { id: entrySnap.id, ...entrySnap.data() } as DPOEntry;

    // Fetch evaluations in parallel
    const evaluationsQuery = query(
      collection(db, 'evaluations'),
      where('dpoEntryId', '==', entryId),
      orderBy('submittedAt', 'desc'),
    );
    const evaluationsSnap = await getDocs(evaluationsQuery);
    const evaluations = evaluationsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EvaluationData[];

    // Fetch flags in parallel
    const flagsQuery = query(
      collection(db, 'participant_flags'),
      where('dpoEntryId', '==', entryId),
      orderBy('flaggedAt', 'desc'),
    );
    const flagsSnap = await getDocs(flagsQuery);
    const flags = flagsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ParticipantFlag[];

    return { entry: entryData, evaluations, flags };
  } catch (error) {
    console.error('Error fetching entry details:', error);
    throw new Error('Failed to fetch entry details');
  }
}

export async function getEntryEvaluations(entryId: string): Promise<EvaluationData[]> {
  if (!db) throw new Error('Firebase is not initialized');

  try {
    const evaluationsQuery = query(
      collection(db, 'evaluations'),
      where('dpoEntryId', '==', entryId),
      orderBy('submittedAt', 'desc'),
    );
    const evaluationsSnap = await getDocs(evaluationsQuery);
    return evaluationsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EvaluationData[];
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    throw new Error('Failed to fetch evaluations');
  }
}

export async function getEntryFlags(entryId: string): Promise<ParticipantFlag[]> {
  if (!db) throw new Error('Firebase is not initialized');

  try {
    const flagsQuery = query(
      collection(db, 'participant_flags'),
      where('dpoEntryId', '==', entryId),
      orderBy('flaggedAt', 'desc'),
    );
    const flagsSnap = await getDocs(flagsQuery);
    return flagsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ParticipantFlag[];
  } catch (error) {
    console.error('Error fetching flags:', error);
    throw new Error('Failed to fetch flags');
  }
}
