# Capstone checklist — status (Week 13)

✅ done in the code and checked locally · 🟡 code is ready, the team still has to do the step ·
❌ not done yet. "Done" only counts on the **deployed** system, so most 🟡 items turn ✅ after
the deployment steps in `README.md` → Deployment.

Each item has a short answer to the lecturer's question. Every member should be able to say it.

## A. Backend deployed and keeps its data

| | Item | Status / answer |
|---|---|---|
| 🟡 | API answers at a public URL | Not deployed yet. Render web service, root `backend`. `/` and `/api/health` answer JSON; `/api/health` also says `"database": "turso"`. |
| 🟡 | Data survives a restart | Code uses Turso when `TURSO_DATABASE_URL` is set (`backend/database.js`). *Answer:* production data lives in Turso; Render's disk is temporary, so a restart loses nothing. Prove it: create an order → Render → Restart → still there. |
| 🟡 | Every §5 route works with a real request | All routes pass locally (43 API checks). Repeat against the Render URL after deploying. |
| ✅ | 401 / 403 | `backend/middleware/auth.js`: no/invalid token → 401, client on an admin route → 403. The old `x-role` header bypass is removed. |
| 🟡 | Secrets only on the server | No secret default in code. **But** the old JWT secret is in the git history (`backend/.env.example`, Week 10) → use a NEW random `JWT_SECRET` on Render. *Answer:* Render → Environment; `git grep JWT_SECRET` shows only the variable name. |
| ✅ | Schema changes keep data | New columns via `ensureColumn()` = `ALTER TABLE … ADD COLUMN`. *Never* run `npm run seed` on production after setup (it refuses without `--production`). |

## B. Files and images

| | Item | Status / answer |
|---|---|---|
| ✅ | Files in a storage service, DB keeps URLs | No uploads at all: `image_url` is an `https://` address (or `/images/...` sample pictures that ship with the code). Base64 images are rejected (400). |
| ✅ | Uploads survive a restart | Nothing is uploaded to the server's disk; the 4 sample pictures are part of every deploy. |
| — | Private files | Not applicable (no private files). |

## C. Web app against the deployed API

| | Item | Status / answer |
|---|---|---|
| 🟡 | Deployed web app reads the deployed API | Workflow passes `VITE_API_URL` from the repository variable; set it and re-run the workflow. The header shows "LIVE DATABASE"; the Network tab shows requests to `…onrender.com`. |
| 🟡 | CORS | `CORS_ORIGINS` on Render must include `https://newtsbrightside.github.io`. *Answer:* the browser only lets a page call the API if the server lists the page's origin. |
| ✅ | Login for both roles, own pages only | Client typing `#/add-shoe` is sent back to `/`; the server also refuses admin routes with 403. |
| ✅ | List, detail, create/edit form | Catalogue, product modal, Add Shoe, inline inventory edit, order status. |
| ✅ | Loading, empty and error states | Loading text, empty states, red banner with Retry when the server is unreachable (no silent offline mode when `VITE_API_URL` is set). |

## D. Mobile app on iPhone AND Android

| | Item | Status / answer |
|---|---|---|
| ✅ | Reads the API from `EXPO_PUBLIC_API_URL` | Only `mobile-app/lib/api.js` reads it. Account tab shows the address in use. |
| ✅ | Token in `expo-secure-store`, logout removes it | `mobile-app/lib/session.js` (Keychain/Keystore). *Why not AsyncStorage:* plain files; a copied token lets someone log in as the user. |
| ✅ | Token on every request, 401 → login | `apiFetch()` adds `Authorization: Bearer`, turns 401 into `AuthError`; screens call `useSessionExpired()` → logout → login → back. |
| ✅ | Main flow list → detail → action | Shop → shoe (sizes, also per foot) → Place order → My orders. Routes: `GET /api/shoes`, `GET /api/shoes/:id`, `POST /api/orders`, `GET /api/orders/mine`. |
| ✅ | Users see only their own data | Server filters `WHERE user_id = req.user.id` (from the token). Checked with `client` and `client2`. |
| ✅ | Comfortable on a phone | 48-point targets (`theme.js`), bottom bars with `insets.bottom`, `KeyboardAvoidingView` + `keyboardShouldPersistTaps`, busy buttons. |
| ❌ | Tested on an iPhone and an Android phone | Only tested in the Expo web preview and by bundling for both platforms. **Team: test with Expo Go on both phones.** |
| ❌ | Works on mobile data | Needs the deployed API. Wi-Fi off → app still loads. |

