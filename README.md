# Better Notes

**Dump your brain. Let AI sort it.**

Better Notes is an Bring-Your-Own-Key personal notes and planning app. You speak or type a freeform “blurt,” and your chosen OpenAI-compatible model turns it into structured updates across todos, notes, and groceries, all in one shot.

No accounts. No app-owned backend. Bring your own API key. Your data stays on the device except for the blurts you send to the provider you configure.

---

## Aim

Everyday life rarely arrives as tidy checklist items. You think in fragments: *“buy milk when I leave, call dentist at 3, remember the Wi‑Fi password on the fridge.”*

Better Notes is built around that reality:

1. **Capture first**:one natural-language message (typed or spoken)
2. **Structure second**: AI converts it into concrete actions
3. **Act locally**: changes land in your on-device workspace immediately, with undo

The goal is a light, playful planning companion: hybrid tabbed lists, a floating Blurt button, streaks for daily follow-through, and local reminders when todos have due times — without cloud accounts or calendar lock-in.

---

## Features

### Blurt (primary capture)

- Large text sheet available from every tab via a bright blue floating button
- Optional on-device speech recognition when available (otherwise use the keyboard)
- One blurt can produce many actions at once (todos + notes + groceries)
- Immediate apply with a “Here’s what I did” summary
- One-level **Undo** restoring the pre-blurt snapshot

### Todos

- Create and complete manually, or via Blurt
- Optional **due time** and **place** metadata
- Local notifications before due times (configurable lead minutes)
- Completing at least one todo per local day advances your **streak**

### Notes

- Plain-text notes with title and body
- Manual create/edit, or AI create / append / update from a blurt
- Detail screen for focused editing

### Groceries

- Single shared list (check / uncheck)
- Shopping mentions in a blurt can become grocery items — and timed/placed “get X” blurts can emit **both** a todo and a grocery line

### Settings & privacy

- Bring-your-own API key (stored in Secure Store)
- DeepSeek preset by default; any OpenAI-compatible base URL + model works
- Reminder lead time configuration
- Browse and edit offline; Blurt requires network to call your provider

### What’s intentionally out of scope (v1)

- Accounts, cloud sync, or sharing
- System calendar write
- Multiple grocery lists, folders, or tags
- Rich markdown editing
- Widgets / wearables

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Runtime | [Expo](https://expo.dev/) SDK **54** (Expo Go compatible), React Native, React 19 |
| Language | TypeScript |
| Navigation | Expo Router (file-based, typed routes) |
| Storage (native) | `expo-sqlite` |
| Storage (web) | AsyncStorage |
| Secrets | `expo-secure-store` (API key) |
| AI | OpenAI-compatible chat API (default: DeepSeek) |
| Notifications | `expo-notifications` (local due reminders) |
| Speech | Platform speech recognition when available |
| Fonts / UI | Nunito + Nunito Sans; Duolingo-inspired “sticker on paper” tokens (`#1cb0f6` primary) |
| Tests | Lightweight domain unit checks via `tsx` |

Android-first; the same Expo codebase targets iOS and web.

---

## How Blurt works

```
Blurt sheet → optional speech-to-text → plain text
  → pack local note/todo/grocery context into the system prompt
  → OpenAI-compatible chat completion
  → structured JSON actions → validate
  → apply in one transaction + schedule reminders
  → show summary with Undo → persist to SQLite / AsyncStorage
```

Allowed AI actions include creating/updating/completing todos, adding/checking groceries, and creating/appending/updating notes. The model receives short previews of existing items so it can merge instead of duplicating.

---

## Project structure

```
Better-Notes/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout, fonts, providers
│   ├── blurt.tsx                 # Blurt capture sheet
│   ├── settings.tsx              # API key, provider, reminders
│   ├── note/[id].tsx             # Note detail editor
│   └── (tabs)/                   # Bottom tabs
│       ├── _layout.tsx           # Tab bar + Blurt FAB
│       ├── index.tsx             # Todos + streak banner
│       ├── notes.tsx             # Notes list
│       ├── groceries.tsx         # Grocery list
│       └── blurt-tab.tsx         # Tab entry that opens Blurt
├── src/
│   ├── ai/
│   │   ├── client.ts             # Provider HTTP client
│   │   └── prompt.ts             # System prompt + context packing
│   ├── components/               # Shared UI + list rows + modals
│   ├── context/
│   │   └── AppDataContext.tsx    # App state, persist, Blurt/undo
│   ├── db/
│   │   ├── database.ts           # Platform entry
│   │   ├── database.native.ts    # SQLite implementation
│   │   ├── database.web.ts       # AsyncStorage implementation
│   │   └── secureSettings.ts     # API key secure storage
│   ├── domain/
│   │   ├── types.ts              # Notes, todos, groceries, actions
│   │   ├── actions.ts            # Action validation/parsing
│   │   ├── applyActions.ts       # Apply + undo snapshots
│   │   ├── streak.ts             # Daily completion streak rules
│   │   ├── purgeTodos.ts         # Cleanup helpers
│   │   └── *.test.ts             # Domain unit tests
│   ├── services/
│   │   ├── reminders.ts          # Local notification scheduling
│   │   ├── speech.ts             # Speech API entry
│   │   ├── speech.native.ts
│   │   └── speech.web.ts
│   ├── theme/
│   │   └── tokens.ts             # Colors, type, spacing
│   └── utils/
│       └── id.ts                 # ID helpers
├── docs/superpowers/specs/       # Product design spec
├── assets/                       # Icons & splash
├── app.json                      # Expo config
├── DESIGN.md                     # Visual style reference
├── package.json
└── tsconfig.json
```

**Layering (intended)**

1. **UI** — tabs, lists, note editor, Blurt sheet, settings  
2. **Domain** — entities, action apply/undo, streak rules  
3. **AI client** — base URL, model, key; prompt + parse  
4. **Storage** — SQLite / AsyncStorage + secure key storage  
5. **Reminders** — local notifications before due times  

---

## Getting started

### Prerequisites

- Node.js 20+ recommended  
- [Expo Go](https://expo.dev/go) on a phone (SDK 54), or a simulator/emulator  
- An API key from [DeepSeek](https://platform.deepseek.com/) (or another OpenAI-compatible provider)

### Install & run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go**, or press `a` / `i` / `w` for Android, iOS, or web.

```bash
npm run web
```

### First-run setup in the app

1. Open **Settings**
2. Paste your API key
3. Use the DeepSeek preset, or set a custom base URL + model
4. Tap the blue **Blurt** button
5. On **Notes**, use **New** to create notes manually when you prefer

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` | Open Android |
| `npm run ios` | Open iOS |
| `npm run web` | Open web |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run test:domain` | Domain unit tests (streak, actions, purge) |

---

## Privacy model

| Data | Where it lives |
|------|----------------|
| Notes, todos, groceries, streak | On device (SQLite native / AsyncStorage web) |
| API key | Secure Store |
| Blurt text + packed local previews | Sent only to **your** configured AI endpoint when you tap Send |

There is no Better Notes cloud account and no sync server owned by the app.




## Contributing / status

Private, early personal project. Expect the Blurt → actions pipeline and the Duolingo-inspired UI to evolve. If you fork it, keep the BYOK model: never bake provider secrets into the client build.
