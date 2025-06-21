import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functionsInstance: Functions | null = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  if (app) {
    functionsInstance = getFunctions(app, 'us-central1'); // Initialize functions, specify region
  } else {
    console.error('Firebase app not initialized, cannot initialize Functions.');
  }
} else {
  console.error(
    'Firebase initialization skipped: Missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID in environment variables.',
    'Ensure these are set in your .env.local file and you have restarted the development server.',
    'Current API Key (should not be undefined/empty):',
    firebaseConfig.apiKey ? '********' : firebaseConfig.apiKey,
    'Current Project ID (should not be undefined/empty):',
    firebaseConfig.projectId,
  );
}

export { app, auth, db, functionsInstance as functions };