## E. Web and mobile share one backend

| | Item | Status / answer |
|---|---|---|
| ✅ (local) | Action on one side appears on the other | Order placed on the phone → admin sees it on the web (table `orders` + `order_items`); admin sets "Shipped" on the web → phone shows it when My orders opens. Saved foot sizes are shared too (`users.left_size/right_size`). Repeat on the deployed system. |

## F. AI feature in production

| | Item | Status / answer |
|---|---|---|
| 🟡 | AI runs on the deployed backend | `backend/routes/ai.js` → OpenRouter. Needs `OPENROUTER_API_KEY` on Render. *Why not from the phone:* app code is on every user's phone, a key there can be copied. |
| ✅ | Key only on the server | Only `process.env.OPENROUTER_API_KEY` in `backend/`. |
| ✅ | Failed AI call → sensible message | 20 s timeout; 503 + "The AI advisor is not available right now…" + a size-matched list labelled "not written by AI". |
| ✅ | AI content labelled | "AI-generated · model" pill on web and mobile, plus "AI suggestions can be wrong". |

## G. Team works through Git

| | Item | Status / answer |
|---|---|---|
| ❌ | Every member commits from their own account | History: 25 commits by one account, 1 each by the other three members. Each member should open and merge their own PRs from now on. |
| 🟡 | Every member owns a part (§8) | Roles exist in README/§8; add the mobile + AI + deployment owners (see `PROGRESS.md` → Next). |
| 🟡 | API contract written first (§5) | README → API is up to date; copy it into §5 (`docs/design-doc-week13.md`). |
| ❌ | Branches + reviewed PRs | PRs #1–#3 were reviewed; Week 10 went straight to `main`. This work is on a branch — split it into reviewed PRs. |
| ✅ | `main` always runs | README has run steps for all three parts (keep it true when merging). |
| ❌ | Tasks are GitHub Issues with an owner | No Issues yet. Create them from `PROGRESS.md` → Next. |
| 🟡 | No secrets in the repository | `.env` ignored, `.env.example` in root, `backend/`, `mobile-app/`. The Week 10 secret is in history → rotate it. |

## H. AI agents with shared context

| | Item | Status / answer |
|---|---|---|
| ✅ | `AGENTS.md` | Root + `mobile-app/AGENTS.md`. A rule that saves mistakes: the libsql gotchas, and "the user comes from the token". |
| ✅ | `PROGRESS.md` | Done / Next / Known bugs / Decisions. |
| 🟡 | Each PR says what an agent wrote and how it was checked | Use the "How it was checked" list in `PROGRESS.md` in the PR descriptions. |
| ❌ | Every member can explain the code | Each owner reads their part of this branch line by line before the checkpoint. |

## I. Design Document

| | Item | Status / answer |
|---|---|---|
| ❌ | All 8 sections up to date | Paste-ready §3/§4/§5/§8 text in `docs/design-doc-week13.md`. |
| ❌ | §7 real screenshots (web + mobile) | Take them after deploying, on both phones. |
| ❌ | First page: team, GitHub, every deployment link | Add the Render URL and the Expo instructions after deploying. |

## J. Ready to demo

| | Item | Status / answer |
|---|---|---|
| ❌ | 5-minute script | Suggested: problem (feet of different sizes) → web admin + phone order with L/R sizes → AI advisor → hard bug (the `x-role` bypass, or libsql aborting on booleans) → what AI wrote and how it was checked. |
| ❌ | Backup recording + screenshots | Record after deploying. |
| ❌ | Server awake before the demo | Open `/api/health` 5 minutes before. |
| 🟡 | Rollback | Render → Events → redeploy the last good deploy; then `git revert` through a PR. |
