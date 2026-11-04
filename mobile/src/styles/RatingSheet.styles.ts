import { makeThemedStyles } from '../theme';
export const ratingStyles = makeThemedStyles((colors) => ({
  panel: {
    backgroundColor: colors.quietSurface,
    borderRadius: 20,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  prompt: {
    color: colors.primaryDark,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
    marginVertical: 8,
  },
  star: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    color: colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
}));
