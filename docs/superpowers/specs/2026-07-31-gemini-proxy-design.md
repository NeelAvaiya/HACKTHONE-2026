# Gemini Answers via Express Proxy — Design

Date: 2026-07-31 · Status: approved by user

## Goal
Replace the canned fallback reply in SuperCare AI chat with real answers from the
Gemini API. All scripted demo flows (self-resolve, auto-ticket, P1 escalation,
meeting booking) stay keyword-driven and untouched — Gemini only handles messages
that match no intent (hybrid mode).

## Architecture
- `server/index.js` — Express server on port 3001. Reads `GEMINI_API_KEY` (and
  optional `GEMINI_MODEL`, default `gemini-2.5-flash`) from `.env` via dotenv.
- `POST /api/chat` body `{ message, history }` → calls Gemini REST
  `generateContent` with a SuperCare system prompt → returns `{ reply }`.
- Error handling: missing key or Gemini failure returns HTTP 200 with a graceful
  scripted line — the demo never shows an error state.
- Vite dev proxy: `/api` → `http://localhost:3001` so the frontend calls
  `fetch('/api/chat')` with no CORS setup.
- `src/utils/askGemini.js` — small fetch wrapper with client-side fallback.
- Wiring into `useChatBot.js` fallback path lands with Step 2 (chat UI shell).

## Env & scripts
- `.env` (gitignored): `GEMINI_API_KEY=`
- `.env.example`: committed template.
- `npm run server` → backend; `npm run dev:all` → concurrently runs both.

## Out of scope
No persistence, no auth, no streaming, no rate limiting — hackathon demo only.
