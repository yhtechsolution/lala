import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVOURITES_KEY = '@guesthouse_favourites';

export const useFavourites = () => {
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);

  // Load favourites from AsyncStorage
  const reloadFavourites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVOURITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any undefined, null, or non-string values
          const cleanIds = parsed.filter((id) => id && typeof id === 'string' || typeof id === 'number').map(String);
          setFavouriteIds(cleanIds);
        }
      } else {
        setFavouriteIds([]);
      }
    } catch (e) {
      console.error('Failed to load favourites:', e);
    }
  }, []);

  useEffect(() => {
    reloadFavourites();
  }, [reloadFavourites]);

  // Check if a specific ID is in favourites
  const isFavourite = useCallback(
    (id?: string | number) => {
      if (!id) return false;
      return favouriteIds.includes(String(id));
    },
    [favouriteIds]
  );

  // Toggle favourite status safely
  const toggleFavourite = useCallback(
    async (id?: string | number) => {
      if (!id) return;
      const targetId = String(id);

      setFavouriteIds((prev) => {
        const updated = prev.includes(targetId)
          ? prev.filter((favId) => favId !== targetId)
          : [...prev, targetId];

        AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  return {
    favouriteIds,
    isFavourite,
    toggleFavourite,
    reloadFavourites,
  };
};