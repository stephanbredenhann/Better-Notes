export type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

export type Todo = {
  id: string;
  title: string;
  done: boolean;
  dueAt: string | null;
  place: string | null;
  createdAt: string;
  completedAt: string | null;
  linkedGroceryId: string | null;
};

export type GroceryItem = {
  id: string;
  text: string;
  checked: boolean;
  createdAt: string;
};

export type StreakState = {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
};

export type AppSettings = {
  baseUrl: string;
  model: string;
  reminderLeadMinutes: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  reminderLeadMinutes: 30,
};

export type AiAction =
  | {
      type: 'create_todo';
      title: string;
      dueAt?: string | null;
      place?: string | null;
    }
  | {
      type: 'update_todo';
      id?: string;
      titleMatch?: string;
      title?: string;
      dueAt?: string | null;
      place?: string | null;
      done?: boolean;
    }
  | { type: 'complete_todo'; id?: string; titleMatch?: string }
  | { type: 'add_grocery'; text: string }
  | { type: 'check_grocery'; id?: string; textMatch?: string }
  | { type: 'create_note'; title: string; body: string }
  | {
      type: 'append_note';
      id?: string;
      titleMatch?: string;
      body: string;
    }
  | {
      type: 'update_note';
      id?: string;
      titleMatch?: string;
      title?: string;
      body?: string;
    };

export type UndoSnapshot = {
  notes: Note[];
  todos: Todo[];
  groceries: GroceryItem[];
  streak: StreakState;
  summaryLines: string[];
};

export type ApplyResult = {
  summaryLines: string[];
  streakCelebrated: boolean;
};
