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
```
