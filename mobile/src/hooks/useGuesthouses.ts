import { useCallback, useEffect, useState } from 'react';

import {
  guesthousesErrorMessage,
  subscribeToGuesthouses,
  GuesthouseSearch,
} from '../services/guesthouses';
import { Guesthouse } from '../types/guesthouse';

export function useGuesthouses(options: GuesthouseSearch = {}) {
  const {
    text = '',
    field = 'nameLower',
    sort = 'priceAsc',
    minPrice,
    maxPrice,
    minRating,
  } = options;
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoading(true);
    setCached(false);
    setGuesthouses([]);
    setError(null);
    let active = true;
    const handleError = (nextError: unknown) => {
      if (!active) return;
      clearTimeout(timeout);
      setError(guesthousesErrorMessage(nextError));
      setLoading(false);
    };
    const timeout = setTimeout(
      () =>
        handleError(
          new Error(
            'Unable to load guesthouses. Check your connection and try again.',
          ),
        ),
      15000,
    );
    const unsubscribe = subscribeToGuesthouses(
      (nextGuesthouses, fromCache) => {
        if (!active) return;
        clearTimeout(timeout);
        setGuesthouses(nextGuesthouses);
        setCached(fromCache);
        setLoading(false);
        setError(null);
      },
      handleError,
      { text, field, sort, minPrice, maxPrice, minRating },
    );
    return () => {
      active = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [attempt, text, field, sort, minPrice, maxPrice, minRating]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { guesthouses, loading, cached, error, retry };
}
