import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from '../styles/RootLayout.styles';

// Importing this file once at the app root initializes the shared Firebase app.
import '../config/firebase';
import { colors } from '../theme';
import { ThemeProvider, useThemeMode } from '../context/ThemeContext';
import { FavouritesProvider } from '../context/FavouritesContext';
import { AuthProvider } from '../context/AuthContext';

const tabLabel = (label: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={[
      styles.tabLabel,
      focused && styles.tabLabelActive,
      { color: focused ? colors.primary : colors.textMuted },
    ]}>
      {label}
    </Text>
  );

// RootLayout loads global fonts, applies the light/dark theme and renders the navigation.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Wait for the custom fonts before drawing text to avoid a visible font change after startup.
  return (
    <ThemeProvider>
      {fontsLoaded ? <AppLayout /> : <LoadingScreen />}
    </ThemeProvider>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

// The navigator is rebuilt when the colour scheme changes so every screen picks up the new
// colours. Sign-in and favourites state live above it and are kept.
function AppLayout() {
  const { scheme } = useThemeMode();
  return (
    <AuthProvider>
      <FavouritesProvider>
        <Fragment key={scheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {/* Each file in src/app becomes one route in this bottom tab navigator. */}
          <Tabs
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: colors.background },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: styles.tabBar,
            }}
          >
            <Tabs.Screen name="guesthouse/[id]" options={{ href: null }} />
            <Tabs.Screen name="compare" options={{ href: null }} />
            <Tabs.Screen
              name="index"
              options={{
                title: 'Browse',
                tabBarLabel: tabLabel('Home'),
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons color={color} name={focused ? 'home' : 'home-outline'} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="search"
              options={{
                title: 'Search',
                tabBarLabel: tabLabel('Explore'),
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons color={color} name={focused ? 'compass' : 'compass-outline'} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="favourites"
              options={{
                title: 'Favourites',
                tabBarLabel: tabLabel('Favourites'),
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons color={color} name={focused ? 'heart' : 'heart-outline'} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="login"
              options={{
                title: 'Login',
                tabBarLabel: tabLabel('Profile'),
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons color={color} name={focused ? 'person' : 'person-outline'} size={size} />
                ),
              }}
            />
          </Tabs>
        </Fragment>
      </FavouritesProvider>
    </AuthProvider>
  );
}
