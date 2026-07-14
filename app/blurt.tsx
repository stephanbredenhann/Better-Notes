import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Network from 'expo-network';
import { useAppData } from '@/context/AppDataContext';
import {
  isSpeechRecognitionAvailable,
  startListening,
  stopListening,
  useSpeechRecognitionEvent,
} from '@/services/speech';
import {
  Muted,
  OutlineButton,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type SpeechResultEvent = {
  results: Array<{ transcript: string }>;
};

export default function BlurtScreen() {
  const {
    hasApiKey,
    runBlurt,
    undoLastBlurt,
    lastSummary,
    lastUndo,
    clearSummary,
  } = useAppData();
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const speechBaseRef = useRef('');

  useEffect(() => {
    setSpeechAvailable(isSpeechRecognitionAvailable());
    return () => stopListening();
  }, []);

  useSpeechRecognitionEvent('result', ((event: SpeechResultEvent) => {
    const transcript = event.results
      .map((r) => r.transcript)
      .join(' ')
      .trim();
    if (!transcript) return;
    const prefix = speechBaseRef.current.trim();
    setText(prefix ? `${prefix} ${transcript}` : transcript);
  }) as (...args: never[]) => void);

  useSpeechRecognitionEvent('end', (() => setListening(false)) as (...args: never[]) => void);
  useSpeechRecognitionEvent(
    'error',
    (() => {
      setListening(false);
      setError('Speech recognition failed. Try the keyboard mic instead.');
    }) as (...args: never[]) => void
  );

  const onMic = async () => {
    setError(null);
    if (listening) {
      stopListening();
      setListening(false);
      return;
    }
    speechBaseRef.current = text;
    const started = await startListening();
    if (!started) {
      setError(
        'On-device speech isn’t available. Use your keyboard’s speak-to-type.'
      );
      return;
    }
    setListening(true);
  };

  const onSend = async () => {
    const blurt = text.trim();
    if (!blurt || busy) return;
    setError(null);
    setBusy(true);
    try {
      const network = await Network.getNetworkStateAsync();
      if (!network.isConnected) {
        throw new Error('You’re offline. Blurt needs a network connection.');
      }
      if (!hasApiKey) {
        throw new Error('Add your API key in Settings first.');
      }
      const result = await runBlurt(blurt);
      setSummary(result.summaryLines);
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const shownSummary = summary ?? lastSummary;

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing[40] }}
      >
        <Muted>
          Dump everything: todos, groceries, notes, times, places. We'll sort
          it.
        </Muted>

        <TextInput
          style={styles.input}
          multiline
          placeholder="Need milk, call Mom Saturday at 3, add ideas to Project X…"
          placeholderTextColor={colors.fadedGray}
          value={text}
          onChangeText={setText}
          editable={!busy}
          textAlignVertical="top"
        />

        {speechAvailable ? (
          <View style={{ marginBottom: spacing[12] }}>
            <OutlineButton
              label={listening ? 'Stop listening' : 'Speak'}
              onPress={onMic}
              disabled={busy}
            />
          </View>
        ) : (
          <View style={{ marginBottom: spacing[12] }}>
            <Muted>
              Mic unavailable here - use your keyboard's speak-to-type if you
              want voice.
            </Muted>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {busy ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Muted>Sorting your blurt…</Muted>
          </View>
        ) : (
          <PrimaryButton
            label="Send"
            onPress={onSend}
            disabled={!text.trim()}
          />
        )}

        {shownSummary && shownSummary.length > 0 ? (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Here’s what I did</Text>
            {shownSummary.map((line, idx) => (
              <Text key={`${idx}-${line}`} style={styles.summaryLine}>
                • {line}
              </Text>
            ))}
            <View style={styles.summaryActions}>
              {lastUndo ? (
                <OutlineButton
                  label="Undo"
                  onPress={async () => {
                    await undoLastBlurt();
                    setSummary(null);
                  }}
                />
              ) : null}
              <PrimaryButton
                label="Done"
                onPress={() => {
                  clearSummary();
                  setSummary(null);
                  router.back();
                }}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: spacing[16],
    marginBottom: spacing[16],
    minHeight: 160,
    borderWidth: 2,
    borderColor: colors.fadedGray,
    borderRadius: radii.control,
    padding: spacing[16],
    fontFamily: 'NunitoSans_400Regular',
    color: colors.charcoal,
    ...typography.body,
    backgroundColor: colors.paperWhite,
  },
  error: {
    fontFamily: 'NunitoSans_700Bold',
    color: colors.danger,
    marginBottom: spacing[12],
  },
  loading: {
    alignItems: 'center',
    gap: spacing[8],
    paddingVertical: spacing[16],
  },
  summary: {
    marginTop: spacing[24],
    padding: spacing[16],
    borderRadius: radii.control,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.softWash,
    gap: spacing[8],
  },
  summaryTitle: {
    fontFamily: 'Nunito_700Bold',
    color: colors.charcoal,
    ...typography.subheading,
    marginBottom: spacing[8],
  },
  summaryLine: {
    fontFamily: 'NunitoSans_400Regular',
    color: colors.charcoal,
    ...typography.body,
  },
  summaryActions: {
    marginTop: spacing[16],
    gap: spacing[12],
  },
});
