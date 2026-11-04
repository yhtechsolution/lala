import { makeThemedStyles } from '../theme';

export const styles = makeThemedStyles((colors) => ({
  wrap: { gap: 10, marginTop: 24, paddingHorizontal: 20, paddingBottom: 32 },
  title: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.primarySolid,
    borderColor: colors.primarySolid,
  },
  chipText: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  chipTextActive: { color: colors.white },
}));
