import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuesthouseCard } from '../components/GuesthouseCard';
import { ConnectionNotice } from '../components/ConnectionNotice';
import {
  CustomerNotice,
  CustomerNoticeState,
} from '../components/CustomerNotice';
import { useAuth } from '../context/AuthContext';
import { useFavourites } from '../context/FavouritesContext';
import { useGuesthouses } from '../hooks/useGuesthouses';
import { engagementErrorMessage } from '../services/customerEngagement';
import { styles } from '../styles/FavouritesScreen.styles';
import { colors } from '../theme';

export default function FavouritesScreen() {
  const { user, initializing } = useAuth();
  const favourites = useFavourites();
  const listings = useGuesthouses();
  const [notice, setNotice] = useState<CustomerNoticeState | null>(null);
  const saved = listings.guesthouses.filter((guesthouse) =>
    favourites.ids.includes(guesthouse.id),
  );
  const unavailable = favourites.ids.filter(
    (id) => !listings.guesthouses.some((guesthouse) => guesthouse.id === id),
  );
  const loading =
    initializing ||
    favourites.loading ||
    (Boolean(user) && favourites.ids.length > 0 && listings.loading);
  const error =
    favourites.error || (favourites.ids.length > 0 ? listings.error : null);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/search/logo.png')}
            style={styles.logo}
            accessibilityLabel="Lala logo"
          />
          <View>
            <Text style={styles.brand}>Lala</Text>
            <Text style={styles.pageLabel}>Favourites</Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Favourites</Text>
        {(favourites.cached ||
          (favourites.ids.length > 0 && listings.cached)) &&
          !loading &&
          !error && (
            <ConnectionNotice
              onRetry={() => {
                favourites.retry();
                listings.retry();
              }}
            />
          )}
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.copy}>Loading favourites</Text>
          </View>
        ) : !user ? (
          <View style={styles.state}>
            <Text style={styles.subtitle}>Sign in to save favourites</Text>
            <Text style={styles.copy}>
              Keep your favourite Botswana stays together across devices.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </Pressable>
          </View>
        ) : error ? (
          <View style={styles.state} accessibilityRole="alert">
            <Text style={styles.subtitle}>Unable to load favourites</Text>
            <Text style={styles.copy}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              onPress={() => {
                favourites.retry();
                listings.retry();
              }}
            >
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        ) : favourites.ids.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.subtitle}>No favourites yet</Text>
            <Text style={styles.copy}>
              Tap a guesthouse heart to save it here.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              onPress={() => router.navigate('/')}
            >
              <Text style={styles.buttonText}>Browse Guesthouses</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.copy}>
              {saved.length} saved {saved.length === 1 ? 'stay' : 'stays'}
            </Text>
            {saved.map((guesthouse) => (
              <GuesthouseCard
                editorial
                key={guesthouse.id}
                guesthouse={guesthouse}
              />
            ))}
            {unavailable.map((id) => (
              <View key={id} style={styles.state}>
                <Text style={styles.subtitle}>Guesthouse unavailable</Text>
                <Text style={styles.copy}>
                  This saved guesthouse is no longer available.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove unavailable guesthouse"
                  disabled={favourites.pending.includes(id)}
                  style={styles.button}
                  onPress={async () => {
                    try {
                      await favourites.toggle(id);
                    } catch (cause) {
                      setNotice({
                        title: 'Unable to remove favourite',
                        message: engagementErrorMessage(cause),
                      });
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Remove Favourite</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <CustomerNotice notice={notice} onClose={() => setNotice(null)} />
    </SafeAreaView>
  );
}
