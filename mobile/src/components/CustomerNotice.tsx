import { router } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/LoginScreen.styles';
import { AuthIcon } from './AuthIcon';

export type CustomerNoticeState = {
  title: string;
  message: string;
  login?: boolean;
};
// Reuse the existing real authentication sheet, including its original assets.
export function CustomerNotice({
  notice,
  onClose,
}: {
  notice: CustomerNoticeState | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={Boolean(notice)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <Pressable
          style={styles.flex}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          onPress={onClose}
        />
        <SafeAreaView
          edges={['bottom']}
          style={styles.sheet}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          <View style={styles.welcomeRow}>
            <Text style={styles.sheetTitle}>{notice?.title}</Text>
            <Pressable
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close message"
              onPress={onClose}
            >
              <AuthIcon name="close" />
            </Pressable>
          </View>
          <Text style={styles.description}>{notice?.message}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => {
              const login = notice?.login;
              onClose();
              if (login) router.push('/login');
            }}
          >
            <Text style={styles.buttonText}>
              {notice?.login ? 'Sign In' : 'Close'}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
