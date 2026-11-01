import { makeThemedStyles } from '../theme';
export const ratingStyles = makeThemedStyles((colors) => ({
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 12,
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
    marginBottom: 16,
  },
}));
