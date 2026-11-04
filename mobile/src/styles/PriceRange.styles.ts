import { ViewStyle } from 'react-native';
import { makeThemedStyles } from '../theme';
export const styles = makeThemedStyles((colors) => ({
  container: { marginHorizontal: 12, marginTop: 0, marginBottom: 12 },
  histogram: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0,
  },
  bin: {
    flex: 1,
    backgroundColor: colors.border,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  selectedBin: { backgroundColor: colors.primaryFill },
  upperThumbCenter: { backgroundColor: colors.accentSolid },
  track: {
    marginTop: 16,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border,
    position: 'relative',
  },
  selection: {
    position: 'absolute',
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryFill,
  },
  thumb: {
    position: 'absolute',
    top: -9,
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.15)',
  },
  thumbCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryFill,
  },
}));
export function rangePosition(
  start: number,
  end?: number,
  thumb = false,
): ViewStyle {
  return end !== undefined
    ? { left: `${start * 100}%`, width: `${(end - start) * 100}%` }
    : thumb
      ? { left: `${start * 100}%` }
      : { height: `${start * 100}%` };
}
