import React from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useAppData } from '@/context/AppDataContext';
import { NoteRow } from '@/components/lists';
import { EmptyState, PrimaryButton, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export default function NotesScreen() {
  const { ready, notes, createBlankNote } = useAppData();

  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing[16], flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="No notes yet"
            body="Blurt ideas, or create a blank note."
          />
        }
        renderItem={({ item }) => <NoteRow note={item} />}
      />
      <View style={{ paddingBottom: spacing[16], paddingTop: spacing[8] }}>
        <PrimaryButton
          label="New note"
          onPress={async () => {
            const note = await createBlankNote();
            router.push(`/note/${note.id}`);
          }}
        />
      </View>
    </Screen>
  );
}
