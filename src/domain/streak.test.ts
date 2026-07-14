import assert from 'node:assert/strict';
import {
  displayCurrentStreak,
  hasCompletedStreakToday,
  recordTodoCompletion,
  reconcileStreakWithTodos,
} from './streak';
import type { Todo } from './types';

const empty = { current: 0, longest: 0, lastCompletedDate: null };

{
  const { streak, celebrated } = recordTodoCompletion(empty, '2026-07-11');
  assert.equal(celebrated, true);
  assert.equal(streak.current, 1);
  assert.equal(streak.lastCompletedDate, '2026-07-11');
}

{
  const base = {
    current: 3,
    longest: 5,
    lastCompletedDate: '2026-07-10',
  };
  const { streak, celebrated } = recordTodoCompletion(base, '2026-07-11');
  assert.equal(celebrated, true);
  assert.equal(streak.current, 4);
  assert.equal(streak.longest, 5);
}

{
  const base = {
    current: 2,
    longest: 2,
    lastCompletedDate: '2026-07-11',
  };
  const { streak, celebrated } = recordTodoCompletion(base, '2026-07-11');
  assert.equal(celebrated, false);
  assert.equal(streak.current, 2);
}

{
  const broken = {
    current: 4,
    longest: 4,
    lastCompletedDate: '2026-07-08',
  };
  const { streak } = recordTodoCompletion(broken, '2026-07-11');
  assert.equal(streak.current, 1);
}

{
  const stale = {
    current: 5,
    longest: 5,
    lastCompletedDate: '2026-07-01',
  };
  assert.equal(displayCurrentStreak(stale, '2026-07-11'), 0);
  assert.equal(
    displayCurrentStreak(
      { current: 2, longest: 2, lastCompletedDate: '2026-07-10' },
      '2026-07-11'
    ),
    2
  );
  assert.equal(
    hasCompletedStreakToday(
      { current: 2, longest: 2, lastCompletedDate: '2026-07-11' },
      '2026-07-11'
    ),
    true
  );
  assert.equal(
    hasCompletedStreakToday(
      { current: 2, longest: 2, lastCompletedDate: '2026-07-10' },
      '2026-07-11'
    ),
    false
  );
}

{
  const [y, m, d] = '2026-07-14'.split('-').map(Number);
  const completedAt = new Date(y, m - 1, d, 15, 0, 0).toISOString();
  const todos: Todo[] = [
    {
      id: 't1',
      title: 'Ship',
      done: true,
      dueAt: null,
      place: null,
      createdAt: completedAt,
      completedAt,
      linkedGroceryId: null,
    },
  ];
  const fixed = reconcileStreakWithTodos(empty, todos, '2026-07-14');
  assert.equal(fixed.current, 1);
  assert.equal(fixed.lastCompletedDate, '2026-07-14');
}

console.log('streak.test.ts passed');
