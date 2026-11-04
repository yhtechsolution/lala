import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  NearbyGuesthouse,
  Coordinates,
  nextNearbyGuesthouseId,
} from '../services/nearbyGuesthouses';
import { styles } from '../styles/ExploreMapView.styles';
import { colors } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { selectionFeedback } from '../services/selectionFeedback';
import { LeafletMap } from './LeafletMap';

export function ExploreMapView({
  items,
  position,
  onMapError,
  onShowList,
}: {
  items: NearbyGuesthouse[];
  position: Coordinates;
  onMapError: () => void;
  onShowList: () => void;
}) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '');
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const selectedIndex = items.findIndex((item) => item.id === selected?.id);
  const { height: screenHeight } = useWindowDimensions();
  const [mapHeight, setMapHeight] = useState(0);
  const [nearbyExpanded, setNearbyExpanded] = useState(false);
  const nearbyHeight = useRef(new Animated.Value(78)).current;
  const expandedHeight = Math.min(420, Math.max(240, screenHeight * 0.46));
  const selectedIdRef = useRef(selected?.id ?? '');
  if (!items.some((item) => item.id === selectedIdRef.current)) {
    selectedIdRef.current = selected?.id ?? '';
  }
  const selectGuesthouse = (id: string) => {
    if (!items.some((item) => item.id === id)) return;
    if (selectedIdRef.current === id) return;
    selectedIdRef.current = id;
    selectionFeedback();
    setSelectedId(id);
  };
  const selectedKey = selected?.id ?? '';
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const target = nearbyExpanded ? expandedHeight : 78;
    if (reducedMotion) {
      nearbyHeight.setValue(target);
      return;
    }
    const animation = Animated.timing(nearbyHeight, {
      toValue: target,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [nearbyExpanded, expandedHeight, reducedMotion, nearbyHeight]);
  const nearbyDrag = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -40) setNearbyExpanded(true);
          if (gesture.dy > 40) setNearbyExpanded(false);
        },
      }),
    [],
  );
  const reveal = useRef(new Animated.Value(1)).current;
  const previousKey = useRef(selectedKey);

  useEffect(() => {
    if (previousKey.current === selectedKey || reducedMotion) {
      reveal.setValue(1);
      previousKey.current = selectedKey;
      return;
    }
    previousKey.current = selectedKey;
    reveal.setValue(0);
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [selectedKey, reducedMotion, reveal]);
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          items.length > 1 &&
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 40) return;
          const direction = gesture.dx < 0 ? 1 : -1;
          const next = nextNearbyGuesthouseId(
            items,
            selectedIdRef.current,
            direction,
          );
          if (next) selectGuesthouse(next);
        },
      }),
    [items],
  );
  const mapListings = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        pricePerNight: item.pricePerNight,
        location: item.location,
      })),
    [items],
  );
  return (
    <View style={styles.content}>
      <View
        style={styles.mapFrame}
        onLayout={(event) => setMapHeight(event.nativeEvent.layout.height)}
      >
        {mapHeight > 0 && (
          <LeafletMap
            height={mapHeight}
            listings={mapListings}
            selectedId={selected?.id}
            userPosition={position}
            onSelect={selectGuesthouse}
            onError={onMapError}
          />
        )}
      </View>
      {selected ? (
        <Animated.View
          accessibilityLabel="Swipe left or right to select nearby guesthouses"
          style={[
            styles.selectedCard,
            { bottom: items.length > 1 ? 92 : 20 },
            {
              opacity: reveal,
              transform: [
                {
                  translateY: reveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
          {...swipe.panHandlers}
        >
          <View style={styles.selectedMain}>
            {selected.imageUrl ? (
              <Image source={{ uri: selected.imageUrl }} style={styles.selectedImage} />
            ) : (
              <View style={[styles.selectedImage, styles.imageFallback]}>
                <Feather color={colors.textMuted} name="image" size={22} />
              </View>
            )}
            <View style={styles.selectedCopy}>
              <Text style={styles.rating}>
                {selected.ratingCount
                  ? `★ ${selected.averageRating.toFixed(1)} (${selected.ratingCount} reviews)`
                  : 'New · No ratings yet'}
              </Text>
              <Text numberOfLines={2} style={styles.name}>
                {selected.name}
              </Text>
              <Text style={styles.meta}>
                {selected.city} · {selected.distanceKm.toFixed(1)} km away
              </Text>
              {items.length > 1 && (
                <Text style={styles.swipeHint}>
                  Swipe card · {selectedIndex + 1} of {items.length}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.selectedFooter}>
            <View>
              <Text style={styles.priceLabel}>Guide rate</Text>
              <Text style={styles.price}>
                P {selected.pricePerNight.toLocaleString('en-US')}
                <Text style={styles.perNight}> / night</Text>
              </Text>
            </View>
            <Pressable
              key={selected.id}
              accessibilityRole="button"
              accessibilityLabel={`View ${selected.name} details`}
              onPress={() => {
                const id = selectedIdRef.current;
                if (id) router.push({ pathname: '/guesthouse/[id]', params: { id } });
              }}
              style={styles.detailsButton}
            >
              <Text style={styles.detailsText}>View Details</Text>
              <Feather color={colors.white} name="arrow-right" size={16} />
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No guesthouses within 50 km</Text>
          <Text style={styles.emptyCopy}>
            You can still browse every guesthouse in List View.
          </Text>
          <Pressable accessibilityRole="button" onPress={onShowList}>
            <Text style={styles.listLink}>Show all guesthouses</Text>
          </Pressable>
        </View>
      )}
      {items.length > 1 && (
        <Animated.View style={[styles.nearbySection, { height: nearbyHeight }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              nearbyExpanded
                ? 'Collapse nearby guesthouses'
                : 'Expand nearby guesthouses'
            }
            accessibilityState={{ expanded: nearbyExpanded }}
            onPress={() => setNearbyExpanded((current) => !current)}
            style={styles.nearbyHeader}
            {...nearbyDrag.panHandlers}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.nearbyHeading}>
              <View>
                <Text style={styles.sectionTitle}>Nearby Guesthouses</Text>
                <Text style={styles.sectionSubtitle}>
                  {items.length} stays within 50 km ·{' '}
                  {nearbyExpanded ? 'Swipe down to close' : 'Swipe up to browse'}
                </Text>
              </View>
              <Feather
                color={colors.primaryDark}
                name={nearbyExpanded ? 'chevron-down' : 'chevron-up'}
                size={20}
              />
            </View>
          </Pressable>
          {nearbyExpanded && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.miniStrip}
            >
              {items.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name} on map`}
                  accessibilityState={{ selected: selected?.id === item.id }}
                  key={item.id}
                  onPress={() => {
                    selectGuesthouse(item.id);
                    setNearbyExpanded(false);
                  }}
                  style={[
                    styles.miniCard,
                    selected?.id === item.id && styles.miniSelected,
                  ]}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.miniImage}
                    />
                  ) : (
                    <View style={[styles.miniImage, styles.imageFallback]}>
                      <Feather color={colors.textMuted} name="image" size={20} />
                    </View>
                  )}
                  <View style={styles.miniCopy}>
                    <Text numberOfLines={1} style={styles.miniName}>
                      {item.name}
                    </Text>
                    <Text style={styles.miniPrice}>
                      P {item.pricePerNight.toLocaleString('en-US')} / night
                    </Text>
                    <Text style={styles.miniDistance}>
                      {item.distanceKm.toFixed(1)} km away
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}
    </View>
  );
}
