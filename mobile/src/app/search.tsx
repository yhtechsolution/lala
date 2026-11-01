import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthIcon } from '../components/AuthIcon';
import { GuesthouseCard } from '../components/GuesthouseCard';
import { ConnectionNotice } from '../components/ConnectionNotice';
import { PriceRange } from '../components/PriceRange';
import { SearchIcon } from '../components/SearchIcon';
import { useGuesthouses } from '../hooks/useGuesthouses';
import {
  distanceKm,
  GuesthouseSort,
  sortAndFilterGuesthouses,
} from '../services/guesthouses';
import {
  buildVocabulary,
  describePlan,
  isEmptyPlan,
} from '../services/smartSearch';
import { interpretSearch } from '../services/smartSearchAi';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { formatDistance } from '../services/distance';
import { styles } from '../styles/SearchScreen.styles';
import { colors } from '../theme';

const sorts: { value: GuesthouseSort; label: string; caption: string }[] = [
  {
    value: 'priceAsc',
    label: 'Price: Low to High',
    caption: 'Best value first',
  },
  { value: 'rating', label: 'Top Rated', caption: 'Guest favorites' },
  {
    value: 'priceDesc',
    label: 'Price: High to Low',
    caption: 'Highest price first',
  },
  { value: 'distance', label: 'Nearest to Me', caption: 'Closest first' },
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
  }>();
  const [text, setText] = useState(params.q ?? '');
  const [cityFilter, setCityFilter] = useState(params.city ?? '');
  const [debouncedText, setDebouncedText] = useState(text);
  const [sort, setSort] = useState<GuesthouseSort>('priceAsc');
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(params.filters === 'true');
  const [amenityFilter, setAmenityFilter] = useState<string[]>([]);
  const [smartBusy, setSmartBusy] = useState(false);
  const [smartNote, setSmartNote] = useState('');
  const {
    coords: origin,
    status: locationStatus,
    locate,
  } = useCurrentLocation();
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
  // Unfiltered listings supply the cities and amenities smart search may choose from.
  // Same Firestore query as above, so no extra reads.
  const { guesthouses: everyGuesthouse, loading: allLoading } = useGuesthouses({
    text: '',
    field: 'all',
  });
  const vocabulary = useMemo(
    () => buildVocabulary(everyGuesthouse),
    [everyGuesthouse],
  );
  const guesthouses = sortAndFilterGuesthouses(
    cityFilter
      ? matches.filter(
          (guesthouse) =>
            guesthouse.city.toLowerCase() === cityFilter.toLowerCase(),
        )
      : matches,
    {
      sort,
      minPrice: priceError ? undefined : minPrice,
      maxPrice: priceError ? undefined : maxPrice,
      minRating,
      amenities: amenityFilter,
      origin,
    },
  );
  const pending = text.trim().toLowerCase() !== debouncedText || loading;
  const reset = () => {
    setSort('priceAsc');
    setMinInput('');
    setMaxInput('');
    setMinRating(0);
    setCityFilter('');
    setAmenityFilter([]);
    setSmartNote('');
  };

  // Reads the sentence in the search box and applies it as ordinary filters.
  const runSmartSearch = async () => {
    const query = text.trim();
    if (!query) {
      setSmartNote(
        'Describe what you want, e.g. "cheap lodge in Maun under P800 with wifi".',
      );
      return;
    }
    setSmartBusy(true);
    setSmartNote('');
    try {
      const { plan, source } = await interpretSearch(query, vocabulary);
      if (isEmptyPlan(plan)) {
        setSmartNote(
          'Could not turn that into filters. Showing name and city matches.',
        );
        return;
      }
      setCityFilter(plan.city ?? '');
      setMinInput(plan.minPrice === undefined ? '' : String(plan.minPrice));
      setMaxInput(plan.maxPrice === undefined ? '' : String(plan.maxPrice));
      setMinRating(plan.minRating ?? 0);
      setSort(plan.sort ?? 'priceAsc');
      setAmenityFilter(plan.amenities ?? []);
      setText(plan.name ?? '');
      setSmartNote(
        `${source === 'ai' ? 'AI search' : 'Smart search'}: ${describePlan(plan).join(' · ')}`,
      );
    } finally {
      setSmartBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Image
            source={require('../../assets/search/logo.png')}
            style={styles.logo}
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
            accessibilityLabel="Open filters and sorting in header"
            onPress={() => setFiltersOpen(true)}
            style={styles.back}
          >
            <SearchIcon name="headerFilter" />
          </Pressable>
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
      <View style={styles.searchZone}>
        <View style={styles.searchBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Browse"
            onPress={() => router.navigate('/')}
            style={styles.back}
          >
            <SearchIcon name="back" />
          </Pressable>
          <SearchIcon name="search" />
          <TextInput
            accessibilityLabel="Search guesthouses"
            placeholder="Search by name or city"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            value={text}
            onChangeText={setText}
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
        </View>
        <View style={styles.controls}>
          <Text style={styles.hint}>
            {sort === 'distance' && locationStatus === 'locating'
              ? 'Finding your location…'
              : sort === 'distance' && locationStatus === 'denied'
                ? 'Location permission denied. Showing cheapest first.'
                : sort === 'distance' && locationStatus === 'error'
                  ? 'Could not get your location. Showing cheapest first.'
                  : sorts.find((item) => item.value === sort)?.label}
          </Text>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Smart search: turn your sentence into filters"
              accessibilityState={{ busy: smartBusy, disabled: smartBusy }}
              disabled={smartBusy || allLoading}
              onPress={runSmartSearch}
              style={[styles.filterButton, styles.smartButton]}
            >
              {smartBusy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={colors.primaryDark}
                />
              )}
              <Text style={styles.chipText}>
                {smartBusy ? 'Thinking…' : 'Smart search'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open filters and sorting"
              onPress={() => setFiltersOpen(true)}
              style={styles.filterButton}
            >
              <SearchIcon name="filter" />
              <Text style={styles.chipText}>Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
        <View style={styles.headingRow}>
          <Text style={styles.resultsTitle}>Discover guesthouses</Text>
          <Text style={styles.count}>
            {pending ? 'Searching…' : `${guesthouses.length} available`}
          </Text>
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
              distanceLabel={
                sort === 'distance' && origin && guesthouse.location
                  ? formatDistance(distanceKm(origin, guesthouse.location))
                  : undefined
              }
            />
          ))
        )}
      </ScrollView>
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
                      onPress={() => {
                        setSort(item.value);
                        if (item.value === 'distance') void locate();
                      }}
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
