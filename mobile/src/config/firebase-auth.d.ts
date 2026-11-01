import 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Persistence } from 'firebase/auth';

// Firebase exports this documented API in its React Native bundle, but its
// default TypeScript entry point only includes the browser declarations.
declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>,
  ): Persistence;
}
