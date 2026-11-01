
import { makeThemedStyles, alpha } from '../theme';
export const styles = makeThemedStyles((colors) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: alpha(colors.tabBar, 0.9),
    boxShadow: '0px -1px 8px rgba(0,0,0,0.04)',
  },
  tab: {
    width: 64,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 8,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 20,
    letterSpacing: -0.275,
    color: colors.inkMuted,
  },
  activeLabel: { fontFamily: 'Inter_600SemiBold', color: colors.primary },
}));
