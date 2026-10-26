# Finishline — Sneaker Store Web Application

**Course:** Web & Mobile Application Development (Midterm / Week 10 Milestone)  
**Group:** 14  
**Live Deployed App (GitHub Pages):** [https://newtsbrightside.github.io/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman/](https://newtsbrightside.github.io/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman/)  
**GitHub Repository:** [https://github.com/Newtsbrightside/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman](https://github.com/Newtsbrightside/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman)

---

## 👥 Team Members

| Name | Student ID (NIM) | Role in Team |
|---|---|---|
| **Muhammad Yunus Zulfikar Putra Dwi Hakim** | 01881250008 | Backend Developer & Database Specialist |
| **Yemima Nathania Anaya** | 01881250049 | Frontend UI/UX & Client Experience |
| **Calvin Japutra** | 01881250024 | Store Analytics & Admin Features |
| **Norman Abimael Zachary** | 01881250019 | Authentication, State & Testing |

---

## 📖 Project Overview

Finishline is a modern web application connecting sneaker shoppers and store administrators under a unified platform. 
- **Shoppers (Clients):** Browse and search footwear, filter by category, inspect detailed size charts, manage wishlist and shopping bag, simulate wallet payments and checkout, review personal order history, and chat in real-time with customer support.
- **Store Administrators:** Access the comprehensive "Store Command" dashboard featuring live revenue metrics, inventory stock controls, low-stock notifications, CRUD operations for shoes, order fulfillment status management, and a customer support inbox.

The application is built with a decoupled architecture:
1. **Frontend:** React 19 + Vite (Single Page Application with Lucide icons, responsive design system, and canvas-confetti).
2. **Backend:** Node.js + Express REST API with SQLite database (`better-sqlite3`), JWT authentication, and bcrypt password hashing.
3. **Resilient Fallback:** The frontend operates seamlessly when connected to the live backend while preserving full `localStorage` fallback if offline or hosted statically on GitHub Pages.

---

## 🛠️ Tech Stack & Directory Structure

```text
.
├── backend/                  # Node.js + Express + SQLite API server
│   ├── database.js           # SQLite schema creation & seed data
│   ├── server.js             # Express app entry point & route mounting
│   ├── middleware/
│   │   └── auth.js           # JWT verification & role-based access middleware
│   ├── routes/
│   │   ├── auth.js           # /api/auth routes (login, register, me)
│   │   ├── shoes.js          # /api/shoes catalogue CRUD routes
│   │   ├── orders.js         # /api/orders order placement & status routes
│   │   └── messages.js       # /api/messages concierge support chat routes
│   ├── .env.example          # Backend environment template
│   └── package.json          # Backend dependencies
├── src/                      # React 19 + Vite Web Application
│   ├── api/api.js            # Unified API service with JWT auth & fallback
│   ├── components/           # Navbar, modals, image handlers
│   ├── context/              # AuthContext (JWT) & StoreContext
│   ├── data/                 # Initial mock data and seeds
│   └── pages/                # Login, Client/Admin Dashboard, AddShoe
├── public/                   # Static icons and assets
├── package.json              # Root scripts (concurrent full-stack runner)
├── vite.config.js            # Vite configuration with /api proxy to port 3000
└── README.md
```

---

## 🚀 Getting Started (Run Locally)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended; compatible with Node 20–26)
- `npm` (bundled with Node.js)

### 2. Clone the Repository
```bash
git clone https://github.com/Newtsbrightside/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman.git
cd WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman
```

### 3. Install Dependencies
You can install dependencies for both root (frontend) and backend:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 4. Running the Application

#### Option A: Run Both Concurrently (Recommended)
Run both the Vite frontend (`http://localhost:5173`) and Express backend (`http://localhost:3000`) in parallel using a single terminal command:
```bash
npm run dev:full
```

#### Option B: Run Services Separately

**Terminal 1 — Backend API:**
```bash
cd backend
npm run dev
# Server will run at http://localhost:3000
```

**Terminal 2 — Frontend Application:**
```bash
npm run dev
# Web app will run at http://localhost:5173
```

---

## 🔐 Demo Accounts

| Role | Username | Password | Notes |
|---|---|---|---|
| **Administrator** | `admin` | `password` | Access to Store Command, inventory CRUD, order status updates, and support inbox |
| **Client** | `client` | `password` | Access to footwear catalogue, wishlist, shopping bag, checkout, and live chat |

*Note: New client accounts can also be created via the register endpoint or form.*

---

## 📡 API Endpoints (Week 10 Milestone)

All endpoints are hosted under `http://localhost:3000/api`:

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Auth Required | Description | Request Body | Response |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register new client account | `{ username, password, role? }` | `{ message, token, user }` (201) |
| `POST` | `/api/auth/login` | No | Authenticate user & get JWT | `{ username, password }` | `{ message, token, user }` (200) |
| `GET` | `/api/auth/me` | Bearer Token | Get current user profile | None | `{ user }` (200) |

### 2. Shoes / Footwear Catalogue (`/api/shoes`)
| Method | Endpoint | Auth Required | Description | Query / Request Body | Response |
|---|---|---|---|---|---|
| `GET` | `/api/shoes` | No | List shoes (with filters) | `?search=...&category=...&sort=...` | `[ { id, name, price, stock, ... } ]` |
| `GET` | `/api/shoes/:id` | No | Get single shoe details | None | `{ shoe object }` (200) |
| `POST` | `/api/shoes` | Admin (JWT) | Add new shoe to catalogue | `{ name, brand, price, category, stock, sizes, description, image_url }` | `{ created shoe }` (201) |
| `PUT` | `/api/shoes/:id` | Admin (JWT) | Update shoe details/stock | `{ name?, price?, stock?, ... }` | `{ updated shoe }` (200) |
| `DELETE` | `/api/shoes/:id` | Admin (JWT) | Remove shoe from inventory | None | `{ message, id }` (200) |

### 3. Orders (`/api/orders`)
| Method | Endpoint | Auth Required | Description | Request Body | Response |
|---|---|---|---|---|---|
| `POST` | `/api/orders` | Optional | Place an order (decrements stock in a transaction) | `{ customer, items: [{ id, quantity, selectedSize }] }` | `{ created order }` (201) |
| `GET` | `/api/orders/mine` | Client (JWT) | Get personal order history | None | `[ { order with items } ]` (200) |
| `GET` | `/api/orders` | Admin (JWT) | Get all customer orders | None | `[ { order with items } ]` (200) |
| `PUT` | `/api/orders/:id/status`| Admin (JWT) | Update order status | `{ status: "Processing" / "Shipped" / "Delivered" / "Cancelled" }` | `{ updated order }` (200) |

### 4. Support Messages (`/api/messages`)
| Method | Endpoint | Auth Required | Description | Request Body | Response |
|---|---|---|---|---|---|
| `GET` | `/api/messages` | No | Fetch chat history | None | `[ { id, sender, sender_name, text, time } ]` |
| `POST` | `/api/messages` | Optional | Send concierge message | `{ text, sender?, sender_name? }` | `{ created message }` (201) |

---

## 📄 License & Course Information
This project is developed as part of the **Web & Mobile Application Development** curriculum at **Universitas Pelita Harapan (2026)**.
