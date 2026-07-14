import type { AiAction } from './types';

const ACTION_TYPES = new Set([
  'create_todo',
  'update_todo',
  'complete_todo',
  'add_grocery',
  'check_grocery',
  'create_note',
  'append_note',
  'update_note',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asOptionalString(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function extractJsonPayload(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    return JSON.parse(withoutFence);
  }

  const start = trimmed.indexOf('{');
  const arrayStart = trimmed.indexOf('[');
  let slice = trimmed;
  if (start >= 0 || arrayStart >= 0) {
    const useArray =
      arrayStart >= 0 && (start < 0 || arrayStart < start);
    const idx = useArray ? arrayStart : start;
    const endChar = useArray ? ']' : '}';
    const end = trimmed.lastIndexOf(endChar);
    if (idx >= 0 && end > idx) {
      slice = trimmed.slice(idx, end + 1);
    }
  }
  return JSON.parse(slice);
}

export function normalizeActionsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.actions)) {
    return payload.actions;
  }
  throw new Error('AI response must be an array or { actions: [] }');
}

export function parseAiAction(raw: unknown): AiAction | null {
  if (!isRecord(raw)) return null;
  const type = asString(raw.type);
  if (!type || !ACTION_TYPES.has(type)) return null;

  switch (type) {
    case 'create_todo': {
      const title = asString(raw.title)?.trim();
      if (!title) return null;
      return {
        type,
        title,
        dueAt: asOptionalString(raw.dueAt),
        place: asOptionalString(raw.place),
      };
    }
    case 'update_todo': {
      return {
        type,
        id: asString(raw.id),
        titleMatch: asString(raw.titleMatch),
        title: asString(raw.title),
        dueAt: asOptionalString(raw.dueAt),
        place: asOptionalString(raw.place),
        done: asBoolean(raw.done),
      };
    }
    case 'complete_todo':
      return {
        type,
        id: asString(raw.id),
        titleMatch: asString(raw.titleMatch),
      };
    case 'add_grocery': {
      const text = asString(raw.text)?.trim();
      if (!text) return null;
      return { type, text };
    }
    case 'check_grocery':
      return {
        type,
        id: asString(raw.id),
        textMatch: asString(raw.textMatch),
      };
    case 'create_note': {
      const title = asString(raw.title)?.trim();
      const body = asString(raw.body) ?? '';
      if (!title) return null;
      return { type, title, body };
    }
    case 'append_note': {
      const body = asString(raw.body);
      if (!body) return null;
      return {
        type,
        id: asString(raw.id),
        titleMatch: asString(raw.titleMatch),
        body,
      };
    }
    case 'update_note':
      return {
        type,
        id: asString(raw.id),
        titleMatch: asString(raw.titleMatch),
        title: asString(raw.title),
        body: asString(raw.body),
      };
    default:
      return null;
  }
}

export function parseActionsFromModelText(raw: string): AiAction[] {
  const payload = extractJsonPayload(raw);
  const list = normalizeActionsPayload(payload);
  const actions: AiAction[] = [];
  for (const item of list) {
    const action = parseAiAction(item);
    if (action) actions.push(action);
  }
  if (actions.length === 0) {
    throw new Error('No valid actions in AI response');
  }
  return actions;
}
