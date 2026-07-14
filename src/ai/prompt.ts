import type { GroceryItem, Note, Todo } from '@/domain/types';

const MAX_NOTES = 20;
const MAX_TODOS = 30;
const MAX_GROCERIES = 40;
const PREVIEW_LEN = 120;

export function buildSystemPrompt(input: {
  now: Date;
  timeZone: string;
  notes: Note[];
  todos: Todo[];
  groceries: GroceryItem[];
}): string {
  const date = input.now.toISOString();
  const local = input.now.toLocaleString(undefined, {
    timeZone: input.timeZone,
  });

  const notes = input.notes.slice(0, MAX_NOTES).map((n) => ({
    id: n.id,
    title: n.title,
    preview: n.body.slice(0, PREVIEW_LEN),
  }));
  const todos = input.todos.slice(0, MAX_TODOS).map((t) => ({
    id: t.id,
    title: t.title,
    done: t.done,
    dueAt: t.dueAt,
    place: t.place,
  }));
  const groceries = input.groceries.slice(0, MAX_GROCERIES).map((g) => ({
    id: g.id,
    text: g.text,
    checked: g.checked,
  }));

  return `You are the brain of Better Notes, an on-device notes app.
The user will send a freeform "blurt". Convert it into structured actions that update their workspace.

Current time (ISO): ${date}
Local time (${input.timeZone}): ${local}

Respond with ONLY valid JSON of the form:
{"actions":[ ... ]}

Allowed action types:
- {"type":"create_todo","title":"...","dueAt":"ISO8601 or null","place":"string or null"}
- {"type":"update_todo","id":"...","titleMatch":"...","title":"...","dueAt":"...","place":"...","done":true|false}
- {"type":"complete_todo","id":"...","titleMatch":"..."}
- {"type":"add_grocery","text":"..."}
- {"type":"check_grocery","id":"...","textMatch":"..."}
- {"type":"create_note","title":"...","body":"..."}
- {"type":"append_note","id":"...","titleMatch":"...","body":"..."}
- {"type":"update_note","id":"...","titleMatch":"...","title":"...","body":"..."}

Rules:
- One blurt may produce many actions.
- Prefer matching existing notes/todos/groceries by id when listed below; otherwise use titleMatch/textMatch.
- Extract times into dueAt (ISO) and places into place on todos when mentioned.
- Shopping or errands that are also timed/placed todos (e.g. "get milk at 2") must emit BOTH create_todo AND add_grocery for the item.
- Credentials, passwords, long reference info, or "remember this…" content that is not a concrete task should use create_note (or append_note), not create_todo.
- Prefer adding to an existing note via append_note when the topic matches.
- Do not invent ids that are not listed.
- Prefer merging duplicate grocery items instead of duplicates.
- Do not include markdown fences or commentary outside JSON.

Existing notes:
${JSON.stringify(notes, null, 2)}

Existing todos:
${JSON.stringify(todos, null, 2)}

Existing groceries:
${JSON.stringify(groceries, null, 2)}`;
}
