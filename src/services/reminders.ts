import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Todo } from '@/domain/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

function reminderId(todoId: string): string {
  return `todo-reminder-${todoId}`;
}

export async function syncTodoReminders(
  todos: Todo[],
  leadMinutes: number
): Promise<{ scheduled: number; skippedPermission: boolean }> {
  if (Platform.OS === 'web') {
    return { scheduled: 0, skippedPermission: true };
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return { scheduled: 0, skippedPermission: true };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('todos', {
      name: 'Todo reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Cancel prior scheduled reminders for our namespace by canceling known ids
  for (const todo of todos) {
    await Notifications.cancelScheduledNotificationAsync(reminderId(todo.id)).catch(
      () => undefined
    );
  }

  let scheduled = 0;
  const now = Date.now();
  for (const todo of todos) {
    if (todo.done || !todo.dueAt) continue;
    const due = new Date(todo.dueAt).getTime();
    if (Number.isNaN(due)) continue;
    const fireAt = due - leadMinutes * 60 * 1000;
    if (fireAt <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(todo.id),
      content: {
        title: 'Upcoming todo',
        body: todo.place
          ? `${todo.title} · ${todo.place}`
          : todo.title,
        data: { todoId: todo.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        channelId: Platform.OS === 'android' ? 'todos' : undefined,
      },
    });
    scheduled += 1;
  }

  return { scheduled, skippedPermission: false };
}
