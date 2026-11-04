import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function selectionFeedback() {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync().catch(() => {
    // Feedback is optional; an unavailable haptics engine must not block selection.
  });
}
