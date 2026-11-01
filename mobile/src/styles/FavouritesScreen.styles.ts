import { styles as placeholderStyles } from './PlaceholderScreen.styles';
import { styles as browseStyles } from './BrowseScreen.styles';
import { makeThemedStyles } from '../theme';
// Reuse the existing saved-stays header and established card/page tokens.
export const styles = makeThemedStyles((colors) => ({
  safeArea: placeholderStyles.safeArea,
  header: browseStyles.header,
  brandRow: browseStyles.brandRow,
  logo: browseStyles.logo,
  brand: browseStyles.brand,
  pageLabel: browseStyles.pageLabel,
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  title: { ...placeholderStyles.title, marginTop: 0, textAlign: 'left' },
  state: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 16,
  },
  subtitle: {
    color: colors.text,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  copy: {
    color: colors.textMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primaryFill,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
}));
