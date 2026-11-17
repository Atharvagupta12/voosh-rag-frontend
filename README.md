# Dispatch: frontend

The web app for **Dispatch**, a RAG-powered news chatbot: a small landing page and a streaming
chat interface that shows a cited source for every claim.

**Stack:** React 19 · Vite 7 · SCSS · react-markdown. No UI framework; all components and icons
are in this repo.

---

## Quick start

```bash
cd Frontend
npm install
npm run dev          # http://localhost:5173, talks to http://localhost:5000/api
```

The API URL comes from `VITE_API_URL`:

- `.env.development` points at the local backend.
- For production builds, set `VITE_API_URL=https://<backend>/api` in `.env` or in your host's
  environment. The older `VITE_BACKEND_URL` name is also accepted.

| Command | |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |

---

## Features

**Landing page (`/`)**
- Hero with live index stats (article count, newsrooms, newest story).
- A product preview built from real headlines.
- A scrolling "on the wire" headline ticker.
- Clickable coverage cards. Picking a story opens the chat and asks about it.
- "How it works" walkthrough of the RAG pipeline, plus a call to action.

**Chat (`/#/chat`)**
- Answers stream token by token over SSE, with progress states: "Searching the news…" →
  "Reading 3 articles…" → text.
- Markdown rendering. Inline `[n]` citations become chips that link to the article, and cited
  sources are listed as cards under the answer.
- **Session persistence.** The session ID is kept in `localStorage` and the history is restored
  from the server on reload. **New chat** clears the session on the server.
- **Stop** generating at any time; the partial answer is kept. **Try again** appears on errors.
- Starter suggestions on an empty chat, drawn from the latest headlines.
- Auto-growing input: Enter to send, Shift+Enter for a new line, IME-safe, `/` to focus.
  Double sends are blocked.
- Auto-scroll that follows the stream until you scroll up; a **Latest** button jumps back down.
- Light and dark themes: follows the system setting, with a manual toggle that's remembered and
  applied before first paint so there's no flash.
- Responsive down to 320 px. Keyboard and screen-reader friendly (labels, focus rings,
  `aria-busy`, reduced-motion support).

---

## Structure

```
src/
├── App.jsx                 view switch (#/chat), theme, index metadata
├── components/
│   ├── Landing.jsx         landing page sections
│   ├── Chat.jsx            chat layout, empty state, scrolling
│   ├── Message.jsx         user/assistant messages, sources, states
│   ├── Composer.jsx        input box
│   ├── Markdown.jsx        markdown + citation chips
│   ├── Logo.jsx, Icons.jsx, ThemeToggle.jsx
├── hooks/
│   ├── useChat.js          messages, streaming, stop/retry/reset, session restore
│   ├── useMeta.js          /api/meta
│   └── useTheme.js
├── lib/
│   ├── api.js              REST + SSE stream client
│   ├── format.js           relative time, citation parsing
│   └── storage.js          safe localStorage
└── styles/                 design tokens (light/dark), base, landing, chat
```

## Deploying (Vercel)

- Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
- Set `VITE_API_URL` to the backend's `/api` URL.
- Add the frontend's URL to the backend's `ALLOWED_ORIGINS`.
- Routing is hash-based, so no rewrite rules are needed.
