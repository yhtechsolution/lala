import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

export function initializePersistentAuth(app: FirebaseApp) {
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
