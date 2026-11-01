import { FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, initializeAuth } from 'firebase/auth';

export function initializePersistentAuth(app: FirebaseApp) {
  return initializeAuth(app, { persistence: browserLocalPersistence });
}
