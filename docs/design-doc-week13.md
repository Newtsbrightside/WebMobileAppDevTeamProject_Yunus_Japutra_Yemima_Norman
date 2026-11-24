# Design Document — Week 13 updates (paste into the .docx)

The `.docx` is edited by hand, so these sections are written here to copy in.

## §3 Architecture

```
 Web app (React + Vite)            Mobile app (Expo SDK 58, Expo Router)
 admin + client                    client role
 GitHub Pages                      Expo Go on iPhone + Android
 VITE_API_URL ───────┐      ┌───── EXPO_PUBLIC_API_URL
                     ▼      ▼
              HTTPS + JWT (Authorization: Bearer)
                     │
           Backend API (Express, Node 20+) — Render
           holds every secret: JWT_SECRET, TURSO_*, OPENROUTER_API_KEY
              │                         │
              ▼                         ▼
   Database: libsql             LLM: OpenRouter
   SQLite file (laptop)         model anthropic/claude-haiku-5.5
   Turso (production)           (only the backend calls it)

 Pictures: no uploads. shoes.image_url = https:// address, or /images/... served by the backend
 from backend/public/images (part of the code, survives restarts).
```

Web and mobile never talk to each other; they share the API and its database.

## §4 Data model — Week 13 changes

New columns (added with `ALTER TABLE … ADD COLUMN`, existing rows kept):

| Table | Column | Type | Meaning |
|---|---|---|---|
| users | left_size | REAL, null | Saved US size of the left foot |
| users | right_size | REAL, null | Saved US size of the right foot |
| order_items | left_size | REAL | Size ordered for the left foot |
| order_items | right_size | REAL | Size ordered for the right foot |
| order_items | shoe_name | TEXT | Shoe name at the time of the order |

`order_items.selected_size` stays as a label: `"9"` or `"L 9 / R 9.5"`. One pair uses one unit of
`shoes.stock`, whatever the two sizes are. Files: none stored (see §3).

## §5 API — changed and new routes

| Method & path | Who | Request | Example response | Errors |
|---|---|---|---|---|
| POST /api/auth/register | anyone | `{ "username": "ana", "password": "pass1" }` (always a client) | 201 `{ token, user }` | 400, 409 |
| POST /api/auth/login | anyone | `{ "username", "password" }` | 200 `{ token, user: { id, username, role, left_size, right_size } }` | 400, 401 |
| GET /api/auth/me | logged in | — | `{ user }` | 401 |
| **PUT /api/auth/me/sizes** | logged in | `{ "left_size": 9, "right_size": 9.5 }` (both `null` clears) | `{ user }` | 400, 401 |
| GET /api/shoes, GET /api/shoes/:id | anyone | `?search=&category=&sort=` | `{ id, name, price, category, stock, image_url, sizes: [8, 8.5] }` | 404 |
| POST / PUT / DELETE /api/shoes… | admin | `image_url` must be `https://…` | shoe | 400, 401, 403, 404 |
| **POST /api/orders** | logged in | `{ "customer": { "name", "address" }, "items": [{ "id": "s4", "quantity": 1, "left_size": 9, "right_size": 9.5 }] }` (or `selectedSize` for one size) | 201 `{ id: "ORD-123456", total: 130, status: "Pending", items: [{ name, left_size, right_size, split_size: true, selectedSize: "L 9 / R 9.5" }] }` | 400 size not available, 401, 404, 409 not enough stock |
| GET /api/orders/mine | logged in | — | own orders only (by `user_id` from the token) | 401 |
| GET /api/orders | admin | — | all orders | 401, 403 |
| PUT /api/orders/:id/status | admin | `{ "status": "Shipped" }` | order | 400, 401, 403, 404 |
| GET / POST /api/messages | logged in | `{ "text" }` (sender from the token) | message | 400, 401 |
| **POST /api/ai/fit-advice** | logged in | `{ "left_size": 9, "right_size": 9.5, "activity": "Running", "notes": "wide feet" }` | `{ ai_generated: true, model, summary, tips, picks: [{ shoe, left_size, right_size, exact_fit, reason }] }` | 400, 401, 503 `{ error, fallback_picks }` |

Prices and totals are always computed by the server; values sent by an app are ignored.

## §8 Task breakdown — Week 13 rows

Owners are suggestions based on the existing §8 roles; the team decides.

| Task | Owner | Status |
|---|---|---|
| Mobile app screens (Expo): shop, detail, order, my orders, account | Yemima + Calvin | ✅ code done, ⬜ tested on both phones |
| Mobile login, secure token, 401 handling | Norman | ✅ code done, ⬜ tested on both phones |
| Different size per foot (backend, web, mobile) | Yunus (backend), Yemima (UI) | ✅ |
| AI Fit Advisor (OpenRouter, backend + web + mobile) | Yunus (route), Calvin (UI) | ✅ code done, ⬜ real key |
| Backend on Render + Turso | Yunus | ⬜ |
| Web on Pages reading the deployed API | Norman | ⬜ |
| Private support chat threads | Calvin | ⬜ |
