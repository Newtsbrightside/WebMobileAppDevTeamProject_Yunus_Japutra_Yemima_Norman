# Finishline

Finishline is a React/Vite footwear storefront prototype. Clients can browse and filter shoes, save wishlist items, build a shopping bag, complete a simulated checkout, review recent orders, top up a simulated wallet, and contact support. Administrators can manage inventory, add products, update stock and prices, manage order fulfillment, and answer support messages.

## Actors and Permissions

| Feature | Client | Administrator |
| --- | --- | --- |
| Sign in and log out | Yes | Yes |
| View, search, and filter catalog | Yes | View catalog |
| View product details and select size | Yes | - |
| Manage wishlist and shopping bag | Yes | - |
| Complete simulated checkout | Yes | - |
| View recent orders | Yes | View all orders |
| Send support messages | Yes | Answer support |
| Add new shoe | - | Yes |
| Edit category, price, and stock | - | Yes |
| Delete shoes | - | Yes |
| Update order status | - | Yes |

## What It Does Not Do

- It has no backend, database, or server-side authentication.
- Accounts and credentials are hardcoded for demonstration.
- Inventory, orders, wishlist, wallet, and messages are stored in browser `localStorage`.
- Checkout and wallet payments are simulated; no payment is processed.
- Data is not shared between different browsers or devices.

## Demo Accounts

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `password` |
| Client | `client` | `password` |

## Running Locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Live Site

[Open the Finishline GitHub Pages site](https://newtsbrightside.github.io/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman/)

## Backend (Optional Bonus)

The optional backend is an Express + SQLite service in `server/`. It persists products and orders, accepts administrator product edits, stores uploaded product images in `server/uploads/`, and seeds the four demo products into SQLite on first start.

The GitHub Pages deployment cannot host Node.js, so the live site automatically uses offline demo mode when the API is unavailable. Local development can use the database-backed mode:

```bash
npm install
npm run dev:full
```

The API runs on `http://localhost:3001`. The frontend uses `VITE_API_URL` from `.env` when provided; `.env.example` contains the default local value.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/products` | List products |
| POST | `/api/products` | Add a product; administrator role required |
| PUT | `/api/products/:id` | Edit category, price, stock, or HTTPS image URL; administrator role required |
| PUT | `/api/products/:id/image` | Upload a PNG, JPEG, or WEBP image up to 2 MB; administrator role required |
| DELETE | `/api/products/:id` | Delete a product; administrator role required |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create an order from checkout |
| PUT | `/api/orders/:id` | Update fulfillment status; administrator role required |

The demo backend checks the `x-role` header for administrator routes. This is intentionally a teaching/demo check, not production authentication.

The original `classic-court.jpg` and `urban-suede.jpg` files are byte-identical in the supplied assets. The app keeps both product records and allows an administrator to replace either image rather than inventing a replacement asset.

## Team

- Muhammad Yunus Zulfikar Putra Dwi Hakim
- Yemima Nathania Anaya
- Calvin Japutra
- Norman Abimael Zachary

## Folder Structure

```text
src/
  assets/images/       Product images and fallback asset
  components/          Shared UI components
  context/             Authentication and store state
  pages/               Login, dashboard, and add-shoe screens
  data.js              Demo users, products, and store locations
  App.jsx              HashRouter routes and access protection
  index.css            Shared application styles
public/                Static favicon and icon sprite
.github/workflows/     GitHub Pages deployment workflow
server/                Optional Express + SQLite API, seed images, and uploads
```
