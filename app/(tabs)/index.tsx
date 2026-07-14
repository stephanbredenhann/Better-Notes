import React, { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useAppData } from '@/context/AppDataContext';
import { TodoRow } from '@/components/lists';
import { AddItemModal } from '@/components/AddItemModal';
import { EmptyState, PrimaryButton, Screen, StreakBanner } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export default function TodosScreen() {
  const {
    ready,
    todos,
    displayStreak,
    lastCelebration,
    completedToday,
    toggleTodo,
    addTodo,
  } = useAppData();
  const [addOpen, setAddOpen] = useState(false);

  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <StreakBanner
        current={displayStreak}
        celebrated={lastCelebration}
        completedToday={completedToday}
      />
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing[16], flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="No todos yet"
            body="Tap Blurt and dump whatever is on your mind."
          />
        }
        renderItem={({ item }) => (
          <TodoRow todo={item} onToggle={() => toggleTodo(item.id)} />
        )}
      />
      <View style={{ paddingBottom: spacing[16], paddingTop: spacing[8] }}>
        <PrimaryButton label="Add todo" onPress={() => setAddOpen(true)} />
      </View>
      <AddItemModal
        visible={addOpen}
        title="Add todo"
        placeholder="What do you need to do?"
        submitLabel="Add todo"
        onSubmit={(title) => addTodo(title)}
        onClose={() => setAddOpen(false)}
      />
    </Screen>
  );
}
