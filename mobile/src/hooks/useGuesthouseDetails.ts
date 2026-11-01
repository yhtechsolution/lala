import { useEffect, useState } from 'react';
import {
  GuesthouseDetails,
  subscribeToGuesthouseDetails,
} from '../services/guesthouseDetails';
import { guesthousesErrorMessage } from '../services/guesthouses';

// Keep stale records out of view when navigating between guesthouses or retrying.
export function useGuesthouseDetails(id: string) {
  const [state, setState] = useState<{
    id: string;
    guesthouse: GuesthouseDetails | null;
    loading: boolean;
    error: string | null;
    cached: boolean;
  }>({ id, guesthouse: null, loading: true, error: null, cached: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState({
      id,
      guesthouse: null,
      loading: true,
      error: null,
      cached: false,
    });
    const fail = (cause: unknown) => {
      if (!active) return;
      clearTimeout(timer);
      setState({
        id,
        guesthouse: null,
        loading: false,
        error: guesthousesErrorMessage(cause),
        cached: false,
      });
    };
    const timer = setTimeout(
      () =>
        fail(
          new Error(
            'Unable to load this guesthouse. Check your connection and try again.',
          ),
        ),
      15000,
    );
    const unsubscribe = subscribeToGuesthouseDetails(
      id,
      (guesthouse, fromCache) => {
        if (!active) return;
        clearTimeout(timer);
        setState({
          id,
          guesthouse,
          loading: false,
          error: null,
          cached: fromCache,
        });
      },
      fail,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [id, attempt]);
  return {
    ...(state.id === id
      ? state
      : { guesthouse: null, loading: true, error: null, cached: false }),
    retry: () => setAttempt((value) => value + 1),
  };
}
