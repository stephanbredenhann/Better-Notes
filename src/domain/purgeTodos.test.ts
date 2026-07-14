import assert from 'node:assert/strict';
import {
  isStaleCompletedTodo,
  msUntilNextLocalMidnight,
  purgeStaleCompletedTodos,
} from './purgeTodos';
import type { Todo } from './types';

function localNoonIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

const base: Todo = {
  id: 't1',
  title: 'Done thing',
  done: true,
  dueAt: null,
  place: null,
  createdAt: localNoonIso('2026-07-13'),
  completedAt: localNoonIso('2026-07-13'),
  linkedGroceryId: null,
};

{
  assert.equal(isStaleCompletedTodo(base, '2026-07-14'), true);
  assert.equal(isStaleCompletedTodo(base, '2026-07-13'), false);
  assert.equal(
    isStaleCompletedTodo({ ...base, done: false }, '2026-07-14'),
    false
  );
}

{
  const open: Todo = { ...base, id: 't2', done: false, completedAt: null };
  const todayDone: Todo = {
    ...base,
    id: 't3',
    completedAt: localNoonIso('2026-07-14'),
  };
  const kept = purgeStaleCompletedTodos([base, open, todayDone], '2026-07-14');
  assert.equal(kept.length, 2);
  assert.ok(kept.every((t) => t.id !== 't1'));
}

{
  const now = new Date(2026, 6, 14, 23, 59, 0);
  const ms = msUntilNextLocalMidnight(now);
  assert.ok(ms > 0 && ms <= 60_000);
}

console.log('purgeTodos.test.ts passed');
