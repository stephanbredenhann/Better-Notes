import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  NunitoSans_400Regular,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { AppDataProvider } from '@/context/AppDataContext';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    NunitoSans_400Regular,
    NunitoSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.paperWhite,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppDataProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="blurt"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Blurt',
              headerTitleStyle: {
                fontFamily: 'Nunito_700Bold',
                color: colors.charcoal,
              },
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Settings',
              headerTitleStyle: {
                fontFamily: 'Nunito_700Bold',
                color: colors.charcoal,
              },
            }}
          />
          <Stack.Screen
            name="note/[id]"
            options={{
              headerShown: true,
              title: 'Note',
              headerTitleStyle: {
                fontFamily: 'Nunito_700Bold',
                color: colors.charcoal,
              },
            }}
          />
        </Stack>
      </AppDataProvider>
    </GestureHandlerRootView>
  );
}
