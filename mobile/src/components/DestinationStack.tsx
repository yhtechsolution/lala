import { Feather, Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, Text, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { selectionFeedback } from '../services/selectionFeedback';
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
  const activeKey = active ? `${active.name}|${active.country}` : '';
  const reducedMotion = useReducedMotion();
  const reveal = useRef(new Animated.Value(1)).current;
  const previousKey = useRef(activeKey);

  useEffect(() => {
    if (previousKey.current === activeKey || reducedMotion) {
      reveal.setValue(1);
      previousKey.current = activeKey;
      return;
    }
    previousKey.current = activeKey;
    reveal.setValue(0);
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [activeKey, reducedMotion, reveal]);

  useEffect(() => {
    setActiveIndex((current) => (count ? current % count : 0));
  }, [count]);

  const step = (direction: number) => {
    if (count < 2) return;
    selectionFeedback();
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
        <Animated.View
          style={[
            styles.frontCard,
            {
              opacity: reveal,
              transform: [
                {
                  translateY: reveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show guesthouses in ${active.name}, ${active.country}`}
            accessibilityState={{ selected: selectedCity === active.name }}
            onPress={() => {
              if (selectedCity !== active.name) selectionFeedback();
              onSelect(active);
            }}
            style={({ pressed }) => [
              styles.card,
              selectedCity === active.name && styles.selectedCard,
              pressed && styles.pressed,
            ]}
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
        </Animated.View>
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
