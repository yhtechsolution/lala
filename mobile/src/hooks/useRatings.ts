// mobile/src/hooks/useRatings.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Review {
  id: string;
  guesthouseId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const REVIEWS_KEY = '@guesthouse_reviews';

export const useRatings = (guesthouseId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const stored = await AsyncStorage.getItem(REVIEWS_KEY);
        if (stored) {
          setReviews(JSON.parse(stored));
        } else {
          setReviews([]); // Clean empty start
        }
      } catch (e) {
        console.error('Failed to load reviews:', e);
      }
    };
    loadReviews();
  }, []);

  const addReview = useCallback(
    async (newReview: Omit<Review, 'id' | 'createdAt'>) => {
      const reviewToAdd: Review = {
        ...newReview,
        id: `rev-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setReviews((prev) => {
        const updated = [reviewToAdd, ...prev];
        AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const guesthouseReviews = guesthouseId
    ? reviews.filter((r) => String(r.guesthouseId) === String(guesthouseId))
    : reviews;

  const averageRating =
    guesthouseReviews.length > 0
      ? guesthouseReviews.reduce((sum, r) => sum + r.rating, 0) / guesthouseReviews.length
      : 0;

  return {
    reviews: guesthouseReviews,
    averageRating,
    totalReviews: guesthouseReviews.length,
    addReview,
  };
};