import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppSettings,
  GroceryItem,
  Note,
  StreakState,
  Todo,
} from '@/domain/types';
import { DEFAULT_SETTINGS } from '@/domain/types';

const STORAGE_KEY = 'better_notes_workspace_v1';

type WorkspaceBlob = {
  notes: Note[];
  todos: Todo[];
  groceries: GroceryItem[];
  streak: StreakState;
  settings: AppSettings;
};

const emptyWorkspace = (): WorkspaceBlob => ({
  notes: [],
  todos: [],
  groceries: [],
  streak: { current: 0, longest: 0, lastCompletedDate: null },
  settings: { ...DEFAULT_SETTINGS },
});

function normalizeTodo(t: Partial<Todo> & Pick<Todo, 'id' | 'title'>): Todo {
  return {
    id: t.id,
    title: t.title,
    done: !!t.done,
    dueAt: t.dueAt ?? null,
    place: t.place ?? null,
    createdAt: t.createdAt ?? new Date().toISOString(),
    completedAt: t.completedAt ?? null,
    linkedGroceryId: t.linkedGroceryId ?? null,
  };
}

async function readWorkspace(): Promise<WorkspaceBlob> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    const parsed = JSON.parse(raw) as Partial<WorkspaceBlob>;
    return {
      notes: parsed.notes ?? [],
      todos: (parsed.todos ?? []).map((t) => normalizeTodo(t)),
      groceries: parsed.groceries ?? [],
      streak: parsed.streak ?? emptyWorkspace().streak,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return emptyWorkspace();
  }
}

async function writeWorkspace(next: WorkspaceBlob): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function loadNotes(): Promise<Note[]> {
  const ws = await readWorkspace();
  return [...ws.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadTodos(): Promise<Todo[]> {
  const ws = await readWorkspace();
  return [...ws.todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function loadGroceries(): Promise<GroceryItem[]> {
  const ws = await readWorkspace();
  return [...ws.groceries].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function loadStreak(): Promise<StreakState> {
  return (await readWorkspace()).streak;
}

export async function loadSettings(): Promise<AppSettings> {
  return (await readWorkspace()).settings;
}

export async function replaceWorkspace(input: {
  notes: Note[];
  todos: Todo[];
  groceries: GroceryItem[];
  streak: StreakState;
}): Promise<void> {
  const ws = await readWorkspace();
  await writeWorkspace({
    ...ws,
    notes: input.notes,
    todos: input.todos,
    groceries: input.groceries,
    streak: input.streak,
  });
}

export async function upsertNote(note: Note): Promise<void> {
  const ws = await readWorkspace();
  const idx = ws.notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) ws.notes[idx] = note;
  else ws.notes.unshift(note);
  await writeWorkspace(ws);
}

export async function deleteNote(id: string): Promise<void> {
  const ws = await readWorkspace();
  ws.notes = ws.notes.filter((n) => n.id !== id);
  await writeWorkspace(ws);
}

export async function upsertTodo(todo: Todo): Promise<void> {
  const ws = await readWorkspace();
  const idx = ws.todos.findIndex((t) => t.id === todo.id);
  if (idx >= 0) ws.todos[idx] = todo;
  else ws.todos.unshift(todo);
  await writeWorkspace(ws);
}

export async function deleteTodo(id: string): Promise<void> {
  const ws = await readWorkspace();
  ws.todos = ws.todos.filter((t) => t.id !== id);
  await writeWorkspace(ws);
}

export async function upsertGrocery(item: GroceryItem): Promise<void> {
  const ws = await readWorkspace();
  const idx = ws.groceries.findIndex((g) => g.id === item.id);
  if (idx >= 0) ws.groceries[idx] = item;
  else ws.groceries.unshift(item);
  await writeWorkspace(ws);
}

export async function deleteGrocery(id: string): Promise<void> {
  const ws = await readWorkspace();
  ws.groceries = ws.groceries.filter((g) => g.id !== id);
  await writeWorkspace(ws);
}

export async function saveStreak(streak: StreakState): Promise<void> {
  const ws = await readWorkspace();
  ws.streak = streak;
  await writeWorkspace(ws);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const ws = await readWorkspace();
  ws.settings = settings;
  await writeWorkspace(ws);
}
