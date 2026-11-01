import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { auth, firestore } from '../config/firebase';
import { authErrorMessage } from '../services/customerAuth';

type Customer = { email: string; displayName: string };
type AuthState = {
  user: User | null;
  customer: Customer | null;
  initializing: boolean;
  profileLoading: boolean;
  profileCached: boolean;
  error: string | null;
  retryProfile: () => void;
};
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [initializing, setInitializing] = useState(Boolean(auth));
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileCached, setProfileCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileAttempt, setProfileAttempt] = useState(0);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setCustomer(null);
        setError(null);
        setProfileLoading(Boolean(nextUser));
        setProfileCached(false);
        setUser(nextUser);
        setInitializing(false);
      },
      (nextError) => {
        setError(authErrorMessage(nextError));
        setInitializing(false);
      },
    );
  }, []);

  useEffect(() => {
    if (!user || !firestore) return;
    let active = true;
    setProfileLoading(true);
    setProfileCached(false);
    const fail = (cause: unknown) => {
      if (!active) return;
      clearTimeout(timer);
      setError(authErrorMessage(cause));
      setProfileLoading(false);
    };
    const timer = setTimeout(
      () =>
        fail(
          new Error(
            'Unable to load your profile. Check your connection and try again.',
          ),
        ),
      15000,
    );
    const unsubscribe = onSnapshot(
      doc(firestore, 'customers', user.uid),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active || (!snapshot.exists() && snapshot.metadata.fromCache))
          return;
        clearTimeout(timer);
        setCustomer(snapshot.exists() ? (snapshot.data() as Customer) : null);
        setProfileCached(snapshot.metadata.fromCache);
        setProfileLoading(false);
        setError(null);
      },
      fail,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [user, profileAttempt]);

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        initializing,
        profileLoading,
        profileCached,
        error,
        retryProfile: () => setProfileAttempt((attempt) => attempt + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
