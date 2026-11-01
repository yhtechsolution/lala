import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme, View } from 'react-native';
import {
  parseThemeMode,
  resolveScheme,
  Scheme,
  ThemeMode,
} from '../services/themeMode';
import { palettes, setActiveScheme } from '../theme';

const STORAGE_KEY = '@lala_theme_mode';

type ThemeValue = {
  mode: ThemeMode;
  scheme: Scheme;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeValue>({
  mode: 'system',
  scheme: 'light',
  setMode: async () => undefined,
});

// Holds the traveller's choice (follow the phone, always light, always dark), remembers
// it on this device, and tells the style system which colours to use.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setModeState(parseThemeMode(stored)))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const scheme = resolveScheme(mode, system);
  // Set during render, before any screen below reads a colour.
  setActiveScheme(scheme);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice still applies for this session if it cannot be saved.
    }
  }, []);

  const value = useMemo(
    () => ({ mode, scheme, setMode }),
    [mode, scheme, setMode],
  );

  // Show the right background while the saved choice loads, to avoid a light flash.
  if (!loaded)
    return (
      <View style={{ flex: 1, backgroundColor: palettes[scheme].background }} />
    );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeContext);
