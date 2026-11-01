import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../styles/AuthTabBar.styles';

import { AuthIcon, AuthIconName } from './AuthIcon';

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];
const items: Record<string, { label: string; icon: AuthIconName }> = {
  index: { label: 'Home', icon: 'homeTab' },
  search: { label: 'Explore', icon: 'exploreTab' },
  favourites: { label: 'Favourites', icon: 'favouritesTab' },
  login: { label: 'Profile', icon: 'profileTab' },
};

// Figma authentication navigation (59:2045), using the existing Expo routes.
export function AuthTabBar({ state, navigation, insets }: TabBarProps) {
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom, height: 64 + insets.bottom },
      ]}
    >
      {state.routes.map((route, index) => {
        const item = items[route.name];
        if (!item) return null;
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: focused }}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented)
                navigation.navigate(route.name, route.params);
            }}
            onLongPress={() =>
              navigation.emit({ type: 'tabLongPress', target: route.key })
            }
          >
            <AuthIcon name={item.icon} />
            <Text style={[styles.label, focused && styles.activeLabel]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
