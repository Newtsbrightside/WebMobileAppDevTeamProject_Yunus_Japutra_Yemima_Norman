# Finishline — Sneaker Store (Web + Mobile + AI)

**Course:** Web & Mobile Application Development — Capstone  
**Group:** 14  
**GitHub:** https://github.com/Newtsbrightside/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman  
**Web app (GitHub Pages):** https://newtsbrightside.github.io/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman/  
**Backend API (Render):** _add the URL after deploying_  
**Mobile app:** Expo Go — see "Run the mobile app" below

---

## 👥 Team Members

| Name | Student ID (NIM) | Role in Team |
|---|---|---|
| **Muhammad Yunus Zulfikar Putra Dwi Hakim** | 01881250008 | Backend Developer & Database Specialist |
| **Yemima Nathania Anaya** | 01881250049 | Frontend UI/UX & Client Experience |
| **Calvin Japutra** | 01881250024 | Store Analytics & Admin Features |
| **Norman Abimael Zachary** | 01881250019 | Authentication, State & Testing |

---

## 📖 What it does

- **Clients** (web and phone) browse shoes, order them — also with a **different size for each
  foot** (e.g. left 9, right 9.5, still one pair) — see their own orders, save their foot sizes, and
  ask the **AI Fit Advisor** which shoes fit both feet best.
- **Administrators** (web) manage the catalogue and stock, see every order (orders with two sizes
  are marked "Different size per foot"), update order status, and answer the support chat.
- **One backend** (Express + libsql) serves both apps. The AI (OpenRouter) is called only by the
  backend, so no key is ever inside an app.

## 🛠️ Folders

```text
.
├── AGENTS.md            ← rules for AI coding agents (read first)
├── PROGRESS.md          ← hand-over note: done / next / known bugs / decisions
├── CHECKLIST_STATUS.md  ← capstone checklist A–J status
├── backend/             ← Express API (Render)
│   ├── server.js        ← app, CORS, routes, /images
│   ├── database.js      ← opens SQLite file or Turso, creates tables, adds new columns
│   ├── seed.js          ← npm run seed (deletes everything, inserts sample data)
│   ├── lib/sizes.js     ← shoe-size helpers (left/right foot)
│   ├── middleware/auth.js
│   ├── routes/          ← auth, shoes, orders, messages, ai
│   ├── public/images/   ← the 4 sample shoe pictures
│   └── .env.example
├── src/                 ← web app (React + Vite, GitHub Pages)
├── .env.example         ← VITE_API_URL for the web app
├── mobile-app/          ← Expo SDK 58 app (client role)
│   ├── app/             ← screens (Expo Router): (tabs)/index, advisor, orders, account,
│   │                      shoe/[id], order/[id], login
│   ├── lib/             ← api.js, auth.js, session.js (secure token), sizes.js
│   ├── components/
│   └── .env.example     ← EXPO_PUBLIC_API_URL
└── docs/design-doc-week13.md  ← Week 13 text for the Design Document (§3, §4, §5, §8)
```

`server/` is the old Week 6 demo server and is not used.

---

## 🚀 Run it on your laptop

Prerequisites: Node.js 20 or newer, npm, and the **Expo Go** app on your phone.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then set JWT_SECRET (see the comment in the file)
npm run seed              # sample data: 3 users, 4 shoes (deletes local data!)
npm run dev               # http://localhost:3000
```

Leave `TURSO_DATABASE_URL` empty on your laptop: the server then uses the local file
`backend/finishline.db`, and `npm run seed` can never touch production.

### 2. Web app (new terminal, repository root)

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000
npm run dev               # http://localhost:5173/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman/
```

`npm run dev:full` starts the backend and the web app together.

### 3. Mobile app (new terminal)

```bash
cd mobile-app
npm install
cp .env.example .env      # EXPO_PUBLIC_API_URL=http://<your laptop's Wi-Fi IP>:3000
npx expo start            # scan the QR code with Expo Go (iPhone: Camera app)
```

The phone cannot reach `localhost` on your laptop: use the laptop's Wi-Fi IP (same Wi-Fi), or the
deployed Render URL. After changing `.env`, restart `npx expo start`.

### Demo accounts (from `npm run seed`)

| Role | Username | Password |
|---|---|---|
| Administrator (web) | `admin` | `password` |
| Client | `client` | `password` |
| Client (to show "my orders" are private) | `client2` | `password` |

