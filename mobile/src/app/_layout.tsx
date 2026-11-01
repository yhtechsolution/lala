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
import { Tabs, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { styles } from '../styles/RootLayout.styles';

// Importing this file once at the app root initializes the shared Firebase app.
import '../config/firebase';
import { colors } from '../theme';
import { ThemeProvider, useThemeMode } from '../context/ThemeContext';
import { FavouritesProvider } from '../context/FavouritesContext';
import { AuthProvider } from '../context/AuthContext';
import { AuthTabBar } from '../components/AuthTabBar';

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
  const pathname = usePathname();
  const { scheme } = useThemeMode();
  const isAuthScreen =
    pathname === '/login' ||
    pathname === '/compare' ||
    pathname.startsWith('/guesthouse/');

  return (
    <AuthProvider>
      <FavouritesProvider>
        <Fragment key={scheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {/* Each file in src/app becomes one route in this bottom tab navigator. */}
          <Tabs
            tabBar={
              isAuthScreen ? (props) => <AuthTabBar {...props} /> : undefined
            }
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: colors.background },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarLabelStyle: styles.tabLabel,
              tabBarStyle: styles.tabBar,
            }}
          >
            <Tabs.Screen name="guesthouse/[id]" options={{ href: null }} />
            <Tabs.Screen name="compare" options={{ href: null }} />
            <Tabs.Screen
              name="index"
              options={{
                title: 'Browse',
                tabBarLabel: 'Home',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons color={color} name="home-outline" size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="search"
              options={{
                title: 'Search',
                tabBarLabel: 'Explore',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons color={color} name="compass-outline" size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="favourites"
              options={{
                title: 'Favourites',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons color={color} name="heart-outline" size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="login"
              options={{
                title: 'Login',
                tabBarLabel: 'Profile',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons color={color} name="person-outline" size={size} />
                ),
              }}
            />
          </Tabs>
        </Fragment>
      </FavouritesProvider>
    </AuthProvider>
  );
}
