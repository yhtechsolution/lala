import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  clearRecentlyViewed,
  loadRecentlyViewed,
} from '../services/recentlyViewed';

// Reloads whenever the screen comes back into view, so a guesthouse opened a moment
// ago appears when the traveller returns to Browse.
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadRecentlyViewed().then((stored) => {
        if (active) setIds(stored);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const clear = useCallback(async () => {
    await clearRecentlyViewed();
    setIds([]);
  }, []);

  return { ids, clear };
}
