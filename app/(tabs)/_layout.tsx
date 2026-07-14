import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Link, Tabs, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/theme/tokens';

const TAB_PILL_HEIGHT = 36;

function HeaderSettings() {
  return (
    <Link href="/settings" asChild>
      <Pressable style={{ paddingHorizontal: 12 }}>
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            color: colors.primary,
            fontSize: 15,
          }}
        >
          Settings
        </Text>
      </Pressable>
    </Link>
  );
}

function useTabFocus(route: 'index' | 'notes' | 'groceries'): boolean {
  const pathname = usePathname();
  if (route === 'index') {
    return (
      pathname === '/' ||
      pathname === '/index' ||
      pathname.endsWith('/(tabs)') ||
      pathname.endsWith('/(tabs)/') ||
      pathname.endsWith('/(tabs)/index')
    );
  }
  return pathname.includes(`/${route}`);
}

function TabBarTextButton({
  label,
  route,
  style,
  onPress,
}: {
  label: string;
  route: 'index' | 'notes' | 'groceries';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const focused = useTabFocus(route);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[style, styles.tabButton]}
    >
      <View style={[styles.navPill, focused && styles.navPillSelected]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={[
            styles.navLabel,
            focused ? styles.navLabelSelected : styles.navLabelIdle,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function BlurtTabButton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Blurt"
      onPress={() => router.push('/blurt')}
      style={[style, styles.tabButton, styles.blurtButton]}
    >
      <View style={styles.blurtPill}>
        <Text numberOfLines={1} style={styles.blurtLabel}>
          Blurt
        </Text>
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.paperWhite },
          headerTitleStyle: {
            fontFamily: 'Nunito_800ExtraBold',
            color: colors.primary,
            fontSize: 22,
          },
          headerRight: () => <HeaderSettings />,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.fadedGray,
          tabBarShowLabel: false,
          tabBarIcon: () => null,
          tabBarStyle: {
            borderTopColor: colors.fadedGray,
            borderTopWidth: 2,
            backgroundColor: colors.paperWhite,
            height: tabBarHeight,
            paddingTop: 0,
            paddingBottom: insets.bottom,
            paddingHorizontal: spacing[8],
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}
      >
        <Tabs.Screen
          name="blurt-tab"
          options={{
            title: 'Blurt',
            tabBarItemStyle: {
              flex: 0,
              justifyContent: 'center',
              alignSelf: 'stretch',
            },
            tabBarButton: (props) => <BlurtTabButton style={props.style} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Todos',
            tabBarButton: (props) => (
              <TabBarTextButton
                label="Todos"
                route="index"
                style={props.style}
                onPress={props.onPress as (() => void) | undefined}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: 'Notes',
            tabBarButton: (props) => (
              <TabBarTextButton
                label="Notes"
                route="notes"
                style={props.style}
                onPress={props.onPress as (() => void) | undefined}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="groceries"
          options={{
            title: 'Groceries',
            tabBarButton: (props) => (
              <TabBarTextButton
                label="Groceries"
                route="groceries"
                style={props.style}
                onPress={props.onPress as (() => void) | undefined}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  blurtButton: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    paddingHorizontal: 4,
  },
  navPill: {
    height: TAB_PILL_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: radii.control,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  navPillSelected: {
    backgroundColor: colors.softWash,
    borderColor: colors.primary,
  },
  navLabel: {
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 16,
    textAlign: 'center',
  },
  navLabelSelected: {
    color: colors.primary,
  },
  navLabelIdle: {
    color: colors.fadedGray,
  },
  blurtPill: {
    height: TAB_PILL_HEIGHT,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.nightInk,
    borderRadius: radii.control,
    paddingHorizontal: spacing[12],
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurtLabel: {
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.paperWhite,
    textAlign: 'center',
    lineHeight: 16,
  },
});
