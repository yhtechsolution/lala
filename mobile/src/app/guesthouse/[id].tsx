import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthIcon } from '../../components/AuthIcon';
import { DetailIcon, DetailIconName } from '../../components/DetailIcon';
import {
  CustomerNotice,
  CustomerNoticeState,
} from '../../components/CustomerNotice';
import { RatingSheet } from '../../components/RatingSheet';
import { ConnectionNotice } from '../../components/ConnectionNotice';
import { ContactGuesthouseSheet } from '../../components/ContactGuesthouseSheet';
import { LeafletMap } from '../../components/LeafletMap';
import { useAuth } from '../../context/AuthContext';
import { useFavourites } from '../../context/FavouritesContext';
import { useGuesthouseDetails } from '../../hooks/useGuesthouseDetails';
import { useGuesthouses } from '../../hooks/useGuesthouses';
import { GuesthouseCard } from '../../components/GuesthouseCard';
import { recordView } from '../../services/recentlyViewed';
import { similarGuesthouses } from '../../services/similar';
import { GuesthouseDetails } from '../../services/guesthouseDetails';
import { engagementErrorMessage } from '../../services/customerEngagement';
import { selectionFeedback } from '../../services/selectionFeedback';
import { styles } from '../../styles/GuesthouseDetails.styles';
import { styles as header } from '../../styles/SearchScreen.styles';
import { colors } from '../../theme';

// Fall back to Browse for direct links that have no navigation history.
function back() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// Use matching original Figma amenity vectors; unknown amenities retain their text.
function amenityIcon(name: string): DetailIconName | null {
  if (/wi-?fi|internet/i.test(name)) return 'wifi';
  if (/air.condition|\bac\b/i.test(name)) return 'ac';
  if (/pool/i.test(name)) return 'pool';
  if (/parking/i.test(name)) return 'parking';
  if (/breakfast/i.test(name)) return 'breakfast';
  if (/kitchen|catering/i.test(name)) return 'kitchen';
  return null;
}

