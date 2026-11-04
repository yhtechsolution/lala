import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/BrowseScreen.styles';

import { GuesthouseCard } from '../components/GuesthouseCard';
import { ConnectionNotice } from '../components/ConnectionNotice';
import { Destination, DestinationStack } from '../components/DestinationStack';
import { useGuesthouses } from '../hooks/useGuesthouses';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { resolveRecentlyViewed } from '../services/recentlyViewed';
import { colors } from '../theme';

export function BrowseScreen() {
  const { guesthouses, loading, cached, error, retry } = useGuesthouses();
  const [query, setQuery] = useState('');
  const [smartSelected, setSmartSelected] = useState(false);
  const { ids: recentIds, clear: clearRecent } = useRecentlyViewed();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const homeScroll = useRef<ScrollView>(null);
  const cards = useRef<ScrollView>(null);
  const nearby = useMemo(() => {
    // A smart-search sentence is interpreted on Explore, not matched as a name here.
    const normalizedQuery = smartSelected ? '' : query.trim().toLowerCase();
    return guesthouses.filter(
      (guesthouse) =>
        (!selectedCity ||
          guesthouse.city.toLowerCase() === selectedCity.toLowerCase()) &&
        `${guesthouse.name} ${guesthouse.city} ${guesthouse.country}`
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [guesthouses, query, selectedCity, smartSelected]);
  const recentlyViewed = useMemo(
    () => resolveRecentlyViewed(recentIds, guesthouses),
    [recentIds, guesthouses],
  );
  const topRated = useMemo(
    () =>
      nearby
        .filter((guesthouse) => guesthouse.ratingCount > 0)
        .sort(
          (a, b) =>
            b.averageRating - a.averageRating ||
            a.pricePerNight - b.pricePerNight,
        )
        .slice(0, 4),
    [nearby],
  );
  const destinations = useMemo(() => {
    const cities = new Map<string, Destination>();
    guesthouses.forEach((guesthouse) => {
      if (!guesthouse.city) return;
      const key = `${guesthouse.city.toLowerCase()}|${guesthouse.country.toLowerCase()}`;
      const city = cities.get(key);
      if (city) city.count++;
      else
        cities.set(key, {
          name: guesthouse.city,
          country: guesthouse.country,
          count: 1,
        });
    });
    return [...cities.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [guesthouses]);
  const openSearch = (smart: boolean) =>
    router.push({
      pathname: '/search',
      params: {
        q: query,
        city: selectedCity ?? '',
        ...(smart
          ? { smart: 'true', smartRequest: String(Date.now()) }
          : {}),
      },
    });
  const submitSearch = () => openSearch(smartSelected);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/lala-house-mark.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Lala logo"
          />
          <View>
            <Text style={styles.brand}>Lala</Text>
            <Text style={styles.pageLabel}>Home</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push('/login')}
            style={styles.profileButton}
          >
            <Feather color={colors.white} name="user" size={14} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={homeScroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.horizontalPadding}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to location choices"
            onPress={() => homeScroll.current?.scrollToEnd({ animated: true })}
            style={styles.locationCard}
          >
            <View style={styles.locationMain}>
              <View style={styles.locationIcon}>
                <Ionicons
                  color={colors.primaryDark}
                  name="location"
                  size={18}
                />
              </View>
              <View>
                <Text style={styles.eyebrow}>EXPLORING HUB</Text>
                <View style={styles.inlineRow}>
                  <Text style={styles.locationTitle}>
                    {selectedCity ?? 'All locations'}
                  </Text>
                  <Feather
                    color={colors.textMuted}
                    name={selectedCity ? 'x' : 'chevron-down'}
                    size={14}
                  />
                </View>
              </View>
            </View>
            {!loading && !error && (
              <View style={styles.activeHubsBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeHubsText}>
                  {destinations.length} Active{' '}
                  {destinations.length === 1 ? 'Hub' : 'Hubs'}
                </Text>
              </View>
            )}
          </Pressable>
          <View style={styles.searchBar}>
            <Feather color={colors.primaryDark} name="search" size={17} />
            <TextInput
              accessibilityLabel="Search guesthouses"
              onChangeText={setQuery}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholder={
                smartSelected
                  ? 'Describe the stay you want'
                  : 'Search by guesthouse or city'
              }
              placeholderTextColor={colors.textSoft}
              style={styles.searchInput}
              value={query}
              autoCorrect={false}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Smart search mode"
              accessibilityState={{ selected: smartSelected }}
              onPress={() => {
                if (smartSelected) {
                  setSmartSelected(false);
                } else {
                  setSmartSelected(true);
                  if (query.trim()) openSearch(true);
                }
              }}
              style={[
                styles.smartSearchAction,
                smartSelected && styles.smartSearchActionSelected,
              ]}
            >
              <Ionicons
                color={smartSelected ? colors.white : colors.primaryDark}
                name="sparkles"
                size={15}
              />
              <Text
                style={[
                  styles.smartSearchActionText,
                  smartSelected && styles.smartSearchActionTextSelected,
                ]}
              >
                Smart
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open search and filters"
              onPress={() => {
                setSmartSelected(false);
                router.push({
                  pathname: '/search',
                  params: { q: query, city: selectedCity ?? '', filters: 'true' },
                });
              }}
              style={styles.filterButton}
            >
              <Feather color={colors.textMuted} name="sliders" size={15} />
            </Pressable>
          </View>
        </View>
        {cached && !loading && !error && (
          <View style={styles.horizontalPadding}>
            <ConnectionNotice onRetry={retry} />
          </View>
        )}
        {loading ? (
          <View accessibilityLiveRegion="polite" style={styles.emptyState}>
            <ActivityIndicator
              color={colors.primary}
              accessibilityLabel="Loading guesthouses"
            />
            <Text style={styles.emptyTitle}>Loading guesthouses</Text>
            <Text style={styles.emptyCopy}>
              Finding your next Botswana stay.
            </Text>
          </View>
        ) : error ? (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={styles.emptyState}
          >
            <Feather color={colors.warning} name="alert-circle" size={24} />
            <Text style={styles.emptyTitle}>Unable to load guesthouses</Text>
            <Text style={styles.emptyCopy}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={retry}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : !nearby.length ? (
          <View accessibilityLiveRegion="polite" style={styles.emptyState}>
            <Feather color={colors.primary} name="search" size={24} />
            <Text style={styles.emptyTitle}>No guesthouses found</Text>
            <Text style={styles.emptyCopy}>
              {query.trim() || selectedCity
                ? 'Try another guesthouse, city, or area.'
                : 'New stays will appear here when they are added.'}
            </Text>
            {(query.trim().length > 0 || selectedCity) && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setQuery('');
                  setSelectedCity(null);
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Clear filters</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <View style={styles.sectionHeadingRow}>
              <View>
                <View style={styles.inlineRow}>
                  <Text style={styles.sectionTitle}>Explore Guesthouses</Text>
                  <View style={styles.sectionDot} />
                </View>
                <Text style={styles.sectionSubtitle}>
                  Find your stay across Botswana
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Scroll through guesthouses"
                onPress={() => cards.current?.scrollToEnd({ animated: true })}
              >
                <Text style={styles.seeAll}>See all ({nearby.length})</Text>
              </Pressable>
            </View>
            <ScrollView
              ref={cards}
              contentContainerStyle={styles.horizontalCards}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {nearby.map((guesthouse) => (
                <GuesthouseCard guesthouse={guesthouse} key={guesthouse.id} />
              ))}
            </ScrollView>
            {recentlyViewed.length > 0 && !query.trim() && !selectedCity && (
              <View style={styles.editorialSection}>
                <View style={styles.sectionHeadingRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Recently viewed</Text>
                    <Text style={styles.sectionSubtitle}>
                      Saved on this device only
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear recently viewed guesthouses"
                    onPress={() => void clearRecent()}
                  >
                    <Text style={styles.seeAll}>Clear</Text>
                  </Pressable>
                </View>
                <ScrollView
                  contentContainerStyle={styles.horizontalCards}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {recentlyViewed.map((guesthouse) => (
                    <GuesthouseCard
                      guesthouse={guesthouse}
                      key={guesthouse.id}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            {topRated.length > 0 && (
              <View style={styles.editorialSection}>
                <Text style={styles.sectionTitle}>Top Rated in Botswana</Text>
                <Text style={styles.sectionSubtitle}>Rated by guests</Text>
                <View style={styles.editorialCards}>
                  {topRated.map((guesthouse) => (
                    <GuesthouseCard
                      editorial
                      guesthouse={guesthouse}
                      key={guesthouse.id}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
        {!loading && !error && destinations.length > 0 && (
          <DestinationStack
            destinations={destinations}
            selectedCity={selectedCity}
            onSelect={(destination) => {
              setQuery('');
              setSelectedCity(destination.name);
              homeScroll.current?.scrollTo({ y: 0, animated: true });
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
