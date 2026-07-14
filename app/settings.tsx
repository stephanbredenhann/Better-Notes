import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppData } from '@/context/AppDataContext';
import { getApiKey } from '@/db/secureSettings';
import { ensureNotificationPermission } from '@/services/reminders';
import {
  Muted,
  OutlineButton,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import type { AppSettings } from '@/domain/types';

const DEEPSEEK = {
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
};

export default function SettingsScreen() {
  const { settings, updateSettings, saveApiKey, hasApiKey } = useAppData();
  const [apiKey, setApiKeyField] = useState('');
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  const [lead, setLead] = useState(String(settings.reminderLeadMinutes));
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setBaseUrl(settings.baseUrl);
    setModel(settings.model);
    setLead(String(settings.reminderLeadMinutes));
  }, [settings]);

  useEffect(() => {
    (async () => {
      const key = await getApiKey();
      if (key) setApiKeyField(key);
    })();
  }, []);

  const onSave = async () => {
    const minutes = Number(lead);
    if (!Number.isFinite(minutes) || minutes < 0) {
      Alert.alert('Invalid lead time', 'Use a non-negative number of minutes.');
      return;
    }
    if (apiKey.trim()) {
      await saveApiKey(apiKey.trim());
    }
    const next: AppSettings = {
      baseUrl: baseUrl.trim().replace(/\/+$/, ''),
      model: model.trim(),
      reminderLeadMinutes: minutes,
    };
    await updateSettings(next);
    const granted = await ensureNotificationPermission();
    setSavedMsg(
      granted
        ? 'Saved. Reminders permission is on.'
        : 'Saved. Enable notifications to get reminders before due times.'
    );
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing[48] }}
      >
        <Muted>
          Bring your own key. Nothing syncs to our servers - only your chosen AI
          provider sees blurts.
        </Muted>

        <Text style={styles.label}>API key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKeyField}
          placeholder={hasApiKey ? '••••••••' : 'sk-...'}
          placeholderTextColor={colors.fadedGray}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Text style={styles.label}>Base URL</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://api.deepseek.com/v1"
          placeholderTextColor={colors.fadedGray}
        />
        <View style={{ marginBottom: spacing[12] }}>
          <OutlineButton
            label="Use DeepSeek preset"
            onPress={() => {
              setBaseUrl(DEEPSEEK.baseUrl);
              setModel(DEEPSEEK.model);
            }}
          />
        </View>

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="deepseek-chat"
          placeholderTextColor={colors.fadedGray}
        />

        <Text style={styles.label}>Reminder lead time (minutes)</Text>
        <TextInput
          style={styles.input}
          value={lead}
          onChangeText={setLead}
          keyboardType="number-pad"
        />
        <Muted>
          Local notifications only - no calendar write. Grant notification
          permission when prompted.
        </Muted>

        <View style={{ marginTop: spacing[24] }}>
          <PrimaryButton label="Save" onPress={onSave} />
        </View>
        {savedMsg ? (
          <Text style={styles.saved}>{savedMsg}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: spacing[16],
    marginBottom: spacing[8],
    fontFamily: 'NunitoSans_700Bold',
    color: colors.charcoal,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 2,
    borderColor: colors.fadedGray,
    borderRadius: radii.control,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    fontFamily: 'NunitoSans_400Regular',
    color: colors.charcoal,
    ...typography.body,
    backgroundColor: colors.paperWhite,
    marginBottom: spacing[8],
  },
  saved: {
    marginTop: spacing[16],
    fontFamily: 'NunitoSans_700Bold',
    color: colors.primary,
  },
});
