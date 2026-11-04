import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { User } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavourites } from '../context/FavouritesContext';
import { authErrorMessage, saveCustomerProfile, signOutCustomer } from '../services/customerAuth';
import { AppearanceSetting } from './AppearanceSetting';
import { styles } from '../styles/ProfileAccountView.styles';
import { colors } from '../theme';

export function ProfileAccountView({
  user,
  customer,
  cached,
  retryProfile,
}: {
  user: User;
  customer: { displayName: string; email: string };
  cached: boolean;
  retryProfile: () => void;
}) {
  const favourites = useFavourites();
  const [sheet, setSheet] = useState<'edit' | 'logout' | null>(null);
  const [name, setName] = useState(customer.displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initials = customer.displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
  const created = user.metadata.creationTime;
  const memberSince = created ? new Date(created).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await saveCustomerProfile(user, name);
      retryProfile();
      setSheet(null);
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  const logOut = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signOutCustomer();
      setSheet(null);
      router.replace('/');
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/lala-house-mark.png')} style={styles.logo} contentFit="contain" />
          <View><Text style={styles.brand}>Lala</Text><Text style={styles.brandCaption}>Account</Text></View>
        </View>
        <View style={styles.headerIcon}><Feather name="user" size={19} color={colors.white} /></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>TRAVELLER SPACE</Text>
        <Text style={styles.heading}>Profile & Account</Text>
        {cached && <Pressable onPress={retryProfile} style={styles.cachedNotice}><Text style={styles.muted}>Showing saved profile. Tap to refresh.</Text></Pressable>}
        <View style={styles.profileCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatar}><Text style={styles.initials}>{initials || 'L'}</Text></View>
            <View style={styles.identityCopy}>
              <Text style={styles.name} numberOfLines={2}>{customer.displayName}</Text>
              <Text style={styles.email} numberOfLines={1}>{customer.email || user.email}</Text>
            </View>
          </View>
          {memberSince && <Text style={styles.memberSince}>Member since {memberSince}</Text>}
        </View>
        <View style={styles.statsRow}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/favourites')} style={styles.statCard}>
            <Feather name="heart" size={22} color={colors.accent} />
            <Text style={styles.statValue}>{favourites.loading ? '…' : favourites.error ? '—' : favourites.ids.length}</Text>
            <Text style={styles.statLabel}>Favourites</Text>
          </Pressable>
          <View style={styles.statCard}>
            <Feather name="percent" size={22} color={colors.primaryDark} />
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Lala booking fee</Text>
          </View>
        </View>
        <View style={styles.pledge}>
          <View style={styles.pledgeIcon}><Feather name="link" size={20} color={colors.white} /></View>
          <View style={styles.pledgeCopy}>
            <Text style={styles.pledgeTitle}>Direct Guesthouse Contact</Text>
            <Text style={styles.pledgeText}>Contact guesthouses directly. Lala does not add a booking commission.</Text>
          </View>
        </View>
        <View style={styles.menu}>
          <MenuRow icon="edit-3" title="Edit Profile Information" subtitle="Update your name" onPress={() => { setName(customer.displayName); setError(null); setSheet('edit'); }} />
          <MenuRow icon="heart" title="Saved Guesthouses" subtitle="View your favourites" onPress={() => router.push('/favourites')} />
          <MenuRow icon="log-out" title="Log Out" subtitle="Sign out of your Lala account" onPress={() => { setError(null); setSheet('logout'); }} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Explore guesthouses" onPress={() => router.push('/search')} style={styles.gateway}>
          <View style={styles.gatewayTitleRow}><Text style={styles.gatewayEyebrow}>YOUR NEXT GATEWAY</Text><Text style={styles.gatewayCaption}>Explore Botswana</Text></View>
          <View style={styles.gatewayImageWrap}>
            <Image source={require('../../assets/profile/gateway.jpg')} style={styles.gatewayImage} contentFit="cover" />
            <View style={styles.gatewayOverlay}><Text style={styles.gatewayText}>Find your next stay</Text><Feather name="arrow-right" size={20} color={colors.white} /></View>
          </View>
        </Pressable>
        <AppearanceSetting />
      </ScrollView>
      <Modal visible={sheet !== null} transparent animationType="fade" onRequestClose={() => !busy && setSheet(null)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{sheet === 'edit' ? 'Edit Profile Information' : 'Log Out?'}</Text>
            {sheet === 'edit' ? <>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput accessibilityLabel="Full name" autoComplete="name" value={name} onChangeText={setName} style={styles.input} />
              <Text style={styles.readonlyEmail}>{customer.email || user.email}</Text>
            </> : <Text style={styles.modalCopy}>You can sign in again any time.</Text>}
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => setSheet(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => void (sheet === 'edit' ? save() : logOut())} style={styles.actionButton}>
                {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionText}>{sheet === 'edit' ? 'Save Changes' : 'Log Out'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuRow({ icon, title, subtitle, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.menuRow}>
    <View style={styles.menuIcon}><Feather name={icon} size={20} color={colors.primaryDark} /></View>
    <View style={styles.menuCopy}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View>
    <Feather name="chevron-right" size={20} color={colors.textMuted} />
  </Pressable>;
}
