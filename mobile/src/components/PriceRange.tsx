import { useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { styles, rangePosition } from '../styles/PriceRange.styles';

type Props = {
  minimum: number;
  maximum?: number;
  prices: number[];
  onMinimum: (price: number) => void;
  onMaximum: (price?: number) => void;
};

// The last position represents any maximum; numeric inputs support any price.
export function PriceRange(props: Props) {
  const [width, setWidth] = useState(1);
  const current = useRef({ props, width });
  current.current = { props, width };
  const starting = useRef(0);
  const ceiling = Math.max(1500, props.minimum, props.maximum ?? 0);
  const change = (which: 'min' | 'max', price: number) => {
    const { props: value } = current.current;
    const end = Math.max(1500, value.minimum, value.maximum ?? 0);
    const bounded = Math.round(Math.max(0, Math.min(end, price)) / 25) * 25;
    if (which === 'min')
      value.onMinimum(Math.min(bounded, value.maximum ?? end));
    else
      value.onMaximum(
        bounded === end ? undefined : Math.max(value.minimum, bounded),
      );
  };
  const responders = useRef(
    (['min', 'max'] as const).map((which) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          const { props: value } = current.current;
          starting.current =
            which === 'min'
              ? value.minimum
              : (value.maximum ?? Math.max(1500, value.minimum));
        },
        onPanResponderMove: (_, gesture) => {
          const { props: value, width: trackWidth } = current.current;
          const end = Math.max(1500, value.minimum, value.maximum ?? 0);
          change(which, starting.current + (gesture.dx / trackWidth) * end);
        },
      }),
    ),
  ).current;
  const bins = Array.from(
    { length: 12 },
    (_, index) =>
      props.prices.filter(
        (price) => Math.min(11, Math.floor((price / ceiling) * 12)) === index,
      ).length,
  );
  const maxBin = Math.max(1, ...bins);
  const low = Math.min(1, props.minimum / ceiling);
  const high = Math.min(1, (props.maximum ?? ceiling) / ceiling);
  return (
    <View style={styles.container}>
      <View style={styles.histogram}>
        {bins.map((count, index) => (
          <View
            key={index}
            style={[
              styles.bin,
              rangePosition(count / maxBin),
              (index + 1) / 12 > low && index / 12 < high && styles.selectedBin,
            ]}
          />
        ))}
      </View>
      <View
        style={styles.track}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View style={[styles.selection, rangePosition(low, high)]} />
        {(['min', 'max'] as const).map((which, index) => (
          <View
            key={which}
            {...responders[index].panHandlers}
            style={[
              styles.thumb,
              rangePosition(which === 'min' ? low : high, undefined, true),
            ]}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={
              which === 'min' ? 'Minimum price slider' : 'Maximum price slider'
            }
            accessibilityValue={{
              min: 0,
              max: ceiling,
              now: which === 'min' ? props.minimum : (props.maximum ?? ceiling),
            }}
            accessibilityActions={[
              { name: 'increment' },
              { name: 'decrement' },
            ]}
            onAccessibilityAction={(event) =>
              change(
                which,
                (which === 'min' ? props.minimum : (props.maximum ?? ceiling)) +
                  (event.nativeEvent.actionName === 'increment' ? 25 : -25),
              )
            }
          >
            <View
              style={[
                styles.thumbCenter,
                which === 'max' && styles.upperThumbCenter,
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
