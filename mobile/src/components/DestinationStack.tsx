import { Feather, Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import { styles } from '../styles/DestinationStack.styles';
import { colors } from '../theme';

export type Destination = {
  name: string;
  country: string;
  count: number;
};

export function DestinationStack({
  destinations,
  selectedCity,
  onSelect,
}: {
  destinations: Destination[];
  selectedCity: string | null;
  onSelect: (destination: Destination) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = destinations.length;
  const index = count ? activeIndex % count : 0;
  const active = destinations[index];

  useEffect(() => {
    setActiveIndex((current) => (count ? current % count : 0));
  }, [count]);

  const step = (direction: number) => {
    if (count < 2) return;
    setActiveIndex((current) => (current + direction + count) % count);
  };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          count > 1 &&
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -40) step(1);
          if (gesture.dx > 40) step(-1);
        },
      }),
    [count],
  );

  if (!active) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>Explore Other Locations</Text>
          <Text style={styles.subtitle}>Swipe the cards to choose a city</Text>
        </View>
        <Text style={styles.counter}>
          {index + 1} / {count}
        </Text>
      </View>
      <View accessibilityLabel="Swipe left or right to explore locations" style={styles.deck} {...pan.panHandlers}>
        {count > 2 && <View pointerEvents="none" style={styles.backCardFar} />}
        {count > 1 && <View pointerEvents="none" style={styles.backCardNear} />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Show guesthouses in ${active.name}, ${active.country}`}
          accessibilityState={{ selected: selectedCity === active.name }}
          onPress={() => onSelect(active)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.cardTop}>
            <View style={styles.icon}>
              <Ionicons color={colors.primaryDark} name="compass" size={22} />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {active.count} {active.count === 1 ? 'stay' : 'stays'}
              </Text>
            </View>
          </View>
          <Text style={styles.city}>{active.name}</Text>
          <View style={styles.cardBottom}>
            <Text style={styles.country}>{active.country}</Text>
            <View style={styles.action}>
              <Text style={styles.actionText}>
                {selectedCity === active.name ? 'Selected' : 'Explore stays'}
              </Text>
              <Feather color={colors.primaryDark} name="arrow-up-right" size={15} />
            </View>
          </View>
        </Pressable>
      </View>
      {count > 1 && (
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous location"
            onPress={() => step(-1)}
            style={styles.arrow}
          >
            <Feather color={colors.primaryDark} name="arrow-left" size={18} />
          </Pressable>
          <View style={styles.dots}>
            {destinations.map((destination, dotIndex) => (
              <View
                key={`${destination.name}-${destination.country}`}
                style={[styles.dot, dotIndex === index && styles.activeDot]}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next location"
            onPress={() => step(1)}
            style={styles.arrow}
          >
            <Feather color={colors.primaryDark} name="arrow-right" size={18} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
