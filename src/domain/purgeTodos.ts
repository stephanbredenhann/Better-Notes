import type { Todo } from './types';
import { localDateString } from './streak';

/** True when a completed todo should be cleared (completed before today). */
export function isStaleCompletedTodo(
  todo: Todo,
  today: string = localDateString()
): boolean {
  if (!todo.done) return false;
  if (!todo.completedAt) return true;
  const completedDay = localDateString(new Date(todo.completedAt));
  return completedDay < today;
}

/** Drop todos finished on a previous local calendar day. */
export function purgeStaleCompletedTodos(
  todos: Todo[],
  today: string = localDateString()
): Todo[] {
  return todos.filter((t) => !isStaleCompletedTodo(t, today));
}

/** Ms until next local midnight. */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(next.getTime() - now.getTime(), 0);
}
