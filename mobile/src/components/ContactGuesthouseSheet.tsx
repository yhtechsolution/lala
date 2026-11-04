import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuesthouseDetails } from '../services/guesthouseDetails';
import { styles } from '../styles/ContactGuesthouseSheet.styles';
import { colors } from '../theme';

type Channel = {
  label: string;
  detail: string;
  url: string;
  icon: keyof typeof Feather.glyphMap;
  accent: 'orange' | 'teal' | 'slate' | 'soft';
};

function channelsFor(contact: Record<string, string>): Channel[] {
  const channels: Channel[] = [];
  const whatsapp = contact.whatsapp ?? contact.whatsApp;
  const whatsappDigits = whatsapp?.replace(/\D/g, '') ?? '';
  if (whatsappDigits.length >= 7) {
    channels.push({
      label: 'Chat on WhatsApp',
      detail: whatsapp,
      url: `https://wa.me/${whatsappDigits}`,
      icon: 'message-square',
      accent: 'orange',
    });
  }
  const phone = contact.phone?.trim();
  const phoneDigits = phone?.replace(/[^+\d]/g, '') ?? '';
  if (phone && phoneDigits.replace(/\D/g, '').length >= 7) {
    channels.push({
      label: 'Call Direct',
      detail: phone,
      url: `tel:${phoneDigits}`,
      icon: 'phone',
      accent: 'teal',
    });
  }
  const email = contact.email?.trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    channels.push({
      label: 'Send Email',
      detail: email,
      url: `mailto:${encodeURIComponent(email)}`,
      icon: 'mail',
      accent: 'slate',
    });
  }
  const website = contact.website?.trim();
  if (website) {
    try {
      const url = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        channels.push({
          label: 'Visit Official Website',
          detail: url.hostname,
          url: url.toString(),
          icon: 'globe',
          accent: 'soft',
        });
      }
    } catch {
      // Malformed website values stay in the details page's plain contact list.
    }
  }
  return channels;
}

export function ContactGuesthouseSheet({
  guesthouse,
  visible,
  onClose,
  onOpen,
}: {
  guesthouse: GuesthouseDetails;
  visible: boolean;
  onClose: () => void;
  onOpen: (url: string) => void;
}) {
  const { height } = useWindowDimensions();
  const channels = channelsFor(guesthouse.contact);
  const photo = guesthouse.imageUrl ?? guesthouse.logoUrl;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close contact sheet" onPress={onClose} style={styles.backdrop} />
        <SafeAreaView edges={['bottom']} style={[styles.sheet, { maxHeight: height * 0.88 }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View style={styles.eyebrowPill}>
              <Feather color={colors.primaryDark} name="message-circle" size={15} />
              <Text style={styles.eyebrow}>DIRECT CONTACT DETAILS</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close contact sheet" onPress={onClose} style={styles.closeButton}>
              <Feather color={colors.textMuted} name="x" size={20} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.propertyRow}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.propertyPhoto} contentFit="cover" accessibilityLabel={`${guesthouse.name} photo`} />
              ) : (
                <View style={[styles.propertyPhoto, styles.photoFallback]}>
                  <Feather color={colors.primaryDark} name="home" size={22} />
                </View>
              )}
              <View style={styles.propertyCopy}>
                <Text numberOfLines={2} style={styles.propertyName}>{guesthouse.name}</Text>
                <Text style={styles.propertyLocation}>{guesthouse.city}, {guesthouse.country}</Text>
              </View>
            </View>
            <View style={styles.advantage}>
              <View style={styles.advantageIcon}><Feather color={colors.warning} name="heart" size={18} /></View>
              <View style={styles.flex}>
                <Text style={styles.advantageTitle}>Direct Booking Advantage</Text>
                <Text style={styles.advantageCopy}>Contact this guesthouse directly. Lala does not add a booking commission.</Text>
              </View>
            </View>
            <View style={styles.channels}>
              <Text style={styles.sectionLabel}>DIRECT CHANNELS</Text>
              {channels.length ? channels.map((channel) => (
                <Pressable
                  key={channel.label}
                  accessibilityRole="link"
                  accessibilityLabel={`${channel.label}: ${channel.detail}`}
                  onPress={() => { onClose(); onOpen(channel.url); }}
                  style={styles.channel}
                >
                  <View style={[styles.channelIcon, styles[channel.accent]]}>
                    <Feather color={colors.white} name={channel.icon} size={22} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.channelTitle}>{channel.label}</Text>
                    <Text numberOfLines={1} style={styles.channelDetail}>{channel.detail}</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <Feather color={colors.textMuted} name={channel.icon === 'globe' ? 'external-link' : 'arrow-right'} size={17} />
                  </View>
                </Pressable>
              )) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Contact details have not been provided yet.</Text>
                </View>
              )}
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
            <Text style={styles.footerCopy}>Connect with hosts directly · Zero platform surcharge</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
