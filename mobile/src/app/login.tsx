import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearanceSetting } from '../components/AppearanceSetting';
import { authColors, styles } from '../styles/LoginScreen.styles';

import { AuthIcon, AuthIconName } from '../components/AuthIcon';
import { ConnectionNotice } from '../components/ConnectionNotice';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  authErrorMessage,
  resetCustomerPassword,
  saveCustomerProfile,
  signInCustomer,
  signOutCustomer,
  signUpCustomer,
} from '../services/customerAuth';
import { colors } from '../theme';

type Mode = 'signIn' | 'signUp';
const validEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Keep account actions and their errors on the same screen.
export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const {
    user,
    customer,
    initializing,
    profileLoading,
    profileCached,
    retryProfile,
    error: sessionError,
  } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'reset' | 'help' | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const operation = useRef(false);
  const passwordInput = useRef<TextInput>(null);

  const run = async (action: () => Promise<unknown>) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (nextError) {
      setError(authErrorMessage(nextError));
    } finally {
      if (auth?.currentUser) {
        setPassword('');
        setShowPassword(false);
      }
      operation.current = false;
      setBusy(false);
    }
  };
  const submit = () => {
    if (!validEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (mode === 'signUp' && !displayName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (mode === 'signUp' && password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }
    void run(async () => {
      if (mode === 'signUp') await signUpCustomer(email, password, displayName);
      else await signInCustomer(email, password);
      setPassword('');
      setShowPassword(false);
    });
  };
  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setPassword('');
    setShowPassword(false);
  };
  const sendReset = async () => {
    if (resetBusy) return;
    if (!validEmail(resetEmail)) {
      setResetError('Please enter a valid email address.');
      return;
    }
    setResetBusy(true);
    setResetError(null);
    try {
      await resetCustomerPassword(resetEmail);
      setResetNotice(
        'If an account uses this email, you will receive password reset instructions.',
      );
    } catch (nextError) {
      setResetError(authErrorMessage(nextError));
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Image
            source={require('../../assets/lala-logo.jpeg')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Lala logo"
          />
          <View>
            <Text style={styles.brand}>Lala</Text>
            <Text style={styles.caption}>Account</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore guesthouses"
            onPress={() => router.push('/search')}
            style={styles.headerButton}
          >
            <AuthIcon name="filter" />
          </Pressable>
          <View style={styles.profileIcon}>
            <AuthIcon name="profile" />
          </View>
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleRow}>
            <View style={[styles.row, styles.flex]}>
              <Text style={[styles.title, width < 360 && styles.smallTitle]}>
                Account Access
              </Text>
              <Text style={styles.secure}>Secure</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSheet('help')}
              hitSlop={12}
              style={styles.help}
            >
              <AuthIcon name="help" />
              <Text style={styles.helpText}>Help</Text>
            </Pressable>
          </View>
          <Text style={styles.description}>
            Manage your saved safari retreats, direct bookings, and verified
            traveler preferences.
          </Text>
          {initializing || (user && (profileLoading || busy)) ? (
            <ActivityIndicator
              accessibilityLabel="Loading your account"
              color={colors.primary}
              style={styles.loader}
            />
          ) : user ? (
            <>
              {profileCached && (
                <ConnectionNotice
                  message="Showing your saved profile. Check your connection to refresh."
                  onRetry={retryProfile}
                />
              )}
              <Card
                title={
                  customer
                    ? `Welcome, ${customer.displayName}`
                    : 'Complete your account'
                }
              >
                {user.email}
                {'\n'}
                {customer
                  ? 'You are signed in. Your account stays available across app restarts.'
                  : 'Your login is ready. Save your name to finish setting up your customer profile.'}
              </Card>
              {!customer && (
                <>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    accessibilityLabel="Full name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder={user.displayName || 'Your full name'}
                    placeholderTextColor={authColors.muted}
                    style={[styles.field, styles.nameInput]}
                    autoComplete="name"
                  />
                  <Button
                    title="Save Customer Profile"
                    onPress={() =>
                      void run(async () => {
                        await saveCustomerProfile(
                          user,
                          displayName || user.displayName || '',
                        );
                        retryProfile();
                        setPassword('');
                      })
                    }
                  />
                </>
              )}
              {(error || sessionError) && (
                <Notice text={error || sessionError || ''} />
              )}
              <Button
                title="Explore Guesthouses"
                onPress={() => router.push('/')}
                icon="arrow"
              />
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  void run(async () => {
                    await signOutCustomer();
                    setPassword('');
                    setDisplayName('');
                    setEmail('');
                    router.replace('/');
                  })
                }
                style={styles.guestButton}
              >
                <Text style={styles.link}>Sign Out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.segment}>
                {(['signIn', 'signUp'] as const).map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="tab"
                    accessibilityState={{
                      selected: mode === value,
                      disabled: busy,
                    }}
                    disabled={busy}
                    onPress={() => switchMode(value)}
                    style={[
                      styles.segmentButton,
                      mode === value && styles.segmentActive,
                    ]}
                  >
                    <AuthIcon
                      name={value === 'signIn' ? 'signIn' : 'createAccount'}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        mode === value && styles.selectedText,
                      ]}
                    >
                      {value === 'signIn' ? 'Sign In' : 'Create Account'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Card
                title={mode === 'signIn' ? 'Welcome back' : 'Join Lala'}
                badge
              >
                {mode === 'signIn'
                  ? 'Sign in to sync your saved Botswana safari lodges, trip favourites, and private host contact notes.'
                  : 'Create your free account to save your favourite guesthouses and share your ratings.'}
              </Card>
              {mode === 'signUp' && (
                <>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    accessibilityLabel="Full name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    editable={!busy}
                    placeholder="Your full name"
                    placeholderTextColor={authColors.muted}
                    style={[styles.field, styles.nameInput]}
                    autoComplete="name"
                    textContentType="name"
                  />
                </>
              )}
              <View style={styles.fieldLabelRow}>
                <Text style={styles.passwordLabel}>Email Address</Text>
                <Text style={styles.emailHint}>Verified Traveler</Text>
              </View>
              <View style={styles.field}>
                <AuthIcon name="email" />
                <TextInput
                  accessibilityLabel="Email address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!busy}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  placeholder="you@example.com"
                  placeholderTextColor={authColors.muted}
                  style={styles.input}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInput.current?.focus()}
                />
              </View>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.passwordLabel}>Password</Text>
                {mode === 'signIn' && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => {
                      setResetEmail(email);
                      setResetError(null);
                      setResetNotice(null);
                      setSheet('reset');
                    }}
                  >
                    <Text style={styles.forgot}>Forgot Password?</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.field}>
                <AuthIcon name="password" />
                <TextInput
                  ref={passwordInput}
                  accessibilityLabel="Password"
                  value={password}
                  onChangeText={setPassword}
                  editable={!busy}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                  autoComplete={
                    mode === 'signUp' ? 'new-password' : 'current-password'
                  }
                  textContentType={
                    mode === 'signUp' ? 'newPassword' : 'password'
                  }
                  placeholder={
                    mode === 'signUp'
                      ? 'At least 6 characters'
                      : 'Enter your password'
                  }
                  placeholderTextColor={authColors.muted}
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showButton}
                >
                  <Text style={styles.showText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>
              {(error || sessionError) && (
                <Notice text={error || sessionError || ''} />
              )}
              {!isFirebaseConfigured && (
                <Notice text="Sign in is unavailable until the app's Firebase configuration is set up." />
              )}
              <Button
                title={
                  mode === 'signIn' ? 'Sign In to Lala' : 'Create Free Account'
                }
                onPress={submit}
                busy={busy}
                disabled={!isFirebaseConfigured}
                icon="arrow"
              />
              <View style={styles.trustCard}>
                <Card
                  title="100% Commission-Free Travel Discovery"
                  icon="shield"
                  small
                >
                  Lala connects you directly with certified local hosts across
                  Gaborone, Maun, and Chobe without traveler service charges.
                </Card>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => router.push('/')}
                style={styles.guestButton}
              >
                <Text style={styles.link}>Continue as Guest</Text>
              </Pressable>
            </>
          )}
          <AppearanceSetting />
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!resetBusy) setSheet(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.scrim}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            accessibilityLabel="Close dialog"
            disabled={resetBusy}
            style={styles.flex}
            onPress={() => setSheet(null)}
          />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.welcomeRow}>
              <Text style={styles.sheetTitle}>
                {sheet === 'reset' ? 'Reset Password' : 'Account Help'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                disabled={resetBusy}
                onPress={() => setSheet(null)}
                style={styles.closeButton}
              >
                <AuthIcon name="close" />
              </Pressable>
            </View>
            <Text style={styles.description}>
              {sheet === 'reset'
                ? "Enter your registered email address and we'll send you a secure link to reset your account password."
                : 'Browse guesthouses freely. Create an account to save favourites and submit ratings. Use Forgot Password if you cannot sign in.'}
            </Text>
            {sheet === 'reset' && (
              <>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.field}>
                  <AuthIcon name="email" />
                  <TextInput
                    accessibilityLabel="Reset email address"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    editable={!resetBusy}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    placeholder="you@example.com"
                    placeholderTextColor={authColors.muted}
                    style={styles.input}
                    onSubmitEditing={() => void sendReset()}
                  />
                </View>
                {resetError && <Notice text={resetError} />}
                {resetNotice && (
                  <Text
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    style={styles.success}
                  >
                    {resetNotice}
                  </Text>
                )}
                <Button
                  title="Send Reset Instructions"
                  onPress={() => void sendReset()}
                  busy={resetBusy}
                  disabled={Boolean(resetNotice)}
                  icon="send"
                />
              </>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Card({
  title,
  children,
  icon = 'welcome',
  badge,
  small,
}: {
  title: string;
  children: React.ReactNode;
  icon?: AuthIconName;
  badge?: boolean;
  small?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, small && styles.shieldBox]}>
        <AuthIcon name={icon} />
      </View>
      <View style={styles.flex}>
        <View style={styles.welcomeRow}>
          <Text style={small ? styles.trustTitle : styles.cardTitle}>
            {title}
          </Text>
          {badge && <Text style={styles.directAccess}>DIRECT ACCESS</Text>}
        </View>
        <Text style={styles.cardDescription}>{children}</Text>
      </View>
    </View>
  );
}
function Button({
  title,
  onPress,
  icon,
  busy = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: AuthIconName;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy || disabled, busy }}
      disabled={busy || disabled}
      onPress={onPress}
      style={[styles.primaryButton, (busy || disabled) && styles.disabled]}
    >
      {busy ? (
        <ActivityIndicator
          color={colors.white}
          accessibilityLabel="Please wait"
        />
      ) : (
        <>
          <Text style={styles.buttonText}>{title}</Text>
          {icon && <AuthIcon name={icon} />}
        </>
      )}
    </Pressable>
  );
}
function Notice({ text }: { text: string }) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.notice}
    >
      <View style={styles.row}>
        <AuthIcon name="notice" />
        <Text style={styles.noticeTitle}>Authentication Notice</Text>
      </View>
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}
