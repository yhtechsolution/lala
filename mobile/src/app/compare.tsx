import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGuesthouses } from '../hooks/useGuesthouses';
import { compareGuesthouses } from '../services/compare';
import { similarGuesthouses } from '../services/similar';
import { styles } from '../styles/CompareScreen.styles';
import { colors } from '../theme';

// Compare two guesthouses side by side. Opened from a guesthouse's detail page.
export default function CompareScreen() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const { guesthouses, loading, error } = useGuesthouses({
    text: '',
    field: 'all',
  });
  const [otherId, setOtherId] = useState(params.b ?? '');
  const first = guesthouses.find((item) => item.id === params.a);
  const second = guesthouses.find((item) => item.id === otherId);
  const suggestions = useMemo(() => {
    if (!first) return [];
    const alike = similarGuesthouses(first, guesthouses, guesthouses.length);
    const rest = guesthouses.filter(
      (item) => item.id !== first.id && !alike.includes(item),
    );
    return [...alike, ...rest];
  }, [first, guesthouses]);
  const comparison = first && second ? compareGuesthouses(first, second) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Compare stays</Text>

        {loading && !first ? (
          <ActivityIndicator color={colors.primary} />
        ) : !first ? (
          <Text style={styles.hint}>
            {error ??
              'That guesthouse could not be found. Go back and try again.'}
          </Text>
        ) : !second || !comparison ? (
          <>
            <Text style={styles.hint}>
              Choose a guesthouse to compare with {first.name}. Similar stays
              are listed first.
            </Text>
            {suggestions.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Compare with ${item.name}`}
                onPress={() => setOtherId(item.id)}
                style={styles.pickRow}
              >
                <Text style={styles.pickName}>{item.name}</Text>
                <Text style={styles.hint}>
                  {item.city} · P{' '}
                  {item.pricePerNight.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  / night
                </Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <View style={styles.columns}>
              {[first, second].map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}
                  onPress={() =>
                    router.push({
                      pathname: '/guesthouse/[id]',
                      params: { id: item.id },
                    })
                  }
                  style={styles.headCell}
                >
                  <Text style={styles.headName}>{item.name}</Text>
                  <Text style={styles.hint}>View details</Text>
                </Pressable>
              ))}
            </View>
            {comparison.rows.map((row) => (
              <View key={row.label}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <View style={styles.columns}>
                  {(['a', 'b'] as const).map((side) => (
                    <View
                      key={side}
                      style={[
                        styles.cell,
                        row.better === side && styles.cellBetter,
                      ]}
                    >
                      <Text style={styles.cellText}>{row[side]}</Text>
                      {row.better === side && (
                        <Text style={styles.betterTag}>Better</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {[
              ['Amenities you get at both', comparison.shared],
              [`Only at ${first.name}`, comparison.onlyA],
              [`Only at ${second.name}`, comparison.onlyB],
            ].map(([title, items]) => (
              <View key={title as string} style={styles.section}>
                <Text style={styles.sectionTitle}>{title as string}</Text>
                {(items as string[]).length ? (
                  <View style={styles.chips}>
                    {(items as string[]).map((name) => (
                      <View key={name} style={styles.chip}>
                        <Text style={styles.chipText}>{name}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.hint}>None</Text>
                )}
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose a different guesthouse to compare"
              onPress={() => setOtherId('')}
              style={styles.action}
            >
              <Text style={styles.actionText}>Compare with another</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
