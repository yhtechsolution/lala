import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
  engagementErrorMessage,
  getCustomerRating,
  submitRating,
} from '../services/customerEngagement';
import { styles } from '../styles/LoginScreen.styles';
import { ratingStyles } from '../styles/RatingSheet.styles';
import { colors } from '../theme';
import { Guesthouse } from '../types/guesthouse';
import { AuthIcon } from './AuthIcon';

export function RatingSheet({
  guesthouse,
  onClose,
}: {
  guesthouse: Guesthouse;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [existing, setExisting] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [success, setSuccess] = useState(false);
  const operation = useRef(false);
  const active = useRef(true);
  const owner = useRef(user?.uid);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (!user || user.uid !== owner.current) {
      onClose();
      return;
    }
    let current = true;
    setLoading(true);
    setError(null);
    setLoadError(false);
    const timer = setTimeout(() => {
      if (current) {
        setLoading(false);
        setLoadError(true);
        setError(
          'Unable to load your rating. Check your connection and try again.',
        );
      }
    }, 15000);
    getCustomerRating(guesthouse.id)
      .then((value) => {
        if (current) {
          setScore(value ?? 0);
          setExisting(value);
          setLoading(false);
          setError(null);
          setLoadError(false);
        }
      })
      .catch((cause) => {
        if (current) {
          setError(engagementErrorMessage(cause));
          setLoadError(true);
          setLoading(false);
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [guesthouse.id, user?.uid, attempt]);
  const save = async () => {
    if (operation.current || !score) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    try {
      await submitRating(guesthouse.id, score);
      if (active.current) setSuccess(true);
    } catch (cause) {
      if (active.current) setError(engagementErrorMessage(cause));
    } finally {
      operation.current = false;
      if (active.current) setBusy(false);
    }
  };
  return (
    <Modal
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={styles.scrim}>
        <Pressable
          style={styles.flex}
          accessibilityRole="button"
          accessibilityLabel="Dismiss rating"
          disabled={busy}
          onPress={onClose}
        />
        <SafeAreaView
          edges={['bottom']}
          style={styles.sheet}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          <View style={styles.welcomeRow}>
            <Text style={styles.sheetTitle}>
              {success
                ? 'Rating saved'
                : existing
                  ? 'Update your rating'
                  : 'Rate your stay'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close rating"
              disabled={busy}
              style={styles.closeButton}
              onPress={onClose}
            >
              <AuthIcon name="close" />
            </Pressable>
          </View>
          <Text style={styles.description}>{guesthouse.name}</Text>
          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              accessibilityLabel="Loading your rating"
            />
          ) : success ? (
            <Text accessibilityLiveRegion="polite" style={styles.success}>
              Thank you. Your {score}-star rating has been saved.
            </Text>
          ) : (
            <>
              {!loadError && (
                <>
                  <View style={ratingStyles.panel}>
                    <Text style={ratingStyles.prompt}>HOW WAS YOUR STAY?</Text>
                    <View accessibilityRole="radiogroup" style={ratingStyles.stars}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Pressable
                        key={value}
                        accessibilityRole="radio"
                        aria-checked={score === value}
                        accessibilityLabel={`${value} ${value === 1 ? 'star' : 'stars'}`}
                        accessibilityState={{
                          checked: score === value,
                          disabled: busy,
                        }}
                        disabled={busy}
                        onPress={() => setScore(value)}
                        style={ratingStyles.star}
                      >
                        <Ionicons
                          name={value <= score ? 'star' : 'star-outline'}
                          size={32}
                          color={colors.warning}
                        />
                      </Pressable>
                    ))}
                    </View>
                    <Text style={ratingStyles.score}>
                      {score ? `${score} / 5` : 'Select a star rating'}
                    </Text>
                  </View>
                </>
              )}
              {error && (
                <Text accessibilityRole="alert" style={styles.noticeText}>
                  {error}
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                disabled={busy || (!loadError && !score)}
                accessibilityState={{
                  disabled: busy || (!loadError && !score),
                }}
                style={[
                  styles.primaryButton,
                  (busy || (!loadError && !score)) && styles.disabled,
                ]}
                onPress={
                  loadError ? () => setAttempt((value) => value + 1) : save
                }
              >
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>
                    {loadError
                      ? 'Try again'
                      : existing
                        ? 'Update Rating'
                        : 'Submit Rating'}
                  </Text>
                )}
              </Pressable>
            </>
          )}
          {success && (
            <Pressable
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Done</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
