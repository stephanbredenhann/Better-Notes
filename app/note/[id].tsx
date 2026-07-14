import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useAppData } from '@/context/AppDataContext';
import { OutlineButton, PrimaryButton, Screen } from '@/components/ui';
import { colors, radii, spacing, typography } from '@/theme/tokens';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, saveNote, removeNote } = useAppData();
  const existing = useMemo(
    () => notes.find((n) => n.id === id),
    [notes, id]
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setBody(existing.body);
    }
  }, [existing]);

  if (!existing) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Missing note' }} />
      </Screen>
    );
  }

  const onSave = async () => {
    await saveNote({
      ...existing,
      title: title.trim() || 'Untitled',
      body,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  const onDelete = () => {
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeNote(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: title || 'Note' }} />
      <TextInput
        style={styles.title}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.fadedGray}
      />
      <TextInput
        style={styles.body}
        value={body}
        onChangeText={setBody}
        placeholder="Write freely…"
        placeholderTextColor={colors.fadedGray}
        multiline
        textAlignVertical="top"
      />
      <View style={styles.actions}>
        <PrimaryButton label="Save" onPress={onSave} />
        <OutlineButton label="Delete" onPress={onDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.charcoal,
    ...typography.headingSm,
    marginBottom: spacing[12],
  },
  body: {
    flex: 1,
    fontFamily: 'NunitoSans_400Regular',
    color: colors.charcoal,
    ...typography.body,
    borderWidth: 2,
    borderColor: colors.fadedGray,
    borderRadius: radii.control,
    padding: spacing[16],
    minHeight: 240,
  },
  actions: {
    marginTop: spacing[16],
    gap: spacing[12],
    marginBottom: spacing[24],
  },
});
