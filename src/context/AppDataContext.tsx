import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { applyActions, removeGroceryForTodo } from '@/domain/applyActions';
import {
  localDateString,
  recordTodoCompletion,
  displayCurrentStreak,
  hasCompletedStreakToday,
  reconcileStreakWithTodos,
} from '@/domain/streak';
import {
  msUntilNextLocalMidnight,
  purgeStaleCompletedTodos,
} from '@/domain/purgeTodos';
import type {
  AppSettings,
  GroceryItem,
  Note,
  StreakState,
  Todo,
  UndoSnapshot,
} from '@/domain/types';
import { DEFAULT_SETTINGS } from '@/domain/types';
import { createId } from '@/utils/id';
import {
  deleteGrocery,
  deleteNote,
  deleteTodo,
  loadGroceries,
  loadNotes,
  loadSettings,
  loadStreak,
  loadTodos,
  replaceWorkspace,
  saveSettings,
  saveStreak,
  upsertGrocery,
  upsertNote,
  upsertTodo,
} from '@/db/database';
import { getApiKey, setApiKey } from '@/db/secureSettings';
import { blurtToActions } from '@/ai/client';
import { syncTodoReminders } from '@/services/reminders';

type AppDataContextValue = {
  ready: boolean;
  notes: Note[];
  todos: Todo[];
  groceries: GroceryItem[];
  streak: StreakState;
  displayStreak: number;
  settings: AppSettings;
  hasApiKey: boolean;
  lastUndo: UndoSnapshot | null;
  lastSummary: string[] | null;
  lastCelebration: boolean;
  completedToday: boolean;
  refresh: () => Promise<void>;
  saveApiKey: (key: string) => Promise<void>;
  updateSettings: (next: AppSettings) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  toggleGrocery: (id: string) => Promise<void>;
  addTodo: (title: string) => Promise<void>;
  addGrocery: (text: string) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
  removeGrocery: (id: string) => Promise<void>;
  saveNote: (note: Note) => Promise<void>;
  createBlankNote: () => Promise<Note>;
  removeNote: (id: string) => Promise<void>;
  runBlurt: (text: string) => Promise<{ summaryLines: string[]; celebrated: boolean }>;
  undoLastBlurt: () => Promise<void>;
  clearSummary: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [streak, setStreak] = useState<StreakState>({
    current: 0,
    longest: 0,
    lastCompletedDate: null,
  });
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [lastUndo, setLastUndo] = useState<UndoSnapshot | null>(null);
  const [lastSummary, setLastSummary] = useState<string[] | null>(null);
  const [lastCelebration, setLastCelebration] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const groceriesRef = useRef(groceries);
  groceriesRef.current = groceries;
  const streakRef = useRef(streak);
  streakRef.current = streak;
  const todosRef = useRef(todos);
  todosRef.current = todos;

  const refresh = useCallback(async () => {
    const [n, t, g, s, sett, key] = await Promise.all([
      loadNotes(),
      loadTodos(),
      loadGroceries(),
      loadStreak(),
      loadSettings(),
      getApiKey(),
    ]);
    const purged = purgeStaleCompletedTodos(t);
    const nextStreak = reconcileStreakWithTodos(s, purged);
    const streakChanged =
      nextStreak.current !== s.current ||
      nextStreak.longest !== s.longest ||
      nextStreak.lastCompletedDate !== s.lastCompletedDate;
    if (purged.length !== t.length || streakChanged) {
      await replaceWorkspace({
        notes: n,
        todos: purged,
        groceries: g,
        streak: nextStreak,
      });
      await syncTodoReminders(purged, sett.reminderLeadMinutes);
    }
    setNotes(n);
    setTodos(purged);
    setGroceries(g);
    setStreak(nextStreak);
    setSettings(sett);
    setHasApiKey(!!key);
  }, []);

  const purgeStaleTodosNow = useCallback(async () => {
    const current = todosRef.current;
    const purged = purgeStaleCompletedTodos(current);
    if (purged.length === current.length) return;
    await replaceWorkspace({
      notes: notesRef.current,
      todos: purged,
      groceries: groceriesRef.current,
      streak: streakRef.current,
    });
    setTodos(purged);
    await syncTodoReminders(
      purged,
      settingsRef.current.reminderLeadMinutes
    );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (error) {
        console.warn('Failed to load workspace', error);
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    if (!ready) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleMidnightPurge = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await purgeStaleTodosNow();
        } catch (error) {
          console.warn('Midnight todo purge failed', error);
        }
        scheduleMidnightPurge();
      }, msUntilNextLocalMidnight() + 250);
    };

    scheduleMidnightPurge();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        purgeStaleTodosNow().catch((error) => {
          console.warn('Foreground todo purge failed', error);
        });
        scheduleMidnightPurge();
      }
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      sub.remove();
    };
  }, [ready, purgeStaleTodosNow]);

  const persistAndSync = useCallback(
    async (next: {
      notes: Note[];
      todos: Todo[];
      groceries: GroceryItem[];
      streak: StreakState;
    }) => {
      await replaceWorkspace(next);
      setNotes(next.notes);
      setTodos(next.todos);
      setGroceries(next.groceries);
      setStreak(next.streak);
      await syncTodoReminders(next.todos, settings.reminderLeadMinutes);
    },
    [settings.reminderLeadMinutes]
  );

  const saveApiKeyHandler = useCallback(async (key: string) => {
    await setApiKey(key);
    setHasApiKey(!!key.trim());
  }, []);

  const updateSettings = useCallback(async (next: AppSettings) => {
    await saveSettings(next);
    setSettings(next);
    await syncTodoReminders(todos, next.reminderLeadMinutes);
  }, [todos]);

  const toggleTodo = useCallback(
    async (id: string) => {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;
      const next = { ...todo, done: !todo.done };
      let nextStreak = streak;
      let celebrated = false;
      let nextTodos = todos;
      let nextGroceries = groceries;

      if (next.done) {
        next.completedAt = new Date().toISOString();
        const result = recordTodoCompletion(streakRef.current, localDateString());
        nextStreak = result.streak;
        celebrated = result.celebrated;
        streakRef.current = nextStreak;
        await saveStreak(nextStreak);
        setStreak(nextStreak);

        const cleaned = removeGroceryForTodo(
          todos.map((t) => (t.id === id ? next : t)),
          groceries,
          next
        );
        nextTodos = cleaned.todos;
        nextGroceries = cleaned.groceries;
        next.linkedGroceryId = null;

        if (cleaned.removed) {
          await deleteGrocery(cleaned.removed.id);
        }
        await upsertTodo(next);
        setTodos(nextTodos);
        setGroceries(nextGroceries);
      } else {
        next.completedAt = null;
        await upsertTodo(next);
        nextTodos = todos.map((t) => (t.id === id ? next : t));
        setTodos(nextTodos);
      }

      setLastCelebration(celebrated);
      await syncTodoReminders(nextTodos, settings.reminderLeadMinutes);
    },
    [todos, groceries, streak, settings.reminderLeadMinutes]
  );

  const toggleGrocery = useCallback(
    async (id: string) => {
      const item = groceries.find((g) => g.id === id);
      if (!item) return;
      const next = { ...item, checked: !item.checked };
      await upsertGrocery(next);
      setGroceries((prev) => prev.map((g) => (g.id === id ? next : g)));
    },
    [groceries]
  );

  const addTodo = useCallback(async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const todo: Todo = {
      id: createId(),
      title: trimmed,
      done: false,
      dueAt: null,
      place: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      linkedGroceryId: null,
    };
    await upsertTodo(todo);
    setTodos((prev) => [todo, ...prev]);
    await syncTodoReminders([todo, ...todos], settings.reminderLeadMinutes);
  }, [todos, settings.reminderLeadMinutes]);

  const addGrocery = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const item: GroceryItem = {
      id: createId(),
      text: trimmed,
      checked: false,
      createdAt: new Date().toISOString(),
    };
    await upsertGrocery(item);
    setGroceries((prev) => [item, ...prev]);
  }, []);

  const removeTodo = useCallback(
    async (id: string) => {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;
      const cleaned = removeGroceryForTodo(todos, groceries, todo);
      if (cleaned.removed) {
        await deleteGrocery(cleaned.removed.id);
      }
      await deleteTodo(id);
      const nextTodos = cleaned.todos.filter((t) => t.id !== id);
      setTodos(nextTodos);
      setGroceries(cleaned.groceries);
      await syncTodoReminders(nextTodos, settings.reminderLeadMinutes);
    },
    [todos, groceries, settings.reminderLeadMinutes]
  );

  const removeGrocery = useCallback(
    async (id: string) => {
      await deleteGrocery(id);
      setGroceries((prev) => prev.filter((g) => g.id !== id));
      setTodos((prev) =>
        prev.map((t) =>
          t.linkedGroceryId === id ? { ...t, linkedGroceryId: null } : t
        )
      );
      const linked = todos.filter((t) => t.linkedGroceryId === id);
      for (const t of linked) {
        await upsertTodo({ ...t, linkedGroceryId: null });
      }
    },
    [todos]
  );

  const saveNoteHandler = useCallback(async (note: Note) => {
    await upsertNote(note);
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id);
      if (exists) return prev.map((n) => (n.id === note.id ? note : n));
      return [note, ...prev];
    });
  }, []);

  const createBlankNote = useCallback(async () => {
    const note: Note = {
      id: createId(),
      title: 'Untitled',
      body: '',
      updatedAt: new Date().toISOString(),
    };
    await upsertNote(note);
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const removeNote = useCallback(async (id: string) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const runBlurt = useCallback(
    async (text: string) => {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Add your API key in Settings before blurting.');
      }

      const actions = await blurtToActions({
        blurt: text,
        apiKey,
        settings,
        notes,
        todos,
        groceries,
      });

      const snapshot: UndoSnapshot = {
        notes: structuredClone(notes),
        todos: structuredClone(todos),
        groceries: structuredClone(groceries),
        streak: structuredClone(streak),
        summaryLines: [],
      };

      const { state, result } = applyActions(
        { notes, todos, groceries, streak },
        actions,
        localDateString()
      );

      snapshot.summaryLines = result.summaryLines;
      await persistAndSync(state);
      setLastUndo(snapshot);
      setLastSummary(result.summaryLines);
      setLastCelebration(result.streakCelebrated);
      return {
        summaryLines: result.summaryLines,
        celebrated: result.streakCelebrated,
      };
    },
    [settings, notes, todos, groceries, streak, persistAndSync]
  );

  const undoLastBlurt = useCallback(async () => {
    if (!lastUndo) return;
    await persistAndSync({
      notes: lastUndo.notes,
      todos: lastUndo.todos,
      groceries: lastUndo.groceries,
      streak: lastUndo.streak,
    });
    setLastUndo(null);
    setLastSummary(null);
    setLastCelebration(false);
  }, [lastUndo, persistAndSync]);

  const clearSummary = useCallback(() => {
    setLastSummary(null);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      notes,
      todos,
      groceries,
      streak,
      displayStreak: displayCurrentStreak(streak),
      settings,
      hasApiKey,
      lastUndo,
      lastSummary,
      lastCelebration,
      completedToday: hasCompletedStreakToday(streak),
      refresh,
      saveApiKey: saveApiKeyHandler,
      updateSettings,
      toggleTodo,
      toggleGrocery,
      addTodo,
      addGrocery,
      removeTodo,
      removeGrocery,
      saveNote: saveNoteHandler,
      createBlankNote,
      removeNote,
      runBlurt,
      undoLastBlurt,
      clearSummary,
    }),
    [
      ready,
      notes,
      todos,
      groceries,
      streak,
      settings,
      hasApiKey,
      lastUndo,
      lastSummary,
      lastCelebration,
      refresh,
      saveApiKeyHandler,
      updateSettings,
      toggleTodo,
      toggleGrocery,
      addTodo,
      addGrocery,
      removeTodo,
      removeGrocery,
      saveNoteHandler,
      createBlankNote,
      removeNote,
      runBlurt,
      undoLastBlurt,
      clearSummary,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return ctx;
}