// Reset gallery and action state whenever a different record is opened.
function DetailContent({
  guesthouse: g,
  cached,
  onRetry,
}: {
  guesthouse: GuesthouseDetails;
  cached: boolean;
  onRetry: () => void;
}) {
  const photos = g.galleryUrls.length
    ? g.galleryUrls
    : g.logoUrl
      ? [g.logoUrl]
      : [];
  const [photo, setPhoto] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [notice, setNotice] = useState<CustomerNoticeState | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  // Setswana text is shown only when an admin has provided it.
  const [language, setLanguage] = useState<'en' | 'tn'>('en');
  const { guesthouses: everyGuesthouse } = useGuesthouses({
    text: '',
    field: 'all',
  });
  // Remember this visit on the device so Browse can show "Recently viewed".
  useEffect(() => {
    void recordView(g.id);
  }, [g.id]);
  const similar = useMemo(
    () => similarGuesthouses(g, everyGuesthouse, 3),
    [g, everyGuesthouse],
  );
  const [contactOpen, setContactOpen] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const advancePhoto = (direction: number) => {
    if (photos.length < 2) return;
    selectionFeedback();
    setPhoto((current) => (current + direction + photos.length) % photos.length);
  };
  const photoSwipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          photos.length > 1 &&
          Math.abs(gesture.dx) > 14 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -45) advancePhoto(1);
          if (gesture.dx > 45) advancePhoto(-1);
        },
      }),
    [photos.length],
  );
  const { user, initializing } = useAuth();
  const favourites = useFavourites();
  const index = Math.min(photo, Math.max(0, photos.length - 1));
  const uri = photos[index];
  const price = `P ${g.pricePerNight.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const address = [g.contact.address, g.city, g.country]
    .filter(Boolean)
    .join(', ');
  const mapUrl = g.location
    ? `https://www.google.com/maps/search/?api=1&query=${g.location.lat},${g.location.lng}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;
  const directionsUrl = g.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${g.location.lat},${g.location.lng}`)}&dir_action=navigate`
    : null;
  const mapListing = useMemo(
    () =>
      g.location
        ? [{ id: g.id, name: g.name, pricePerNight: g.pricePerNight, location: g.location }]
        : [],
    [g.id, g.name, g.pricePerNight, g.location?.lat, g.location?.lng],
  );
  const saved = favourites.ids.includes(g.id);
  const saving = favourites.pending.includes(g.id);
  const busy =
    initializing ||
    saving ||
    (Boolean(user) && favourites.loading);
  // External actions report unsupported handlers instead of leaving rejected promises.
  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setNotice({
        title: 'Unable to open this link',
        message: 'Please use the contact details shown on this page.',
      });
    }
  }
  async function save() {
    if (!user) {
      setNotice({
        title: 'Sign in to save favourites',
        message: 'Sign in to keep this guesthouse in My Favourites.',
        login: true,
      });
      return;
    }
    try {
      selectionFeedback();
      await favourites.toggle(g.id);
    } catch (error) {
      setNotice({
        title: 'Unable to save favourite',
        message: engagementErrorMessage(error),
      });
    }
  }
  async function share() {
    try {
      await Share.share({
        title: g.name,
        message: `${g.name}\n${address}\n${price} / night${mapUrl ? `\n${mapUrl}` : ''}`,
      });
    } catch {
      setNotice({
        title: 'Unable to share',
        message:
          'Sharing is not available on this device. You can use the contact details below.',
      });
    }
  }
  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroPhoto} {...photoSwipe.panHandlers}>
            {uri && !failed.includes(uri) ? (
              <Image
                source={{ uri }}
                style={styles.photo}
                resizeMode="cover"
                accessibilityLabel={`${g.name} photo ${index + 1}`}
                onError={() => setFailed((items) => [...items, uri])}
              />
            ) : (
              <View style={styles.fallback}>
                <DetailIcon name="photos" />
                <Text style={styles.small}>Photo unavailable</Text>
              </View>
            )}
          </View>
          <View style={styles.heroControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to results"
              style={styles.circle}
              onPress={back}
            >
              <DetailIcon name="back" />
            </Pressable>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share guesthouse"
                style={styles.circle}
                onPress={share}
              >
                <DetailIcon name="share" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? 'Remove from favourites' : 'Save to favourites'
                }
                accessibilityState={{ selected: saved, busy: saving, disabled: busy }}
                disabled={busy}
                style={({ pressed }) => [
                  styles.circle,
                  saved && styles.saved,
                  pressed && styles.circlePressed,
                ]}
                onPress={save}
              >
                {saving ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Ionicons
                    color={saved ? colors.primary : colors.primaryDark}
                    name={saved ? 'heart' : 'heart-outline'}
                    size={21}
                  />
                )}
              </Pressable>
            </View>
          </View>
          <View style={styles.counter}>
            <DetailIcon name="photos" />
            <Text style={styles.label}>
              {photos.length
                ? `${index + 1}/${photos.length} Photos`
                : 'No photos yet'}
            </Text>
          </View>
          {photos.length > 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next guesthouse photo"
              style={styles.next}
              onPress={() => advancePhoto(1)}
            >
              <Text style={styles.link}>Next photo →</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.content}>
          {cached && (
            <ConnectionNotice
              message="Showing saved guesthouse details. Check your connection to refresh."
              onRetry={onRetry}
            />
          )}
          <View style={styles.section}>
            <View style={styles.rating}>
              <DetailIcon name="star" />
              <Text style={styles.ratingText}>
                {g.ratingCount
                  ? `${g.averageRating.toFixed(1)} / 5.0 (${g.ratingCount} ratings)`
                  : 'New · No ratings yet'}
              </Text>
            </View>
            <Text accessibilityRole="header" style={styles.title}>
              {g.name}
            </Text>
            <View style={styles.row}>
              <DetailIcon name="pin" />
              <Text style={[styles.small, styles.flex]}>
                {address || 'Location not provided'}
              </Text>
            </View>
            <View style={styles.ratePanel}>
              <View style={styles.flex}>
                <View style={styles.row}>
                  <Text style={styles.price}>{price}</Text>
                  <Text style={styles.label}>/ night</Text>
                </View>
                <Text style={styles.small}>
                  Direct owner rate • No booking fees charged by Lala
                </Text>
              </View>
              <View style={styles.shield}>
                <DetailIcon name="shield" />
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.between}>
              <Text style={styles.heading}>Key Amenities</Text>
              <Text style={styles.link}>Included in Stay</Text>
            </View>
            {g.amenities.length ? (
              <View style={styles.grid}>
                {g.amenities.map((name) => (
                  <View key={name} style={styles.amenity}>
                    {amenityIcon(name) && (
                      <DetailIcon name={amenityIcon(name)!} />
                    )}
                    <Text style={[styles.small, styles.flex]}>{name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.small}>
                Amenities have not been provided.
              </Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.heading}>Property Information</Text>
            <View style={styles.specs}>
              {[
                ['Rooms', g.numberOfRooms?.toString()],
                ['Check-in', g.checkInTime],
                ['Check-out', g.checkOutTime],
              ].map(([label, value]) => (
                <View key={label} style={styles.spec}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={[styles.small, styles.centered]}>
                    {value || 'Ask host'}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.panel}>
              {!!g.descriptionTn && (
                <View style={styles.languageRow}>
                  {(
                    [
                      ['en', 'English'],
                      ['tn', 'Setswana'],
                    ] as const
                  ).map(([code, label]) => (
                    <Pressable
                      key={code}
                      accessibilityRole="radio"
                      accessibilityLabel={`Show description in ${label}`}
                      accessibilityState={{ checked: language === code }}
                      onPress={() => setLanguage(code)}
                      style={[
                        styles.languageChip,
                        language === code && styles.languageChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.languageText,
                          language === code && styles.languageTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <Text style={styles.body}>
                {language === 'tn' && g.descriptionTn
                  ? g.descriptionTn
                  : g.description || 'A description has not been provided yet.'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compare this guesthouse with another"
              onPress={() =>
                router.push({ pathname: '/compare', params: { a: g.id } })
              }
              style={styles.compareButton}
            >
              <Text style={styles.compareText}>Compare with another stay</Text>
            </Pressable>
            <View style={styles.rules}>
              <Text style={styles.heading}>House Rules</Text>
              <Text style={styles.small}>
                {g.houseRules || 'Contact the guesthouse for its house rules.'}
              </Text>
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.between}>
              <Text style={styles.heading}>Location & Surroundings</Text>
              <Text style={styles.small}>{g.city}</Text>
            </View>
            {g.location && !mapFailed ? (
              <View style={styles.detailMap}>
                <LeafletMap
                  height={176}
                  listings={mapListing}
                  selectedId={g.id}
                  onError={() => setMapFailed(true)}
                />
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open guesthouse location in maps"
                  onPress={() => mapUrl && open(mapUrl)}
                  style={styles.mapOverlay}
                >
                  <DetailIcon name="pin" />
                  <View style={styles.flex}>
                    <Text numberOfLines={1} style={styles.mapOverlayTitle}>
                      {address || g.name}
                    </Text>
                    <Text style={styles.small}>Open location in maps</Text>
                  </View>
                  <DetailIcon name="external" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.location}>
                <Text style={styles.body}>
                  {address || 'Location not provided'}
                </Text>
                <Text style={styles.small}>
                  {mapFailed
                    ? 'The map is unavailable right now.'
                    : 'Exact coordinates have not been provided.'}
                </Text>
                {mapUrl && (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Open guesthouse location in maps"
                    style={styles.mapAction}
                    onPress={() => open(mapUrl)}
                  >
                    <Text style={[styles.link, styles.flex]}>Open location in maps</Text>
                    <DetailIcon name="external" />
                  </Pressable>
                )}
              </View>
            )}
            {directionsUrl && (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Get directions to ${g.name}`}
                onPress={() => open(directionsUrl)}
                style={styles.directionsButton}
              >
                <Text style={styles.directionsText}>Get Directions</Text>
              </Pressable>
            )}
          </View>
          {similar.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.heading}>Similar stays</Text>
              {similar.map((item) => (
                <GuesthouseCard compact key={item.id} guesthouse={item} />
              ))}
            </View>
          )}
          <View style={styles.section}>
            <Text style={styles.heading}>Contact Guesthouse</Text>
            <View style={styles.panel}>
              {Object.entries(g.contact).length ? (
                Object.entries(g.contact).map(([key, value]) => (
                  <View key={key} style={styles.section}>
                    <Text style={styles.label}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    {key === 'phone' && /[0-9]/.test(value) ? (
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={`Call ${value}`}
                        onPress={() =>
                          open(`tel:${value.replace(/[^+\d]/g, '')}`)
                        }
                      >
                        <Text selectable style={styles.link}>
                          {value}
                        </Text>
                      </Pressable>
                    ) : key === 'email' &&
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? (
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={`Email ${value}`}
                        onPress={() =>
                          open(`mailto:${encodeURIComponent(value)}`)
                        }
                      >
                        <Text selectable style={styles.link}>
                          {value}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text selectable style={styles.body}>
                        {value}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.small}>
                  Contact details have not been provided yet.
                </Text>
              )}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.heading}>Guest Ratings</Text>
            <View style={styles.panel}>
              <Text style={styles.body}>
                {g.ratingCount
                  ? `${g.averageRating.toFixed(1)} out of 5 · ${g.ratingCount} ratings`
                  : 'Be the first to rate this guesthouse.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (user) setRatingOpen(true);
                  else
                    setNotice({
                      title: 'Sign in to rate your stay',
                      message: 'Sign in to share your guesthouse rating.',
                      login: true,
                    });
                }}
              >
                <Text style={styles.link}>Rate your stay</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View>
          <Text style={styles.label}>Nightly direct rate</Text>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.small}>/ night</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Contact Guesthouse"
          style={styles.button}
          onPress={() => setContactOpen(true)}
        >
          <DetailIcon name="contact" />
          <Text style={styles.buttonText}>Contact Guesthouse</Text>
        </Pressable>
      </View>
      <CustomerNotice notice={notice} onClose={() => setNotice(null)} />
      <ContactGuesthouseSheet
        guesthouse={g}
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        onOpen={(url) => void open(url)}
      />
      {ratingOpen && (
        <RatingSheet guesthouse={g} onClose={() => setRatingOpen(false)} />
      )}
    </>
  );
}

// Public detail route works from list navigation and direct links alike.
export default function GuesthouseDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { guesthouse, loading, cached, error, retry } =
    useGuesthouseDetails(id);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={header.header}>
        <View style={header.row}>
          <Image
            source={require('../../../assets/lala-house-mark.png')}
            style={header.logo}
            resizeMode="contain"
            accessibilityLabel="Lala logo"
          />
          <View>
            <Text style={header.brand}>Lala</Text>
            <Text style={header.caption}>Home</Text>
          </View>
        </View>
        <View style={header.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={header.profile}
            onPress={() => router.push('/login')}
          >
            <AuthIcon name="profile" />
          </Pressable>
        </View>
      </View>
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.body}>Loading guesthouse…</Text>
        </View>
      ) : error || !guesthouse ? (
        <View style={styles.state}>
          <Text accessibilityRole="header" style={styles.heading}>
            {error ? 'Unable to load guesthouse' : 'Guesthouse not found'}
          </Text>
          <Text style={styles.body}>
            {error || 'This listing may have been removed.'}
          </Text>
          {error && (
            <Pressable
              accessibilityRole="button"
              style={styles.stateButton}
              onPress={retry}
            >
              <Text style={styles.link}>Try again</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            style={styles.stateButton}
            onPress={back}
          >
            <Text style={styles.link}>Back to results</Text>
          </Pressable>
        </View>
      ) : (
        <DetailContent
          key={id}
          guesthouse={guesthouse}
          cached={cached}
          onRetry={retry}
        />
      )}
    </SafeAreaView>
  );
}
