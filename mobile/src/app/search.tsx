import { Feather, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { AuthIcon } from '../components/AuthIcon';
import { GuesthouseCard } from '../components/GuesthouseCard';
import { ConnectionNotice } from '../components/ConnectionNotice';
import { ExploreMapView } from '../components/ExploreMapView';
import { PriceRange } from '../components/PriceRange';
import { SearchIcon } from '../components/SearchIcon';
import { useGuesthouses } from '../hooks/useGuesthouses';
import {
  amenityKey,
  GuesthouseSort,
  sortAndFilterGuesthouses,
} from '../services/guesthouses';
import {
  Coordinates,
  nearbyGuesthouses,
} from '../services/nearbyGuesthouses';
import {
  buildVocabulary,
  describePlan,
  isEmptyPlan,
} from '../services/smartSearch';
import { interpretSearch } from '../services/smartSearchAi';
import { styles } from '../styles/SearchScreen.styles';
import { selectionFeedback } from '../services/selectionFeedback';
import { distanceKm } from '../services/guesthouses';
import { formatDistance } from '../services/distance';
import { colors } from '../theme';

const sorts: { value: GuesthouseSort; label: string; caption: string }[] = [
  {
    value: 'priceAsc',
    label: 'Price: Low to High',
    caption: 'Best value first',
  },
  { value: 'rating', label: 'Top Rated', caption: 'Guest favorites' },
  { value: 'distance', label: 'Nearest to me', caption: 'Uses your location' },
  {
    value: 'priceDesc',
    label: 'Price: High to Low',
    caption: 'Highest price first',
  },
];
function parsePrice(value: string) {
  if (!value.trim()) return undefined;
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) ? Number(value) : NaN;
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    city?: string;
    filters?: string;
    smart?: string;
    smartRequest?: string;
  }>();
  const [text, setText] = useState(params.q ?? '');
  const [cityFilter, setCityFilter] = useState(params.city ?? '');
  const [debouncedText, setDebouncedText] = useState(text);
  const [sort, setSort] = useState<GuesthouseSort>('priceAsc');
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(params.filters === 'true');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [devicePosition, setDevicePosition] = useState<Coordinates | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const [smartBusy, setSmartBusy] = useState(false);
  const [smartSelected, setSmartSelected] = useState(params.smart === 'true');
  const [smartNote, setSmartNote] = useState('');
  const lastSmartRequest = useRef<string | null>(null);
  const smartFiltersApplied = useRef(false);
  const queuedSmartSearch = useRef(false);
  const smartRunId = useRef(0);
  useEffect(() => {
    if (params.smart === 'true') setView('list');
  }, [params.smart, params.smartRequest]);
  useEffect(() => {
    setText(params.q ?? '');
    setCityFilter(params.city ?? '');
    if (params.filters === 'true') setFiltersOpen(true);
  }, [params.q, params.city, params.filters]);
  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedText(text.trim().toLowerCase()),
      300,
    );
    return () => clearTimeout(timeout);
  }, [text]);
  const minPrice = parsePrice(minInput);
  const maxPrice = parsePrice(maxInput);
  const priceError =
    Number.isNaN(minPrice) || Number.isNaN(maxPrice)
      ? 'Enter a valid non-negative price with up to two decimal places.'
      : minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
        ? 'Minimum price must be no greater than maximum price.'
        : null;
  const {
    guesthouses: matches,
    loading,
    cached,
    error,
    retry,
  } = useGuesthouses({
    text: debouncedText,
    field: 'all',
  });
  const { guesthouses: allGuesthouses, loading: allLoading } = useGuesthouses({
    text: '',
    field: 'all',
  });
  const vocabulary = useMemo(
    () => buildVocabulary(allGuesthouses),
    [allGuesthouses],
  );
  const locationMatches = cityFilter
    ? matches.filter(
        (guesthouse) =>
          guesthouse.city.toLowerCase() === cityFilter.toLowerCase(),
      )
    : matches;
  const amenityChoices = Array.from(
    new Map<string, string>(
      [...allGuesthouses.flatMap((item) => item.amenities), ...selectedAmenities]
        .map((amenity): [string, string] => [amenityKey(amenity), amenity.trim()])
        .filter(([key]) => Boolean(key)),
    ).values(),
  ).sort((a, b) => a.localeCompare(b));
  const quickAmenity =
    amenityChoices.find((amenity) => /solar|backup/i.test(amenity)) ??
    amenityChoices[0];
  const quickAmenitySelected = quickAmenity
    ? selectedAmenities.some(
        (item) => amenityKey(item) === amenityKey(quickAmenity),
      )
    : false;
  const toggleAmenity = (amenity: string) => {
    const key = amenityKey(amenity);
    selectionFeedback();
    setSelectedAmenities((current) =>
      current.some((item) => amenityKey(item) === key)
        ? current.filter((item) => amenityKey(item) !== key)
        : [...current, amenity],
    );
  };
  const guesthouses = sortAndFilterGuesthouses(
    locationMatches,
    {
      sort,
      origin: devicePosition,
      minPrice: priceError ? undefined : minPrice,
      maxPrice: priceError ? undefined : maxPrice,
      minRating,
      amenities: selectedAmenities,
    },
  );
  const activeFilterCount =
    Number(Boolean(cityFilter)) +
    Number(minPrice !== undefined) +
    Number(maxPrice !== undefined) +
    Number(minRating > 0) +
    selectedAmenities.length +
    Number(sort !== 'priceAsc');
  const allStaysSelected =
    !text.trim() && activeFilterCount === 0;
  const pending = text.trim().toLowerCase() !== debouncedText || loading;
  const nearby = devicePosition
    ? nearbyGuesthouses(guesthouses, devicePosition, 50)
    : [];
  // Asks for permission and reads the device position. Returns null (and sets a notice) when
  // the position is unavailable. Used by Map View and by the "Nearest to me" sort.
  const findPosition = async (): Promise<Coordinates | null> => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setMapNotice(
          'Location access was not granted. You can keep browsing every guesthouse in List View.',
        );
        return null;
      }
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Location lookup timed out')),
            20000,
          );
        }),
      ]).finally(() => clearTimeout(timeout));
      const position = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setDevicePosition(position);
      return position;
    } catch {
      setMapNotice(
        'Your location is unavailable right now. The guesthouse list is still available.',
      );
      return null;
    }
  };
  const openMap = async () => {
    if (requestingLocation) return;
    setRequestingLocation(true);
    setMapNotice(null);
    try {
      const position = await findPosition();
      setView(position ? 'map' : 'list');
    } finally {
      setRequestingLocation(false);
    }
  };
  const chooseSort = async (value: GuesthouseSort) => {
    if (value !== 'distance' || devicePosition) {
      setSort(value);
      return;
    }
    if (requestingLocation) return;
    setRequestingLocation(true);
    setMapNotice(null);
    try {
      const position = await findPosition();
      // Without a position the sort cannot work, so keep the previous order.
      if (position) setSort('distance');
    } finally {
      setRequestingLocation(false);
    }
  };
  const reset = () => {
    smartRunId.current++;
    queuedSmartSearch.current = false;
    setSmartBusy(false);
    setSort('priceAsc');
    setMinInput('');
    setMaxInput('');
    setMinRating(0);
    setSelectedAmenities([]);
    setCityFilter('');
    setSmartNote('');
    setSmartSelected(false);
    smartFiltersApplied.current = false;
  };
  const runSmartSearch = useCallback(async (queryInput = text, fallbackCity = '') => {
    const query = queryInput.trim();
    if (!query) {
      setSmartNote('Describe what you want, such as “cheap lodge in Maun under P800 with wifi”.');
      return;
    }
    const runId = ++smartRunId.current;
    setSmartBusy(true);
    setSmartNote('');
    try {
      const { plan, source } = await interpretSearch(query, vocabulary);
      if (runId !== smartRunId.current) return;
      if (isEmptyPlan(plan)) {
        setSmartNote('Could not turn that into filters. Showing name and city matches.');
        return;
      }
      const appliedCity = plan.city ?? fallbackCity;
      setCityFilter(appliedCity);
      setMinInput(plan.minPrice === undefined ? '' : String(plan.minPrice));
      setMaxInput(plan.maxPrice === undefined ? '' : String(plan.maxPrice));
      setMinRating(plan.minRating ?? 0);
      setSort(plan.sort ?? 'priceAsc');
      setSelectedAmenities(plan.amenities ?? []);
      setText(plan.name ?? '');
      setSmartSelected(true);
      smartFiltersApplied.current = true;
      const labels = describePlan({ ...plan, city: appliedCity || undefined });
      setSmartNote(`${source === 'ai' ? 'AI search' : 'Smart search'}: ${labels.join(' · ')}`);
    } catch {
      if (runId === smartRunId.current)
        setSmartNote('Smart search is unavailable right now. You can still use the filters.');
    } finally {
      if (runId === smartRunId.current) setSmartBusy(false);
    }
  }, [text, vocabulary]);
  useEffect(() => {
    if (params.smart !== 'true' || allLoading) return;
    const request = params.smartRequest ?? `${params.q ?? ''}|${params.city ?? ''}`;
    if (lastSmartRequest.current === request) return;
    lastSmartRequest.current = request;
    setSmartSelected(true);
    void runSmartSearch(params.q ?? '', params.city ?? '');
  }, [
    allLoading,
    params.city,
    params.q,
    params.smart,
    params.smartRequest,
    runSmartSearch,
  ]);
  useEffect(() => {
    if (allLoading || !queuedSmartSearch.current || !smartSelected) return;
    queuedSmartSearch.current = false;
    void runSmartSearch();
  }, [allLoading, smartSelected, runSmartSearch]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Image
            source={require('../../assets/lala-house-mark.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Lala logo"
          />
          <View>
            <Text style={styles.brand}>Lala</Text>
            <Text style={styles.caption}>Explore</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push('/login')}
            style={styles.profile}
          >
            <AuthIcon name="profile" />
          </Pressable>
        </View>
      </View>
      <View style={styles.discoveryContext}>
        <View style={styles.contextRow}>
          <Feather color={colors.primaryDark} name="map-pin" size={16} />
          <View style={styles.contextCopy}>
            {view === 'list' && (
              <Text style={styles.contextEyebrow}>BOTSWANA EXPLORER</Text>
            )}
            <Text style={styles.contextTitle}>
              {view === 'map' ? 'Near your current location' : 'Curated Guesthouses'}
            </Text>
            {view === 'map' && (
              <Text style={styles.contextSubtitle}>
                {nearby.length} guesthouses within 50 km
              </Text>
            )}
          </View>
          {view === 'list' && (
            <View style={styles.stayCountBadge}>
              <Text style={styles.stayCountText}>
                {pending ? 'Finding…' : `${guesthouses.length} stays`}
              </Text>
            </View>
          )}
          {view === 'map' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open filters and sorting"
              onPress={() => setFiltersOpen(true)}
              style={styles.contextFilter}
            >
              <SearchIcon name="headerFilter" />
            </Pressable>
          )}
        </View>
        <View style={styles.viewSwitch}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="List View"
            accessibilityState={{ selected: view === 'list' }}
            onPress={() => setView('list')}
            style={[styles.viewOption, view === 'list' && styles.viewSelected]}
          >
            <Feather color={view === 'list' ? colors.white : colors.textMuted} name="list" size={14} />
            <Text style={[styles.viewText, view === 'list' && styles.viewSelectedText]}>List View</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Map View"
            accessibilityState={{ selected: view === 'map', disabled: requestingLocation }}
            disabled={requestingLocation}
            onPress={() => void openMap()}
            style={[styles.viewOption, view === 'map' && styles.viewSelected]}
          >
            <Feather color={view === 'map' ? colors.white : colors.textMuted} name="map" size={14} />
            <Text style={[styles.viewText, view === 'map' && styles.viewSelectedText]}>
              {requestingLocation ? 'Locating…' : 'Map View'}
            </Text>
          </Pressable>
        </View>
        {mapNotice && (
          <Text accessibilityRole="alert" style={styles.mapNotice}>{mapNotice}</Text>
        )}
      </View>
      {view === 'list' && <View style={styles.searchZone}>
        <View style={styles.searchBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Browse"
            onPress={() => router.navigate('/')}
            style={styles.back}
          >
            <SearchIcon name="back" />
          </Pressable>
          <TextInput
            accessibilityLabel="Search guesthouses"
            placeholder="Search stays"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => {
              if (smartSelected && !smartFiltersApplied.current) {
                if (allLoading) queuedSmartSearch.current = true;
                else void runSmartSearch();
              }
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {text.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear query"
              onPress={() => setText('')}
              style={styles.clear}
            >
              <SearchIcon name="clear" />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Smart search: turn your sentence into filters"
            accessibilityState={{
              busy: smartBusy,
              selected: smartSelected,
            }}
            onPress={() => {
              if (smartSelected) {
                if (smartFiltersApplied.current) {
                  reset();
                  setText('');
                } else {
                  smartRunId.current++;
                  queuedSmartSearch.current = false;
                  lastSmartRequest.current =
                    params.smartRequest ?? `${params.q ?? ''}|${params.city ?? ''}`;
                  setSmartBusy(false);
                  setSmartSelected(false);
                  setSmartNote('');
                }
              } else {
                setSmartSelected(true);
                if (allLoading && text.trim()) {
                  queuedSmartSearch.current = true;
                  setSmartNote('Loading guesthouses before smart search…');
                } else {
                  void runSmartSearch();
                }
              }
            }}
            style={[
              styles.smartSearchAction,
              smartSelected && styles.smartSearchActionSelected,
            ]}
          >
            {smartBusy ? (
              <ActivityIndicator
                color={smartSelected ? colors.white : colors.primary}
                size="small"
              />
            ) : (
              <Ionicons
                color={smartSelected ? colors.white : colors.primaryDark}
                name="sparkles"
                size={14}
              />
            )}
            <Text style={[
              styles.smartSearchActionText,
              smartSelected && styles.smartSearchActionTextSelected,
            ]}>
              {smartBusy ? 'Working…' : 'Smart'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open filters and sorting"
            onPress={() => setFiltersOpen(true)}
            style={styles.searchFilterAction}
          >
            <Feather color={colors.textMuted} name="sliders" size={15} />
            {activeFilterCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>
                  {activeFilterCount > 9 ? '9+' : activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFilters}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show all stays"
            accessibilityState={{ selected: allStaysSelected }}
            onPress={() => {
              selectionFeedback();
              reset();
              setText('');
            }}
            style={[styles.quickChip, allStaysSelected && styles.quickChipSelected]}
          >
            <Text style={[styles.quickChipText, allStaysSelected && styles.quickChipTextSelected]}>
              All Stays
            </Text>
          </Pressable>
          {quickAmenity && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${quickAmenity}`}
              accessibilityState={{ selected: quickAmenitySelected }}
              onPress={() => toggleAmenity(quickAmenity)}
              style={[
                styles.quickChip,
                quickAmenitySelected && styles.quickChipSelected,
              ]}
            >
              <Feather
                color={quickAmenitySelected ? colors.white : colors.accent}
                name={/solar|backup/i.test(quickAmenity) ? 'zap' : 'check'}
                size={13}
              />
              <Text style={[styles.quickChipText, quickAmenitySelected && styles.quickChipTextSelected]}>
                {quickAmenity}
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter stays under P350 per night"
            accessibilityState={{ selected: maxInput === '350' }}
            onPress={() => {
              selectionFeedback();
              if (minPrice !== undefined && minPrice > 350) setMinInput('');
              setMaxInput((current) => (current === '350' ? '' : '350'));
            }}
            style={[styles.quickChip, maxInput === '350' && styles.quickChipSelected]}
          >
            <Text style={[styles.quickChipText, maxInput === '350' && styles.quickChipTextSelected]}>
              Under P350
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sort by top rated"
            accessibilityState={{ selected: sort === 'rating' }}
            onPress={() => {
              selectionFeedback();
              setSort((current) => (current === 'rating' ? 'priceAsc' : 'rating'));
            }}
            style={[styles.quickChip, sort === 'rating' && styles.quickChipSelected]}
          >
            <Feather color={sort === 'rating' ? colors.white : colors.accent} name="star" size={13} />
            <Text style={[styles.quickChipText, sort === 'rating' && styles.quickChipTextSelected]}>
              Top Rated
            </Text>
          </Pressable>
        </ScrollView>
      </View>}
      {view === 'map' && devicePosition && !pending && !error ? (
        <ExploreMapView
          items={nearby}
          position={devicePosition}
          onMapError={() => {
            setView('list');
            setMapNotice('Map unavailable. You can keep browsing in List View.');
          }}
          onShowList={() => setView('list')}
        />
      ) : (
      <ScrollView
        contentContainerStyle={styles.results}
        keyboardShouldPersistTaps="handled"
      >
        {cached && !pending && !error && <ConnectionNotice onRetry={retry} />}
        {!!smartNote && (
          <View accessibilityRole="alert" style={styles.smartNote}>
            <Text style={styles.smartNoteText}>{smartNote}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear smart search"
              onPress={() => {
                reset();
                setText('');
              }}
            >
              <SearchIcon name="clear" />
            </Pressable>
          </View>
        )}
        {!!cityFilter && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${cityFilter} location filter`}
            onPress={() => setCityFilter('')}
            style={styles.cityChip}
          >
            <Text style={styles.cityChipText}>{cityFilter}</Text>
            <SearchIcon name="clear" />
          </Pressable>
        )}
        {selectedAmenities.length > 0 && (
          <View style={styles.activeAmenities}>
            {selectedAmenities.map((amenity) => (
              <Pressable
                key={amenityKey(amenity)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${amenity} filter`}
                onPress={() => toggleAmenity(amenity)}
                style={styles.cityChip}
              >
                <Text style={styles.cityChipText}>{amenity}</Text>
                <SearchIcon name="clear" />
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.headingRow}>
          <Text style={styles.resultsTitle}>
            {pending
              ? 'Finding stays…'
              : `Showing ${guesthouses.length} ${guesthouses.length === 1 ? 'stay' : 'stays'}${cityFilter ? ` in ${cityFilter}` : ''}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change guesthouse sort order"
            onPress={() => setFiltersOpen(true)}
            style={styles.sortLink}
          >
            <Text style={styles.sortLinkText}>
              {sort === 'rating'
                ? 'Sort by Rating'
                : sort === 'distance'
                  ? 'Nearest first'
                  : 'Sort by Price'}
            </Text>
            <Feather color={colors.accent} name="chevron-down" size={13} />
          </Pressable>
        </View>
        {pending ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.body}>Loading guesthouses</Text>
          </View>
        ) : error ? (
          <View accessibilityRole="alert" style={styles.state}>
            <Text style={styles.sectionTitle}>Unable to load guesthouses</Text>
            <Text style={styles.body}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={retry}
              style={styles.action}
            >
              <Text style={styles.actionText}>Try again</Text>
            </Pressable>
          </View>
        ) : guesthouses.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.sectionTitle}>No guesthouses found</Text>
            <Text style={styles.body}>
              Try a different name or city, or reset your filters.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                reset();
                setText('');
              }}
              style={styles.action}
            >
              <Text style={styles.actionText}>Clear search and filters</Text>
            </Pressable>
          </View>
        ) : (
          guesthouses.map((guesthouse) => (
            <GuesthouseCard
              compact
              key={guesthouse.id}
              guesthouse={guesthouse}
              {...(sort === 'distance' && devicePosition && guesthouse.location
                ? {
                    distanceLabel: formatDistance(
                      distanceKm(devicePosition, guesthouse.location),
                    ),
                  }
                : {})}
            />
          ))
        )}
      </ScrollView>
      )}
      {filtersOpen && (
        <View style={styles.overlay}>
          <Pressable
            style={styles.scrim}
            accessibilityRole="button"
            accessibilityLabel="Dismiss filters"
            onPress={() => setFiltersOpen(false)}
          />
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeading}>
                <View style={styles.iconCircle}>
                  <SearchIcon name="filter" />
                </View>
                <Text style={styles.sheetTitle}>Filters & Sorting</Text>
              </View>
              <View style={styles.row}>
                <Pressable accessibilityRole="button" onPress={reset}>
                  <Text style={styles.reset}>Reset All</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close filters"
                  onPress={() => setFiltersOpen(false)}
                  style={styles.close}
                >
                  <SearchIcon name="close" />
                </Pressable>
              </View>
            </View>
            <ScrollView
              contentContainerStyle={styles.filterContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.section}>
                <View style={styles.headingRow}>
                  <Text style={styles.sectionTitle}>Sort By</Text>
                  <Text style={styles.hint}>Reordered instantly</Text>
                </View>
                <View style={styles.sortGrid}>
                  {sorts.map((item) => (
                    <Pressable
                      key={item.value}
                      accessibilityRole="radio"
                      accessibilityLabel={item.label}
                      accessibilityState={{ checked: sort === item.value }}
                      onPress={() => void chooseSort(item.value)}
                      style={[
                        styles.sortOption,
                        sort === item.value && styles.selectedChip,
                      ]}
                    >
                      <View style={styles.sortCopy}>
                        <Text
                          style={[
                            styles.sortText,
                            sort === item.value && styles.selectedText,
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.hint,
                            sort === item.value && styles.selectedText,
                          ]}
                        >
                          {item.caption}
                        </Text>
                      </View>
                      {sort === item.value ? (
                        <View style={styles.check}>
                          <SearchIcon name="check" />
                        </View>
                      ) : item.value === 'rating' ? (
                        <SearchIcon name="star" />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.priceSection}>
                <View style={styles.headingRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Nightly Rate</Text>
                    <Text style={styles.hint}>In Botswana Pula (BWP)</Text>
                  </View>
                  <Text style={styles.priceBadge}>
                    {priceError
                      ? 'Check range'
                      : `P ${minPrice ?? 0} – ${maxPrice === undefined ? 'Any' : `P ${maxPrice}`}`}
                  </Text>
                </View>
                <PriceRange
                  minimum={priceError ? 0 : (minPrice ?? 0)}
                  maximum={priceError ? undefined : maxPrice}
                  prices={matches.map((item) => item.pricePerNight)}
                  onMinimum={(price) => setMinInput(String(price))}
                  onMaximum={(price) =>
                    setMaxInput(price === undefined ? '' : String(price))
                  }
                />
                <View style={styles.priceInputs}>
                  <View style={styles.priceField}>
                    <Text style={styles.hint}>Min: P</Text>
                    <TextInput
                      accessibilityLabel="Minimum nightly price"
                      keyboardType="decimal-pad"
                      value={minInput}
                      onChangeText={setMinInput}
                      placeholder="0"
                      style={styles.priceInput}
                    />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={styles.hint}>Max: P</Text>
                    <TextInput
                      accessibilityLabel="Maximum nightly price"
                      keyboardType="decimal-pad"
                      value={maxInput}
                      onChangeText={setMaxInput}
                      placeholder="Any"
                      style={styles.priceInput}
                    />
                  </View>
                </View>
                {priceError && (
                  <Text accessibilityRole="alert" style={styles.reset}>
                    {priceError}
                  </Text>
                )}
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Guest Experience Rating</Text>
                <Text style={styles.hint}>Ratings from guest reviews</Text>
                <View style={styles.ratingRow}>
                  {[0, 3.5, 4, 4.5].map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityLabel={
                        value ? `Minimum rating ${value}` : 'Any rating'
                      }
                      accessibilityState={{ checked: value === minRating }}
                      onPress={() => setMinRating(value)}
                      style={[
                        styles.chip,
                        value === minRating && styles.selectedChip,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          value === minRating && styles.selectedText,
                        ]}
                      >
                        {value ? `${value.toFixed(1)}+` : 'Any'}
                      </Text>
                      {value > 0 && (
                        <SearchIcon
                          name={
                            value === minRating
                              ? 'ratingStar'
                              : 'ratingStarMuted'
                          }
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.section}>
                <View style={styles.headingRow}>
                  <Text style={styles.sectionTitle}>Amenities</Text>
                  <Text style={styles.hint}>Match all selected</Text>
                </View>
                {amenityChoices.length ? (
                  <View style={styles.amenityChips}>
                    {amenityChoices.map((amenity) => {
                      const selected = selectedAmenities.some(
                        (item) => amenityKey(item) === amenityKey(amenity),
                      );
                      return (
                        <Pressable
                          key={amenityKey(amenity)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={amenity}
                          accessibilityState={{ checked: selected }}
                          onPress={() => toggleAmenity(amenity)}
                          style={[
                            styles.amenityChip,
                            selected && styles.selectedChip,
                          ]}
                        >
                          <Text style={[styles.chipText, selected && styles.selectedText]}>
                            {amenity}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.hint}>No amenities listed for these guesthouses.</Text>
                )}
              </View>
            </ScrollView>
            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={!!priceError || pending || !!error}
                accessibilityState={{
                  disabled: !!priceError || pending || !!error,
                }}
                onPress={() => setFiltersOpen(false)}
                style={[
                  styles.action,
                  (!!priceError || pending || !!error) && styles.disabled,
                ]}
              >
                <SearchIcon name="show" />
                <Text style={styles.actionText}>
                  {pending
                    ? 'Searching…'
                    : `Show ${guesthouses.length} Guesthouses`}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
