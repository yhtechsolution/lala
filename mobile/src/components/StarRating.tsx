import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, makeThemedStyles } from '../theme';

interface StarRatingProps {
  rating: number; // 1 to 5
  maxStars?: number;
  starSize?: number;
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  starSize = 22,
  interactive = false,
  onRatingChange,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;

        return (
          <TouchableOpacity
            key={index}
            disabled={!interactive}
            onPress={() => onRatingChange && onRatingChange(starValue)}
            activeOpacity={0.7}
            style={styles.starTouch}
          >
            <Ionicons
              name={isFilled ? 'star' : 'star-outline'}
              size={starSize}
              color={isFilled ? colors.accent : colors.border}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = makeThemedStyles((colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starTouch: {
    padding: 2,
  },
}));
