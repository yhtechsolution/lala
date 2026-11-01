import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, getFirestore, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth } from '../config/firebase';

const LOCAL_FAVOURITES_KEY = '@guesthouse_favourites';

export const useFavourites = () => {
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const user = auth?.currentUser;

  // Load user favourites from Firestore (or AsyncStorage fallback)
  useEffect(() => {
    const loadFavourites = async () => {
      try {
        if (user) {
          // Fetch from Firestore
          const userRef = doc(getFirestore(), 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setFavouriteIds(data.favourites || []);
          }
        } else {
          // Fallback to local storage if user is offline/guest
          const stored = await AsyncStorage.getItem(LOCAL_FAVOURITES_KEY);
          if (stored) {
            setFavouriteIds(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error('Error loading favourites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavourites();
  }, [user]);

  // Toggle favourite and update Firestore / AsyncStorage
  const toggleFavourite = async (guesthouseId: string) => {
    const exists = favouriteIds.includes(guesthouseId);
    const updatedIds = exists
      ? favouriteIds.filter((id) => id !== guesthouseId)
      : [...favouriteIds, guesthouseId];

    // Optimistic UI update
    setFavouriteIds(updatedIds);

    try {
      if (user) {
        // Sync with Firestore
        const userRef = doc(getFirestore(), 'users', user.uid);
        await updateDoc(userRef, {
          favourites: exists
            ? arrayRemove(guesthouseId)
            : arrayUnion(guesthouseId),
        });
      } else {
        // Sync with local storage
        await AsyncStorage.setItem(
          LOCAL_FAVOURITES_KEY,
          JSON.stringify(updatedIds)
        );
      }
    } catch (error) {
      console.error('Error updating favourite in Firestore:', error);
      // Revert local state if save failed
      setFavouriteIds(favouriteIds);
    }
  };

  const isFavourite = (guesthouseId: string) => favouriteIds.includes(guesthouseId);

  return { favouriteIds, isFavourite, toggleFavourite, loading };
};