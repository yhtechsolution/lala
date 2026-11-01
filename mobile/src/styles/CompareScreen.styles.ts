import { makeThemedStyles, shadows } from '../theme';

export const styles = makeThemedStyles((colors) => ({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 16, padding: 20, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: {
    color: colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  pickRow: {
    ...shadows.soft,
    backgroundColor: colors.surface,
    borderRadius: 14,
    gap: 2,
    padding: 14,
  },
  pickName: {
    color: colors.text,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  columns: { flexDirection: 'row', gap: 10 },
  headCell: {
    ...shadows.soft,
    backgroundColor: colors.surface,
    borderRadius: 14,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  headName: {
    color: colors.text,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  rowLabel: {
    color: colors.textSoft,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginTop: 6,
  },
  cell: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  cellBetter: {
    backgroundColor: colors.blueSurface,
    borderColor: colors.primary,
  },
  cellText: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  betterTag: {
    color: colors.primaryDark,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    marginTop: 2,
  },
  section: { gap: 6 },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: colors.blueChip,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    color: colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  action: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
  },
  actionText: {
    color: colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
}));
