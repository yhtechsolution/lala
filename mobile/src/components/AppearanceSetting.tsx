import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useThemeMode } from '../context/ThemeContext';
import { THEME_MODES, ThemeMode } from '../services/themeMode';
import { styles } from '../styles/AppearanceSetting.styles';

const labels: Record<ThemeMode, string> = {
  system: 'Phone setting',
  light: 'Light',
  dark: 'Dark',
};

// Lets the traveller pick light, dark, or follow the phone. Shown on the Profile screen.
export function AppearanceSetting() {
  const { mode, setMode } = useThemeMode();

  const choose = async (next: ThemeMode) => {
    if (next === mode) return;
    await setMode(next);
    // Changing the theme rebuilds the screens, which returns to Home; come back to Profile.
    setTimeout(() => router.replace('/login'), 50);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Appearance</Text>
      <View accessibilityRole="radiogroup" style={styles.row}>
        {THEME_MODES.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityLabel={`Use ${labels[item].toLowerCase()} appearance`}
            accessibilityState={{ checked: mode === item }}
            onPress={() => void choose(item)}
            style={[styles.chip, mode === item && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, mode === item && styles.chipTextActive]}
            >
              {labels[item]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>
        Phone setting follows your device's light or dark mode.
      </Text>
    </View>
  );
}
