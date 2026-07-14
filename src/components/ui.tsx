import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '@/theme/tokens';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({
  children,
  numberOfLines,
}: {
  children: React.ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text style={styles.muted} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.outlineBtn,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.outlineBtnText}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Muted>{body}</Muted>
    </View>
  );
}

export function StreakBanner({
  current,
  celebrated,
  completedToday,
}: {
  current: number;
  celebrated?: boolean;
  completedToday?: boolean;
}) {
  let message = 'Complete a todo today to start a streak.';
  if (celebrated) {
    message =
      current <= 1
        ? 'Nice - first todo done today!'
        : `Day ${current} locked in!`;
  } else if (completedToday) {
    message = 'Done for today. Come back tomorrow.';
  } else if (current > 0) {
    message = 'Complete a todo today to keep it going.';
  }

  return (
    <View style={[styles.streak, (celebrated || completedToday) && styles.streakCelebrate]}>
      <View style={styles.streakBadge}>
        <Text style={styles.streakBadgeText}>{current}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.streakTitle}>Day streak</Text>
        <Muted>{message}</Muted>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paperWhite,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.primary,
    ...typography.headingSm,
    marginBottom: spacing[12],
  },
  muted: {
    fontFamily: 'NunitoSans_400Regular',
    color: colors.pencilGray,
    ...typography.body,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'NunitoSans_700Bold',
    color: colors.paperWhite,
    fontSize: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  outlineBtn: {
    borderWidth: 2,
    borderColor: colors.fadedGray,
    borderRadius: radii.control,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    alignItems: 'center',
    backgroundColor: colors.paperWhite,
  },
  outlineBtnText: {
    fontFamily: 'NunitoSans_700Bold',
    color: colors.primary,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
  empty: {
    paddingVertical: spacing[40],
    alignItems: 'center',
    gap: spacing[8],
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    color: colors.charcoal,
    ...typography.subheading,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    backgroundColor: colors.softWash,
    borderRadius: radii.control,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing[12],
    marginBottom: spacing[16],
  },
  streakCelebrate: {
    borderColor: colors.nightInk,
  },
  streakBadge: {
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  streakBadgeText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.paperWhite,
    fontSize: 20,
  },
  streakTitle: {
    fontFamily: 'Nunito_700Bold',
    color: colors.charcoal,
    fontSize: 17,
  },
});
