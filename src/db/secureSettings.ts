import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_KEY_KEY = 'better_notes_api_key';

/** SecureStore has no web implementation; AsyncStorage is fine for local web/dev. */
async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getApiKey(): Promise<string | null> {
  try {
    if (await canUseSecureStore()) {
      return await SecureStore.getItemAsync(API_KEY_KEY);
    }
    return await AsyncStorage.getItem(API_KEY_KEY);
  } catch {
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  const value = key.trim();
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(API_KEY_KEY, value);
    return;
  }
  await AsyncStorage.setItem(API_KEY_KEY, value);
}

export async function clearApiKey(): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(API_KEY_KEY);
    return;
  }
  await AsyncStorage.removeItem(API_KEY_KEY);
}
