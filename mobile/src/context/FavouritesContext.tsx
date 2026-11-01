import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  engagementErrorMessage,
  setGuesthouseFavourite,
  subscribeToFavouriteIds,
} from '../services/customerEngagement';

type State = {
  ids: string[];
  loading: boolean;
  cached: boolean;
  error: string | null;
  pending: string[];
  retry: () => void;
  toggle: (id: string) => Promise<void>;
};
const FavouritesContext = createContext<State | undefined>(undefined);
export function FavouritesProvider({ children }: PropsWithChildren) {
  const { user, initializing } = useAuth();
  const uid = user?.uid;
  const [snapshot, setSnapshot] = useState<{ owner?: string; ids: string[] }>({
    ids: [],
  });
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<string[]>([]);
  const operations = useRef(new Set<string>());
  const session = useRef(uid);
  session.current = uid;
  useEffect(() => {
    setSnapshot({ owner: uid, ids: [] });
    setLoading(Boolean(uid));
    setCached(false);
    setError(null);
    setPending([]);
    operations.current.clear();
    if (!uid) return;
    let active = true;
    const fail = (cause: unknown) => {
      if (!active) return;
      clearTimeout(timer);
      setError(engagementErrorMessage(cause));
      setLoading(false);
    };
    const timer = setTimeout(
      () =>
        fail(
          new Error(
            'Unable to load favourites. Check your connection and try again.',
          ),
        ),
      15000,
    );
    const unsubscribe = subscribeToFavouriteIds(
      uid,
      (ids, fromCache) => {
        if (!active) return;
        clearTimeout(timer);
        setSnapshot({ owner: uid, ids });
        setCached(fromCache);
        setError(null);
        setLoading(false);
      },
      fail,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [uid, attempt]);
  const ids = snapshot.owner === uid ? snapshot.ids : [];
  const toggle = async (id: string) => {
    if (!uid) throw new Error('Please sign in to save favourites.');
    const key = `${uid}/${id}`;
    if (operations.current.has(key)) return;
    if (loading || snapshot.owner !== uid || error)
      throw new Error(
        'Wait for your favourites to load, or retry loading them.',
      );
    operations.current.add(key);
    setPending((value) => [...value, id]);
    try {
      await setGuesthouseFavourite(id, !ids.includes(id));
    } finally {
      operations.current.delete(key);
      if (session.current === uid)
        setPending((value) => value.filter((item) => item !== id));
    }
  };
  return (
    <FavouritesContext.Provider
      value={{
        ids,
        cached: snapshot.owner === uid && cached,
        loading:
          initializing || (Boolean(uid) && (loading || snapshot.owner !== uid)),
        error: snapshot.owner === uid ? error : null,
        pending: snapshot.owner === uid ? pending : [],
        retry: () => setAttempt((value) => value + 1),
        toggle,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}
export function useFavourites() {
  const value = useContext(FavouritesContext);
  if (!value)
    throw new Error('useFavourites must be used inside FavouritesProvider');
  return value;
}
