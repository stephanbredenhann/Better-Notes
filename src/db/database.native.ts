import * as SQLite from 'expo-sqlite';
import type {
  AppSettings,
  GroceryItem,
  Note,
  StreakState,
  Todo,
} from '@/domain/types';
import { DEFAULT_SETTINGS } from '@/domain/types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('better-notes.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          done INTEGER NOT NULL DEFAULT 0,
          due_at TEXT,
          place TEXT,
          created_at TEXT NOT NULL,
          completed_at TEXT
        );
        CREATE TABLE IF NOT EXISTS groceries (
          id TEXT PRIMARY KEY NOT NULL,
          text TEXT NOT NULL,
          checked INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS streak (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          current INTEGER NOT NULL DEFAULT 0,
          longest INTEGER NOT NULL DEFAULT 0,
          last_completed_date TEXT
        );
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          base_url TEXT NOT NULL,
          model TEXT NOT NULL,
          reminder_lead_minutes INTEGER NOT NULL
        );
        INSERT OR IGNORE INTO streak (id, current, longest, last_completed_date)
          VALUES (1, 0, 0, NULL);
        INSERT OR IGNORE INTO settings (id, base_url, model, reminder_lead_minutes)
          VALUES (1, '${DEFAULT_SETTINGS.baseUrl}', '${DEFAULT_SETTINGS.model}', ${DEFAULT_SETTINGS.reminderLeadMinutes});
      `);
      try {
        await db.execAsync(
          'ALTER TABLE todos ADD COLUMN linked_grocery_id TEXT'
        );
      } catch {
        // Column already exists
      }
      return db;
    })();
  }
  return dbPromise;
}

export async function loadNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    title: string;
    body: string;
    updated_at: string;
  }>('SELECT * FROM notes ORDER BY updated_at DESC');
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    updatedAt: r.updated_at,
  }));
}

export async function loadTodos(): Promise<Todo[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    title: string;
    done: number;
    due_at: string | null;
    place: string | null;
    created_at: string;
    completed_at: string | null;
    linked_grocery_id: string | null;
  }>('SELECT * FROM todos ORDER BY done ASC, created_at DESC');
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    done: !!r.done,
    dueAt: r.due_at,
    place: r.place,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    linkedGroceryId: r.linked_grocery_id ?? null,
  }));
}

export async function loadGroceries(): Promise<GroceryItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    text: string;
    checked: number;
    created_at: string;
  }>('SELECT * FROM groceries ORDER BY checked ASC, created_at DESC');
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    checked: !!r.checked,
    createdAt: r.created_at,
  }));
}

export async function loadStreak(): Promise<StreakState> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    current: number;
    longest: number;
    last_completed_date: string | null;
  }>('SELECT current, longest, last_completed_date FROM streak WHERE id = 1');
  return {
    current: row?.current ?? 0,
    longest: row?.longest ?? 0,
    lastCompletedDate: row?.last_completed_date ?? null,
  };
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    base_url: string;
    model: string;
    reminder_lead_minutes: number;
  }>('SELECT base_url, model, reminder_lead_minutes FROM settings WHERE id = 1');
  return {
    baseUrl: row?.base_url ?? DEFAULT_SETTINGS.baseUrl,
    model: row?.model ?? DEFAULT_SETTINGS.model,
    reminderLeadMinutes:
      row?.reminder_lead_minutes ?? DEFAULT_SETTINGS.reminderLeadMinutes,
  };
}

export async function replaceWorkspace(input: {
  notes: Note[];
  todos: Todo[];
  groceries: GroceryItem[];
  streak: StreakState;
}): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      'DELETE FROM notes; DELETE FROM todos; DELETE FROM groceries;'
    );
    for (const n of input.notes) {
      await db.runAsync(
        'INSERT INTO notes (id, title, body, updated_at) VALUES (?, ?, ?, ?)',
        n.id,
        n.title,
        n.body,
        n.updatedAt
      );
    }
    for (const t of input.todos) {
      await db.runAsync(
        `INSERT INTO todos (id, title, done, due_at, place, created_at, completed_at, linked_grocery_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        t.id,
        t.title,
        t.done ? 1 : 0,
        t.dueAt,
        t.place,
        t.createdAt,
        t.completedAt,
        t.linkedGroceryId
      );
    }
    for (const g of input.groceries) {
      await db.runAsync(
        'INSERT INTO groceries (id, text, checked, created_at) VALUES (?, ?, ?, ?)',
        g.id,
        g.text,
        g.checked ? 1 : 0,
        g.createdAt
      );
    }
    await db.runAsync(
      `INSERT INTO streak (id, current, longest, last_completed_date)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         current = excluded.current,
         longest = excluded.longest,
         last_completed_date = excluded.last_completed_date`,
      input.streak.current,
      input.streak.longest,
      input.streak.lastCompletedDate
    );
  });
}

export async function upsertNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO notes (id, title, body, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, updated_at = excluded.updated_at`,
    note.id,
    note.title,
    note.body,
    note.updatedAt
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}

export async function upsertTodo(todo: Todo): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO todos (id, title, done, due_at, place, created_at, completed_at, linked_grocery_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       done = excluded.done,
       due_at = excluded.due_at,
       place = excluded.place,
       created_at = excluded.created_at,
       completed_at = excluded.completed_at,
       linked_grocery_id = excluded.linked_grocery_id`,
    todo.id,
    todo.title,
    todo.done ? 1 : 0,
    todo.dueAt,
    todo.place,
    todo.createdAt,
    todo.completedAt,
    todo.linkedGroceryId
  );
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM todos WHERE id = ?', id);
}

export async function upsertGrocery(item: GroceryItem): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO groceries (id, text, checked, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET text = excluded.text, checked = excluded.checked`,
    item.id,
    item.text,
    item.checked ? 1 : 0,
    item.createdAt
  );
}

export async function deleteGrocery(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM groceries WHERE id = ?', id);
}

export async function saveStreak(streak: StreakState): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO streak (id, current, longest, last_completed_date)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       current = excluded.current,
       longest = excluded.longest,
       last_completed_date = excluded.last_completed_date`,
    streak.current,
    streak.longest,
    streak.lastCompletedDate
  );
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE settings SET base_url = ?, model = ?, reminder_lead_minutes = ? WHERE id = 1`,
    settings.baseUrl,
    settings.model,
    settings.reminderLeadMinutes
  );
}
