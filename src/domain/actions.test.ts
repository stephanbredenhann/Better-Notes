import assert from 'node:assert/strict';
import { parseActionsFromModelText } from './actions';
import { applyActions } from './applyActions';
import type { WorkspaceState } from './applyActions';

const empty: WorkspaceState = {
  notes: [],
  todos: [],
  groceries: [],
  streak: { current: 0, longest: 0, lastCompletedDate: null },
};

{
  const actions = parseActionsFromModelText(`\`\`\`json
{"actions":[{"type":"create_todo","title":"Call dentist","dueAt":"2026-07-12T15:00:00","place":"Clinic"},{"type":"add_grocery","text":"Milk"},{"type":"create_note","title":"Ideas","body":"Ship the app"}]}
\`\`\``);
  assert.equal(actions.length, 3);
  const { state, result } = applyActions(empty, actions, '2026-07-11');
  assert.equal(state.todos.length, 1);
  assert.equal(state.todos[0].place, 'Clinic');
  assert.equal(state.todos[0].linkedGroceryId, null);
  assert.equal(state.groceries[0].text, 'Milk');
  assert.equal(state.notes[0].title, 'Ideas');
  assert.ok(result.summaryLines.length >= 3);
}

{
  const withTodo: WorkspaceState = {
    ...empty,
    todos: [
      {
        id: 't1',
        title: 'Buy stamps',
        done: false,
        dueAt: null,
        place: null,
        createdAt: '2026-07-11T00:00:00.000Z',
        completedAt: null,
        linkedGroceryId: null,
      },
    ],
  };
  const actions = parseActionsFromModelText(
    JSON.stringify({
      actions: [{ type: 'complete_todo', id: 't1' }],
    })
  );
  const { state, result } = applyActions(withTodo, actions, '2026-07-11');
  assert.equal(state.todos[0].done, true);
  assert.equal(state.streak.current, 1);
  assert.equal(result.streakCelebrated, true);
}

{
  const withGrocery: WorkspaceState = {
    ...empty,
    groceries: [
      {
        id: 'g1',
        text: 'Eggs',
        checked: false,
        createdAt: '2026-07-11T00:00:00.000Z',
      },
    ],
  };
  const actions = parseActionsFromModelText(
    JSON.stringify({
      actions: [{ type: 'add_grocery', text: 'eggs' }],
    })
  );
  const { state } = applyActions(withGrocery, actions, '2026-07-11');
  assert.equal(state.groceries.length, 1);
}

{
  const actions = parseActionsFromModelText(
    JSON.stringify({
      actions: [
        {
          type: 'create_todo',
          title: 'Get milk',
          dueAt: '2026-07-14T14:00:00',
          place: null,
        },
        { type: 'add_grocery', text: 'milk' },
      ],
    })
  );
  const { state } = applyActions(empty, actions, '2026-07-14');
  assert.equal(state.todos.length, 1);
  assert.equal(state.groceries.length, 1);
  assert.equal(state.todos[0].linkedGroceryId, state.groceries[0].id);
}

{
  const linked: WorkspaceState = {
    ...empty,
    todos: [
      {
        id: 't1',
        title: 'Get milk',
        done: false,
        dueAt: '2026-07-14T14:00:00',
        place: null,
        createdAt: '2026-07-14T00:00:00.000Z',
        completedAt: null,
        linkedGroceryId: 'g1',
      },
    ],
    groceries: [
      {
        id: 'g1',
        text: 'milk',
        checked: false,
        createdAt: '2026-07-14T00:00:00.000Z',
      },
    ],
  };
  const actions = parseActionsFromModelText(
    JSON.stringify({
      actions: [{ type: 'complete_todo', id: 't1' }],
    })
  );
  const { state } = applyActions(linked, actions, '2026-07-14');
  assert.equal(state.todos[0].done, true);
  assert.equal(state.todos[0].linkedGroceryId, null);
  assert.equal(state.groceries.length, 0);
}

{
  const unlinked: WorkspaceState = {
    ...empty,
    todos: [
      {
        id: 't1',
        title: 'Buy eggs from store',
        done: false,
        dueAt: null,
        place: null,
        createdAt: '2026-07-14T00:00:00.000Z',
        completedAt: null,
        linkedGroceryId: null,
      },
    ],
    groceries: [
      {
        id: 'g1',
        text: 'eggs',
        checked: false,
        createdAt: '2026-07-14T00:00:00.000Z',
      },
    ],
  };
  const actions = parseActionsFromModelText(
    JSON.stringify({
      actions: [{ type: 'complete_todo', id: 't1' }],
    })
  );
  const { state } = applyActions(unlinked, actions, '2026-07-14');
  assert.equal(state.todos[0].done, true);
  assert.equal(state.groceries.length, 0);
}

console.log('actions.test.ts passed');
