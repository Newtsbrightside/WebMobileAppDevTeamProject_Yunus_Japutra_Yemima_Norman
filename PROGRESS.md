# PROGRESS.md — hand-over note

Read `AGENTS.md` first. Update this file at the end of every work session.
The checklist status (A–J, with answers to the lecturer's questions) is in `CHECKLIST_STATUS.md`.

## Done

Week 6–10 (see git history): web app (client + admin), Express + SQLite backend, JWT login,
shoe CRUD, orders, support chat, GitHub Pages deployment.

Week 13 — branch `feat/capstone-mobile-ai-split-size` (written with an AI coding agent, checked
as described below; split it into reviewed pull requests before merging):

- **Backend security**: removed the `x-role` header bypass (anyone could act as admin);
  register can no longer create admins; invalid/expired token → 401, wrong role → 403;
  `JWT_SECRET` has no default in code; `/api/orders/mine` filters by `user_id` only;
  order totals and prices come from the database, not from the app; messages need login and the
  sender comes from the token.
- **Backend for production**: `libsql` instead of `better-sqlite3` (local file, or Turso when
  `TURSO_DATABASE_URL` is set); `npm run seed` (refuses to touch Turso without `--production`);
  new columns via `ensureColumn` (ALTER TABLE, keeps rows); CORS list from `CORS_ORIGINS`;
  sample pictures served from `backend/public/images`; `image_url` must be `https://` (no base64
  in the database).
- **Different size for each foot**: `order_items.left_size/right_size`, saved sizes in
  `users.left_size/right_size`, `PUT /api/auth/me/sizes`. Web product page + mobile shoe screen
  have a "My feet are different sizes" switch; admin order list shows "Different size per foot".
- **AI Fit Advisor**: `POST /api/ai/fit-advice` (OpenRouter, key only on the server, 20 s timeout,
  503 + size-matched fallback list when the AI fails). Web: "Fit Advisor" button; mobile: tab.
  AI text always labelled "AI-generated".
- **Web**: talks only to the API when `VITE_API_URL` is set (no silent offline fallback), shows
  loading/empty/error states with Retry, reloads data after login, logs out on 401, checkout waits
  for the server (busy button, server errors shown), admin image editor takes https URLs only,
  Add Shoe has sizes + description.
- **Mobile app** (`mobile-app/`, Expo SDK 58): Shop list (category remembered with AsyncStorage) →
  shoe detail (split sizes, bottom bar with safe-area inset) → order form (keyboard-safe, errors
  under fields, quantity stepper, busy button) → My orders (reloads on focus); AI Fit Advisor tab;
  Account tab (saved sizes, logout, shows the server address); login/register with the token in
  `expo-secure-store`; 401 → logout → login → back.
- **How it was checked**: 43 automated API checks (auth, roles, split-size orders, stock
  rollback, privacy, CORS, AI fallback) + the AI route with a mocked OpenRouter answer; web clicked
  through in a browser (client order with L 9 / R 9.5, admin sees it, status change saved,
  expired token → login); mobile clicked through in the Expo web preview (login, split-size order,
  My orders only shows the user's own orders, admin status change appears on the phone, AI advisor
  result + fallback, expired token → login); `npx expo export` bundles iOS + Android;
  `expo-doctor` 20/20; `npm run lint` + `npm run build` pass.

## Next

Owners follow Design Document §8 — change them if the team decides otherwise. Make each one a
GitHub Issue with its owner.

1. **Deploy the backend** — Yunus: Turso database, `npm run seed -- --production` once, Render web
   service (root `backend`), env vars from `backend/.env.example` with a NEW random `JWT_SECRET`.
   Steps in README → Deployment.
2. **Point the web app at it** — Norman: repository variable `VITE_API_URL` (Settings → Secrets and
   variables → Actions → Variables), re-run the Pages workflow, add the Pages origin to
   `CORS_ORIGINS` on Render.
3. **Test the phone app on an iPhone AND an Android phone, on mobile data** — Yemima + Calvin
   (screens), Norman (testing): `mobile-app/.env` with the Render URL, Expo Go. Check the keyboard on
   the order form and the bottom bars. Write what differed here.
4. **Real AI key** — Yunus: `OPENROUTER_API_KEY` on Render; try 3 foot-size combinations; check the
   answers make sense.
5. **Private support chat** — Calvin: today every client sees every client's messages (see Known
   bugs). Add `messages.client_id`, filter on the server, let the admin pick a thread.
6. **Design Document** — everyone: §3, §4, §5 from `docs/design-doc-week13.md`; §7 real screenshots
   of web + both phones; first page: GitHub + Render + Pages links.
7. **Git workflow**: split this branch into small PRs, each reviewed by another member; every member
   should own (and be able to explain) one of them.
8. **Demo**: 5-minute script, backup screen recording, wake the Render server 5 minutes before.
9. **Cleanup PR**: delete `server/` and `src/pages/ClientDashboard.jsx` (unused); remove the old
   backend packages (`better-sqlite3`, `express`, `cors`, `multer`) from the root `package.json`.

## Known bugs / limits

- Support chat is one shared conversation: every logged-in client can read all client messages.
- Cancelling an order does not put the stock back.
- `classic-court.jpg` and `urban-suede.jpg` are the same picture (the supplied files are identical).
- Web bag, wishlist and the demo wallet are stored per browser (localStorage), not per account.
- Not yet tested on real phones (only Expo web preview + iOS/Android bundling). Android keyboard
  behaviour on the order form and the AI notes field must be checked.
- AI tested with a mocked OpenRouter answer only; needs one test with the real key.
- The free Render server sleeps after 15 minutes; the first request then takes about a minute.

## Decisions

- Database: `libsql` — SQLite file on laptops, Turso in production. Never switch databases now.
- Pictures: only `image_url` (https or `/images/...`). No uploads, so no storage service is needed.
- Different foot sizes: per order line (`left_size`, `right_size`, label in `selected_size`
  like "L 9 / R 9.5"). One pair = one unit of stock, same price.
- Saved sizes live on the user (server), so web and phone share them.
- AI: OpenRouter, default model `anthropic/claude-haiku-5.5` (change with `OPENROUTER_MODEL`).
  The server chooses the sizes; the AI only picks shoes and explains. Advice is not stored.
- The mobile app is for clients only; admin tools stay on the web.
- Registration always creates clients; administrators come from the seed.
- Seeding is a separate command; starting the server never deletes data.
- Mobile keyboard: `KeyboardAvoidingView behavior="padding"` on both platforms (Expo SDK 58 apps
  are edge-to-edge on Android, so the window no longer resizes by itself).
