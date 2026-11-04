
import { makeThemedStyles } from '../theme';

export const styles = makeThemedStyles((colors) => ({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 7,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  tabLabelActive: { fontFamily: 'PlusJakartaSans_700Bold' },
}));
