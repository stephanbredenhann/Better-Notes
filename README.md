# Better Notes

Local-first notes / todos / groceries app. Freeform text (typed or spoken) is sent to a BYOK OpenAI-compatible API and applied as structured updates. No accounts or app-owned backend; data stays on device except Blurt payloads to your configured provider.

## Tech stack

| Layer | Choice |
|--------|--------|
| Runtime | Expo SDK 54, React Native, React 19 |
| Language | TypeScript |
| Navigation | Expo Router |
| Storage (native) | `expo-sqlite` |
| Storage (web) | AsyncStorage |
| Secrets | `expo-secure-store` (API key) |
| AI | OpenAI-compatible chat API (default: DeepSeek) |
| Notifications | `expo-notifications` (local due reminders) |
| Speech | Platform speech recognition when available |
| Tests | Domain unit checks via `tsx` |

Android-first; same codebase targets iOS and web.

## How Blurt works

```
Blurt sheet → optional speech-to-text → plain text
  → pack local note/todo/grocery context into the system prompt
  → OpenAI-compatible chat completion
  → structured JSON actions → validate
  → apply in one transaction + schedule reminders
  → show summary with Undo → persist to SQLite / AsyncStorage
```

Actions cover create/update/complete todos, add/check groceries, and create/append/update notes. The model gets short previews of existing items so it can merge instead of duplicating. One-level undo restores the pre-blurt snapshot.

## Project structure

```
app/                    # Expo Router screens (tabs, Blurt, settings, note detail)
src/
  ai/                   # Provider client + system prompt / context packing
  components/           # Shared UI
  context/              # App state, persist, Blurt/undo
  db/                   # SQLite (native) / AsyncStorage (web) + secure settings
  domain/               # Types, action parse/apply, streak, purge + tests
  services/             # Reminders, speech
  theme/                # Design tokens
  utils/
```

Layers: UI → domain (entities, apply/undo, streak) → AI client → storage → local reminders.

## Out of scope (v1)

Accounts/sync/sharing, system calendar write, multiple grocery lists / folders / tags, rich markdown, widgets.

## Getting started

Requires Node 20+, Expo Go (SDK 54) or a simulator, and an API key from DeepSeek or another OpenAI-compatible provider.

```bash
npm install
npx expo start
```

In the app: Settings → paste API key (DeepSeek preset or custom base URL + model) → Blurt.

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` / `ios` / `web` | Open platform target |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:domain` | Domain unit tests |

## Privacy

| Data | Where |
|------|--------|
| Notes, todos, groceries, streak | On device |
| API key | Secure Store |
| Blurt text + local previews | Your configured AI endpoint only, on Send |

## Status

Personal project. Forks should keep BYOK — do not bake provider secrets into the client build.
