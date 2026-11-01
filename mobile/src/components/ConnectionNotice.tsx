import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors, makeThemedStyles } from '../theme';

// Keep cached results visible while making their offline status clear.
export function ConnectionNotice({
  onRetry,
  message = 'Showing saved results. Check your connection to refresh.',
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.notice}
    >
      <Feather color={colors.warning} name="wifi-off" size={18} />
      <Text style={styles.copy}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry loading results"
        onPress={onRetry}
        style={styles.retry}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = makeThemedStyles((colors) => ({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.quietSurface,
  },
  copy: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  retry: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 },
  retryText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: colors.primaryDark,
  },
}));
