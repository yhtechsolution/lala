import { FirebaseStorage, getStorage } from 'firebase/storage';
import {
  FirebaseApp,
  FirebaseOptions,
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';
import {
  connectFirestoreEmulator,
  Firestore,
  getFirestore,
} from 'firebase/firestore';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';

import { initializePersistentAuth } from './persistentAuth';

// Expo exposes EXPO_PUBLIC_ variables from the local .env file to the app.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

// Keep Firebase disabled when any required value is missing instead of starting with partial settings.
export const isFirebaseConfigured = requiredConfig.every(Boolean);

// Fast Refresh can run this file more than once, so reuse the existing Firebase app when possible.
export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

// Shared Firestore connection for customer profile and guesthouse data.
export const firestore: Firestore | null = firebaseApp
  ? getFirestore(firebaseApp)
  : null;

function createAuth(): Auth | null {
  if (!firebaseApp) return null;
  try {
    return initializePersistentAuth(firebaseApp);
  } catch (error) {
    // Fast Refresh can evaluate this module again after Auth is initialized.
    if ((error as { code?: string }).code === 'auth/already-initialized')
      return getAuth(firebaseApp);
    throw error;
  }
}

export const auth = createAuth();

// Explicit opt-in for local testing; use a demo project to avoid live writes.
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
if (
  __DEV__ &&
  emulatorHost &&
  firebaseConfig.projectId?.startsWith('demo-') &&
  auth &&
  firestore
) {
  if (!auth.emulatorConfig) {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(firestore, emulatorHost, 8080);
  }
}

// Shared storage connection for the upstream service layer.
export const storage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null;
