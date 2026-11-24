# AGENTS.md — read this first

Project: **Finishline**, a sneaker store. Clients browse, order (also with a different
size for each foot) and ask the AI Fit Advisor on the **web** and the **phone**; administrators
manage shoes and orders on the **web**. One backend serves both.

Read `PROGRESS.md` next: what is done, what is next, known bugs and decisions.

## Stack and folders

- JavaScript only. No TypeScript.
- `backend/` — Express + `libsql` (SQLite file on a laptop, Turso in production when
  `TURSO_DATABASE_URL` is set). Deployed on Render. Holds every secret.
- `src/` (repository root) — the web app: React + Vite. The API address comes from
  `import.meta.env.VITE_API_URL` (read once in `src/api/api.js`). Deployed on GitHub Pages.
- `mobile-app/` — Expo SDK 58, Expo Router, routes in `mobile-app/app/`. The API address comes
  from `process.env.EXPO_PUBLIC_API_URL`. The token is stored with `expo-secure-store`.
  Also read `mobile-app/AGENTS.md`.
- `server/` is the old Week 6 demo server. Not used. Do not change it.

## The API contract

- The contract is Design Document §5 (copy in `README.md` → API). Never rename a route or a field
  without the whole team. Web and mobile use the same field names (`image_url`, `left_size`, …).
- The user always comes from the JWT (`req.user`), never from the request body or other headers.
- "My …" data is filtered on the server (`WHERE user_id = req.user.id`), never in the app.
- No token → 401. Wrong role → 403.

## Data

- Text and numbers go in the database. Files are NOT stored in the database or on the server's
  disk: `shoes.image_url` keeps an `https://` address, or `/images/...` for the sample pictures
  in `backend/public/images` (part of the code).
- New columns: add an `ensureColumn(...)` line in `backend/database.js` (runs
  `ALTER TABLE … ADD COLUMN`, keeps every row). Never drop or recreate a table.
- `npm run seed` deletes everything. Never run it against production after the first setup.

## libsql gotchas (they crash or leak if ignored)

- Never bind a boolean (`true`/`false`) as a SQL parameter: the native module aborts the process.
  Use `1`/`0`.
- A statement with ONE parameter must not receive a bare `null` (`.get(null)` throws); pass `[value]`.
- `.get()` rows contain an extra `_metadata` key: never `res.json()` a raw row; map the fields.

## Secrets

- Never commit `.env`. Never write a secret in `src/` or `mobile-app/` (`VITE_` and `EXPO_PUBLIC_`
  values are public). `JWT_SECRET`, `TURSO_*` and `OPENROUTER_API_KEY` live only in
  `backend/.env` and Render → Environment. No default secret values in code.

## AI feature

- The LLM is called ONLY by `backend/routes/ai.js` (OpenRouter). Apps call `POST /api/ai/fit-advice`.
- The server validates every AI pick against the catalogue and computes the sizes itself.
- AI text is always shown with an "AI-generated" label; a failed AI call shows a message and the
  size-matched fallback list, never a crash.

## How to work

- One small task per branch and pull request. `main` must always run (it deploys).
- Every PR says: what changed, what an agent wrote, how it was checked (iPhone + Android for mobile).
- Read every diff before committing. Keep code simple enough for a student to explain every line.
- At the end of a session, update `PROGRESS.md`.
