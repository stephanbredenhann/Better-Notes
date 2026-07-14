import { parseActionsFromModelText } from '@/domain/actions';
import type { AiAction, AppSettings, GroceryItem, Note, Todo } from '@/domain/types';
import { buildSystemPrompt } from './prompt';

export class AiClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiClientError';
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

async function callChatCompletions(input: {
  settings: AppSettings;
  apiKey: string;
  system: string;
  user: string;
}): Promise<string> {
  const url = `${normalizeBaseUrl(input.settings.baseUrl)}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.settings.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AiClientError(
      `Provider error ${response.status}: ${body.slice(0, 200) || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiClientError('Provider returned an empty response');
  }
  return content;
}

export async function blurtToActions(input: {
  blurt: string;
  apiKey: string;
  settings: AppSettings;
  notes: Note[];
  todos: Todo[];
  groceries: GroceryItem[];
  timeZone?: string;
}): Promise<AiAction[]> {
  const timeZone =
    input.timeZone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    'UTC';
  const system = buildSystemPrompt({
    now: new Date(),
    timeZone,
    notes: input.notes,
    todos: input.todos,
    groceries: input.groceries,
  });

  let content = await callChatCompletions({
    settings: input.settings,
    apiKey: input.apiKey,
    system,
    user: input.blurt,
  });

  try {
    return parseActionsFromModelText(content);
  } catch {
    content = await callChatCompletions({
      settings: input.settings,
      apiKey: input.apiKey,
      system,
      user: `Your previous reply was invalid JSON. Fix it and return ONLY valid JSON matching the schema.\n\nPrevious reply:\n${content}\n\nOriginal blurt:\n${input.blurt}`,
    });
    return parseActionsFromModelText(content);
  }
}
