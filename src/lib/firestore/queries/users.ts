// src/lib/firestore/queries/users.ts
import { db } from '@/lib/firebase';
import type { AppUser } from '@/types/user';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, Timestamp } from 'firebase/firestore';

// It's better to have this in a types file, but for now this clarifies the return type
export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  roles: string[];
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) throw new Error('Firebase is not initialized');
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  }

  return null;
}

export async function fetchOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<AppUser> {
  if (!db) throw new Error('Firebase is not initialized');
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const firestoreData = userDocSnap.data();
    // Combine the Firebase Auth user object with Firestore data.
    const appUser: AppUser = {
      ...firebaseUser,
      ...firestoreData,
    };
    // Update last login timestamp in the background.
    setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true }).catch(console.error);
    return appUser;
  } else {
    // For a new user, create the profile data to be stored in Firestore.
    const newProfileData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      roles: ['researcher'], // Default role.
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(userDocRef, newProfileData);

    // The final AppUser object combines the full FirebaseUser object with the new data.
    const appUser: AppUser = {
      ...firebaseUser,
      roles: newProfileData.roles,
      createdAt: newProfileData.createdAt,
      lastLoginAt: newProfileData.lastLoginAt,
    };
    return appUser;
  }
}

export async function fetchAllResearchers(): Promise<AppUser[]> {
  if (!db) throw new Error('Firebase is not initialized');
  const usersCollectionRef = collection(db, 'users');
  const q = query(usersCollectionRef, where('roles', 'array-contains', 'researcher'));

  const querySnapshot = await getDocs(q);
  const researchers: AppUser[] = [];

  querySnapshot.forEach((doc) => {
    researchers.push(doc.data() as AppUser);
  });

  return researchers;
}