New client accounts can be created in the phone app (Account → Create account).

---

## 📡 API

Base URL: `http://localhost:3000` locally, the Render URL in production.
"Logged in" = header `Authorization: Bearer <token>`. No token → 401, wrong role → 403.

| Method | Path | Who | Body / query | Response |
|---|---|---|---|---|
| GET | `/api/health` | anyone | — | `{ status, database: "turso" \| "local-file" }` |
| POST | `/api/auth/register` | anyone | `{ username, password }` | 201 `{ token, user }` (always a client) |
| POST | `/api/auth/login` | anyone | `{ username, password }` | `{ token, user }` |
| GET | `/api/auth/me` | logged in | — | `{ user }` incl. `left_size`, `right_size` |
| PUT | `/api/auth/me/sizes` | logged in | `{ left_size, right_size }` (US sizes, or both `null`) | `{ user }` |
| GET | `/api/shoes` | anyone | `?search=&category=&sort=price-asc\|price-desc\|name` | `[shoe]` |
| GET | `/api/shoes/:id` | anyone | — | `shoe` |
| POST | `/api/shoes` | admin | `{ name, category, price, stock, sizes, description, image_url }` | 201 `shoe` |
| PUT | `/api/shoes/:id` | admin | any of the fields above | `shoe` |
| DELETE | `/api/shoes/:id` | admin | — | `{ message, id }` |
| POST | `/api/orders` | logged in | `{ customer: { name, address }, items: [{ id, quantity, left_size, right_size }] }` (or `selectedSize`) | 201 `order` |
| GET | `/api/orders/mine` | logged in | — | the user's own orders |
| GET | `/api/orders` | admin | — | all orders |
| PUT | `/api/orders/:id/status` | admin | `{ status }` — Pending, Processing, Shipped, Delivered, Cancelled | `order` |
| GET | `/api/messages` | logged in | — | support chat |
| POST | `/api/messages` | logged in | `{ text }` | 201 `message` |
| POST | `/api/ai/fit-advice` | logged in | `{ left_size, right_size, activity, notes }` | `{ ai_generated, model, summary, tips, picks }`; 503 `{ error, fallback_picks }` when the AI fails |

A shoe: `{ id, name, brand, price, category, stock, image_url, description, sizes: [8, 8.5, 9] }`.
An order item: `{ id, name, quantity, unit_price, left_size, right_size, split_size, selectedSize: "L 9 / R 9.5" }`.
Prices and totals are computed by the server from the database.

---

## ☁️ Deployment

Do it in this order. Secrets are copied into the dashboards, never into the repository.

1. **Turso** (database): create a database (region near Singapore) and a read & write token.
   Seed it **once**: put `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `backend/.env`, run
   `npm run seed -- --production`, then **remove both lines** from your `.env` again.
2. **Render** (backend): New → Web Service → this repository. Root directory `backend`,
   build `npm install`, start `npm start`. Environment:
   `JWT_SECRET` (a NEW random value: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`),
   `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`,
   `CORS_ORIGINS=https://newtsbrightside.github.io`. Open `https://<service>.onrender.com/api/health`:
   it must say `"database": "turso"`.
3. **Web app** (GitHub Pages): repository → Settings → Secrets and variables → Actions →
   Variables → `VITE_API_URL` = the Render URL. Then Actions → "Deploy Vite app to GitHub Pages" →
   Run workflow (the URL is built in, so every change needs a new build).
4. **Phone**: `mobile-app/.env` → `EXPO_PUBLIC_API_URL=https://<service>.onrender.com`, restart
   `npx expo start`, open in Expo Go on an iPhone and an Android phone, Wi-Fi off.
5. **Five checks**: the API answers; `/api/shoes` returns the seeded shoes; the web app's Network
   tab shows `…onrender.com`; the phone logs in on mobile data; create an order → Render →
   Restart service → the order is still there.

New column in production later? Add an `ensureColumn(...)` line in `backend/database.js` — it runs
`ALTER TABLE … ADD COLUMN` on start and keeps every row. Never run `npm run seed` on production again.

Free Render servers sleep after 15 minutes; open `/api/health` a few minutes before a demo.

---

## 📄 Course

Developed for **Web & Mobile Application Development**, Universitas Pelita Harapan (2026).
