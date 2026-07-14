import React, { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useAppData } from '@/context/AppDataContext';
import { GroceryRow } from '@/components/lists';
import { AddItemModal } from '@/components/AddItemModal';
import { EmptyState, PrimaryButton, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export default function GroceriesScreen() {
  const { ready, groceries, toggleGrocery, removeGrocery, addGrocery } =
    useAppData();
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
      <FlatList
        data={groceries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing[16], flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="Grocery list is empty"
            body="Blurt “need milk and eggs” and we'll sort it."
          />
        }
        renderItem={({ item }) => (
          <GroceryRow
            item={item}
            onToggle={() => toggleGrocery(item.id)}
            onDelete={() => removeGrocery(item.id)}
          />
        )}
      />
      <View style={{ paddingBottom: spacing[16], paddingTop: spacing[8] }}>
        <PrimaryButton label="Add grocery" onPress={() => setAddOpen(true)} />
      </View>
      <AddItemModal
        visible={addOpen}
        title="Add grocery"
        placeholder="What do you need?"
        submitLabel="Add grocery"
        onSubmit={(text) => addGrocery(text)}
        onClose={() => setAddOpen(false)}
      />
    </Screen>
  );
}
