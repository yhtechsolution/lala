import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { colors, makeThemedStyles } from '../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type PlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: IoniconName;
  children?: React.ReactNode;
};

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  icon,
  children,
}: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.brand}>Lala</Text>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons color={colors.primary} name={icon} size={32} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = makeThemedStyles((colors) => ({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  brand: {
    color: colors.text,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 64,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.blueSurface,
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  title: {
    color: colors.text,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    marginTop: 20,
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 310,
    textAlign: 'center',
  },
}));
