import type { StreakState, Todo } from './types';

/** Local calendar date YYYY-MM-DD */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  const ms =
    parseLocalDate(b).getTime() - parseLocalDate(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

/**
 * Call when a todo is completed. Grocery checks must not call this.
 * Returns updated streak and whether this completion celebrated a new streak day.
 */
export function recordTodoCompletion(
  streak: StreakState,
  today: string = localDateString()
): { streak: StreakState; celebrated: boolean } {
  if (streak.lastCompletedDate === today) {
    return { streak, celebrated: false };
  }

  let current = 1;
  if (streak.lastCompletedDate) {
    const gap = daysBetween(streak.lastCompletedDate, today);
    if (gap === 1) {
      current = streak.current + 1;
    } else if (gap <= 0) {
      // same day already handled; future date treat as reset
      current = 1;
    }
  }

  const longest = Math.max(streak.longest, current);
  return {
    streak: {
      current,
      longest,
      lastCompletedDate: today,
    },
    celebrated: true,
  };
}

/** Display helper: if last completion was before yesterday, show 0. */
export function displayCurrentStreak(
  streak: StreakState,
  today: string = localDateString()
): number {
  if (!streak.lastCompletedDate) return 0;
  const gap = daysBetween(streak.lastCompletedDate, today);
  if (gap === 0 || gap === 1) return streak.current;
  return 0;
}

export function hasCompletedStreakToday(
  streak: StreakState,
  today: string = localDateString()
): boolean {
  return streak.lastCompletedDate === today;
}

/** If todos show a completion today but streak lagged, advance streak once. */
export function reconcileStreakWithTodos(
  streak: StreakState,
  todos: Todo[],
  today: string = localDateString()
): StreakState {
  if (streak.lastCompletedDate === today) return streak;
  const doneToday = todos.some((t) => {
    if (!t.done || !t.completedAt) return false;
    return localDateString(new Date(t.completedAt)) === today;
  });
  if (!doneToday) return streak;
  return recordTodoCompletion(streak, today).streak;
}
