import { createId } from '@/utils/id';
import { recordTodoCompletion } from './streak';
import type {
  AiAction,
  ApplyResult,
  GroceryItem,
  Note,
  StreakState,
  Todo,
} from './types';

export type WorkspaceState = {
  notes: Note[];
  todos: Todo[];
  groceries: GroceryItem[];
  streak: StreakState;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function textsOverlap(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function findLinkedGrocery(
  todos: Todo[],
  groceries: GroceryItem[],
  todo: Todo
): GroceryItem | undefined {
  if (todo.linkedGroceryId) {
    const byId = groceries.find((g) => g.id === todo.linkedGroceryId);
    if (byId) return byId;
  }
  return groceries.find((g) => textsOverlap(todo.title, g.text));
}

export function removeGroceryForTodo(
  todos: Todo[],
  groceries: GroceryItem[],
  todo: Todo
): { todos: Todo[]; groceries: GroceryItem[]; removed?: GroceryItem } {
  const linked = findLinkedGrocery(todos, groceries, todo);
  if (!linked) {
    return {
      todos: todos.map((t) =>
        t.id === todo.id ? { ...t, linkedGroceryId: null } : t
      ),
      groceries,
    };
  }
  return {
    todos: todos.map((t) =>
      t.id === todo.id
        ? { ...t, linkedGroceryId: null }
        : t.linkedGroceryId === linked.id
          ? { ...t, linkedGroceryId: null }
          : t
    ),
    groceries: groceries.filter((g) => g.id !== linked.id),
    removed: linked,
  };
}

function findTodo(
  todos: Todo[],
  id?: string,
  titleMatch?: string
): Todo | undefined {
  if (id) {
    const byId = todos.find((t) => t.id === id);
    if (byId) return byId;
  }
  if (titleMatch) {
    const q = titleMatch.toLowerCase();
    return todos.find((t) => t.title.toLowerCase().includes(q));
  }
  return undefined;
}

function findNote(
  notes: Note[],
  id?: string,
  titleMatch?: string
): Note | undefined {
  if (id) {
    const byId = notes.find((n) => n.id === id);
    if (byId) return byId;
  }
  if (titleMatch) {
    const q = titleMatch.toLowerCase();
    return notes.find((n) => n.title.toLowerCase().includes(q));
  }
  return undefined;
}

function findGrocery(
  groceries: GroceryItem[],
  id?: string,
  textMatch?: string
): GroceryItem | undefined {
  if (id) {
    const byId = groceries.find((g) => g.id === id);
    if (byId) return byId;
  }
  if (textMatch) {
    const q = textMatch.toLowerCase();
    return groceries.find((g) => g.text.toLowerCase().includes(q));
  }
  return undefined;
}

function linkNewTodosToGroceries(
  todos: Todo[],
  groceries: GroceryItem[],
  newTodoIds: Set<string>,
  newGroceryIds: Set<string>
): void {
  const newTodos = todos.filter((t) => newTodoIds.has(t.id) && !t.linkedGroceryId);
  const newGroceries = groceries.filter((g) => newGroceryIds.has(g.id));
  const usedGrocery = new Set<string>();

  for (const todo of newTodos) {
    const match = newGroceries.find(
      (g) => !usedGrocery.has(g.id) && textsOverlap(todo.title, g.text)
    );
    if (match) {
      todo.linkedGroceryId = match.id;
      usedGrocery.add(match.id);
    }
  }
}

export function applyActions(
  state: WorkspaceState,
  actions: AiAction[],
  today: string
): { state: WorkspaceState; result: ApplyResult } {
  let notes = [...state.notes];
  let todos = state.todos.map((t) => ({ ...t }));
  let groceries = state.groceries.map((g) => ({ ...g }));
  let streak = { ...state.streak };
  const summaryLines: string[] = [];
  let streakCelebrated = false;
  const newTodoIds = new Set<string>();
  const newGroceryIds = new Set<string>();

  const removeLinkedGrocery = (todo: Todo) => {
    const result = removeGroceryForTodo(todos, groceries, todo);
    todos = result.todos;
    groceries = result.groceries;
    if (result.removed) {
      summaryLines.push(`Removed grocery “${result.removed.text}”`);
    }
  };

  const completeTodo = (todo: Todo) => {
    if (todo.done) return;
    todo.done = true;
    todo.completedAt = nowIso();
    const { streak: next, celebrated } = recordTodoCompletion(streak, today);
    streak = next;
    if (celebrated) streakCelebrated = true;
    removeLinkedGrocery(todo);
  };

  for (const action of actions) {
    switch (action.type) {
      case 'create_todo': {
        const todo: Todo = {
          id: createId(),
          title: action.title,
          done: false,
          dueAt: action.dueAt ?? null,
          place: action.place ?? null,
          createdAt: nowIso(),
          completedAt: null,
          linkedGroceryId: null,
        };
        todos.push(todo);
        newTodoIds.add(todo.id);
        const meta = [
          action.dueAt ? `due ${action.dueAt}` : null,
          action.place ? `at ${action.place}` : null,
        ]
          .filter(Boolean)
          .join(', ');
        summaryLines.push(
          meta ? `Added todo “${todo.title}” (${meta})` : `Added todo “${todo.title}”`
        );
        break;
      }
      case 'update_todo': {
        const todo = findTodo(todos, action.id, action.titleMatch);
        if (!todo) {
          summaryLines.push('Skipped update_todo (not found)');
          break;
        }
        if (action.title !== undefined) todo.title = action.title;
        if (action.dueAt !== undefined) todo.dueAt = action.dueAt;
        if (action.place !== undefined) todo.place = action.place;
        if (action.done === true) completeTodo(todo);
        if (action.done === false) {
          todo.done = false;
          todo.completedAt = null;
        }
        summaryLines.push(`Updated todo “${todo.title}”`);
        break;
      }
      case 'complete_todo': {
        const todo = findTodo(todos, action.id, action.titleMatch);
        if (!todo) {
          summaryLines.push('Skipped complete_todo (not found)');
          break;
        }
        completeTodo(todo);
        summaryLines.push(`Completed todo “${todo.title}”`);
        break;
      }
      case 'add_grocery': {
        const exact = groceries.find(
          (g) =>
            !g.checked &&
            g.text.toLowerCase() === action.text.toLowerCase()
        );
        if (exact) {
          summaryLines.push(`Grocery already listed: “${exact.text}”`);
          // Still count as linkable for same-batch todos
          newGroceryIds.add(exact.id);
          break;
        }
        const item: GroceryItem = {
          id: createId(),
          text: action.text,
          checked: false,
          createdAt: nowIso(),
        };
        groceries.push(item);
        newGroceryIds.add(item.id);
        summaryLines.push(`Added grocery “${item.text}”`);
        break;
      }
      case 'check_grocery': {
        const item = findGrocery(groceries, action.id, action.textMatch);
        if (!item) {
          summaryLines.push('Skipped check_grocery (not found)');
          break;
        }
        item.checked = true;
        summaryLines.push(`Checked grocery “${item.text}”`);
        break;
      }
      case 'create_note': {
        const note: Note = {
          id: createId(),
          title: action.title,
          body: action.body,
          updatedAt: nowIso(),
        };
        notes.push(note);
        summaryLines.push(`Created note “${note.title}”`);
        break;
      }
      case 'append_note': {
        const note = findNote(notes, action.id, action.titleMatch);
        if (!note) {
          summaryLines.push('Skipped append_note (not found)');
          break;
        }
        note.body = note.body
          ? `${note.body.trimEnd()}\n\n${action.body}`
          : action.body;
        note.updatedAt = nowIso();
        summaryLines.push(`Appended to note “${note.title}”`);
        break;
      }
      case 'update_note': {
        const note = findNote(notes, action.id, action.titleMatch);
        if (!note) {
          summaryLines.push('Skipped update_note (not found)');
          break;
        }
        if (action.title !== undefined) note.title = action.title;
        if (action.body !== undefined) note.body = action.body;
        note.updatedAt = nowIso();
        summaryLines.push(`Updated note “${note.title}”`);
        break;
      }
    }
  }

  linkNewTodosToGroceries(todos, groceries, newTodoIds, newGroceryIds);

  return {
    state: { notes, todos, groceries, streak },
    result: { summaryLines, streakCelebrated },
  };
}
