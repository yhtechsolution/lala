
import { alpha, makeThemedStyles } from '../theme';

export const styles = makeThemedStyles((colors) => ({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: alpha(colors.background, 0.98),
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 7,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
  },
}));
