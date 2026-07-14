import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import type { GroceryItem, Note, Todo } from '@/domain/types';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import { Muted } from './ui';

function formatDue(dueAt: string | null): string | null {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return dueAt;
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function DeleteAction({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.deleteAction}>
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );
}

export function TodoRow({
  todo,
  onToggle,
}: {
  todo: Todo;
  onToggle: () => void;
}) {
  const due = formatDue(todo.dueAt);

  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.checkbox, todo.done && styles.checkboxOn]}>
        {todo.done ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, todo.done && styles.doneText]}>
          {todo.title}
        </Text>
        {(due || todo.place) && (
          <Muted>
            {[due, todo.place].filter(Boolean).join(' · ')}
          </Muted>
        )}
      </View>
    </Pressable>
  );
}

export function GroceryRow({
  item,
  onToggle,
  onDelete,
}: {
  item: GroceryItem;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const swipeRef = React.useRef<Swipeable>(null);

  const row = (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.checkbox, item.checked && styles.checkboxOn]}>
        {item.checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={[styles.rowTitle, item.checked && styles.doneText]}>
        {item.text}
      </Text>
    </Pressable>
  );

  if (!onDelete) {
    return row;
  }

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      renderRightActions={() => (
        <DeleteAction
          onPress={() => {
            swipeRef.current?.close();
            onDelete();
          }}
        />
      )}
    >
      {row}
    </Swipeable>
  );
}

export function NoteRow({ note }: { note: Note }) {
  return (
    <Link href={`/note/${note.id}`} asChild>
      <Pressable style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{note.title}</Text>
          {!!note.body && (
            <Muted numberOfLines={2}>{note.body}</Muted>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[12],
    borderWidth: 2,
    borderColor: colors.fadedGray,
    borderRadius: radii.control,
    backgroundColor: colors.paperWhite,
    marginBottom: spacing[12],
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.fadedGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: colors.paperWhite,
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 16,
  },
  rowTitle: {
    fontFamily: 'NunitoSans_700Bold',
    color: colors.charcoal,
    ...typography.body,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: colors.pencilGray,
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    marginBottom: spacing[12],
    borderRadius: radii.control,
  },
  deleteText: {
    fontFamily: 'NunitoSans_700Bold',
    color: colors.paperWhite,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
