import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { styles } from '../styles/GuesthouseCard.styles';
import { styles as searchStyles } from '../styles/SearchScreen.styles';

import { Guesthouse } from '../types/guesthouse';
import { useAuth } from '../context/AuthContext';
import { useFavourites } from '../context/FavouritesContext';
import { engagementErrorMessage } from '../services/customerEngagement';
import { CustomerNotice, CustomerNoticeState } from './CustomerNotice';
import { RatingSheet } from './RatingSheet';
import { colors } from '../theme';

type GuesthouseCardProps = {
  guesthouse: Guesthouse;
  // Editorial cards use the larger layout shown in the top-rated section.
  editorial?: boolean;
  compact?: boolean;
  // Shown on search results when sorting by distance, e.g. "3.2 km away".
  distanceLabel?: string;
};

// Displays one reusable guesthouse card and reports favourite changes to its parent screen.
export function GuesthouseCard({
  guesthouse,
  editorial = false,
  compact = false,
  distanceLabel,
}: GuesthouseCardProps) {
  const { user, initializing } = useAuth();
  const {
    ids,
    loading: favouritesLoading,
    pending,
    toggle,
    retry,
  } = useFavourites();
  const openDetails = () =>
    router.push({
      pathname: '/guesthouse/[id]',
      params: { id: guesthouse.id },
    });
  const saved = ids.includes(guesthouse.id);
  const saving = pending.includes(guesthouse.id);
  const [notice, setNotice] = useState<CustomerNoticeState | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const requestLogin = (action: string) =>
    setNotice({
      title: `Sign in to ${action}`,
      message:
        'Create an account or sign in to save your favourite stays and share your ratings.',
      login: true,
    });
  const onToggleSaved = async () => {
    if (!user) {
      requestLogin('save favourites');
      return;
    }
    try {
      await toggle(guesthouse.id);
    } catch (cause) {
      setNotice({
        title: 'Unable to save favourite',
        message: engagementErrorMessage(cause),
      });
      retry();
    }
  };
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [guesthouse.imageUrl]);
  const tags = guesthouse.amenities.slice(0, 3);
  const price = `P ${guesthouse.pricePerNight.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  // Search uses Figma's horizontal result preview; Browse keeps its full card.
  if (compact)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${guesthouse.name}`}
        onPress={openDetails}
        style={searchStyles.resultCard}
      >
        {guesthouse.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: guesthouse.imageUrl }}
            style={searchStyles.resultImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            accessibilityLabel={`${guesthouse.name} photo`}
          />
        ) : (
          <View style={[searchStyles.resultImage, searchStyles.resultFallback]}>
            <Text style={searchStyles.hint}>Photo unavailable</Text>
          </View>
        )}
        <View style={searchStyles.resultBody}>
          <View>
            <Text style={searchStyles.resultLocation}>
              {guesthouse.city}
              {distanceLabel ? ` · ${distanceLabel}` : ''}
            </Text>
            <Text style={searchStyles.resultName}>{guesthouse.name}</Text>
          </View>
          <View style={searchStyles.resultPriceRow}>
            <Text style={searchStyles.resultPrice}>{price}</Text>
            <Text style={searchStyles.hint}>/ night</Text>
            <Text style={searchStyles.resultRating}>
              {guesthouse.ratingCount
                ? `★ ${guesthouse.averageRating.toFixed(1)}`
                : 'New'}
            </Text>
          </View>
        </View>
      </Pressable>
    );

  return (
    <View
      style={[
        styles.card,
        editorial ? styles.editorialCard : styles.nearbyCard,
      ]}
    >
      {/* The image frame also holds controls that float over the guesthouse photo. */}
      <View
        style={[styles.imageFrame, editorial && styles.editorialImageFrame]}
      >
        {guesthouse.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: guesthouse.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            accessibilityLabel={`${guesthouse.name} photo`}
          />
        ) : (
          <View
            style={styles.imageFallback}
            accessibilityLabel={`No photo available for ${guesthouse.name}`}
          >
            <Ionicons color={colors.textSoft} name="image-outline" size={32} />
            <Text style={styles.imageFallbackText}>Photo unavailable</Text>
          </View>
        )}
        <Pressable
          accessibilityLabel={
            saved
              ? `Remove ${guesthouse.name} from favourites`
              : `Save ${guesthouse.name}`
          }
          accessibilityRole="button"
          onPress={onToggleSaved}
          disabled={
            initializing || saving || (Boolean(user) && favouritesLoading)
          }
          accessibilityState={{
            disabled:
              initializing || saving || (Boolean(user) && favouritesLoading),
            busy: saving,
            selected: saved,
          }}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            color={saved ? colors.primary : colors.textMuted}
            name={saved ? 'heart' : 'heart-outline'}
            size={19}
          />
        </Pressable>
        <View style={styles.ratingPill}>
          <Ionicons color={colors.star} name="star" size={12} />
          <Text style={styles.ratingText}>
            {guesthouse.ratingCount
              ? guesthouse.averageRating.toFixed(1)
              : 'New'}
          </Text>
          <Text style={styles.reviewText}>
            ({guesthouse.ratingCount}
            {editorial ? ' reviews' : ''})
          </Text>
        </View>
        {editorial && tags[2] ? (
          <Text style={styles.imageBadge}>{tags[2]}</Text>
        ) : null}
      </View>

      {/* The card body contains the location, description, amenities and price. */}
      <View style={styles.cardBody}>
        <View style={styles.locationRow}>
          <Feather color={colors.primary} name="navigation" size={11} />
          <Text numberOfLines={1} style={styles.locationText}>
            {[guesthouse.city, guesthouse.country].filter(Boolean).join(', ')}
          </Text>
        </View>
        <Text style={styles.name}>{guesthouse.name}</Text>
        {guesthouse.description ? (
          <Text numberOfLines={3} style={styles.description}>
            {guesthouse.description}
          </Text>
        ) : null}
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.roomText}>Price per night</Text>
            <View style={styles.priceLine}>
              <Text style={styles.price}>{price}</Text>
              <Text style={styles.perNight}> / night</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${guesthouse.name}`}
            onPress={openDetails}
            style={({ pressed }) => [
              styles.detailsButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.detailsText}>View Details</Text>
            {editorial ? (
              <Feather color={colors.white} name="arrow-right" size={13} />
            ) : null}
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Rate ${guesthouse.name}`}
          disabled={initializing}
          onPress={() => {
            if (!user) requestLogin('rate your stay');
            else setRatingOpen(true);
          }}
          style={styles.rateButton}
        >
          <Text style={styles.rateText}>Rate your stay</Text>
        </Pressable>
      </View>
      <CustomerNotice notice={notice} onClose={() => setNotice(null)} />
      {ratingOpen && (
        <RatingSheet
          guesthouse={guesthouse}
          onClose={() => setRatingOpen(false)}
        />
      )}
    </View>
  );
}
