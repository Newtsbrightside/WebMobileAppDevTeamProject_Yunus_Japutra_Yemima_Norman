# Finishline Backend

This optional service gives the frontend a small database-backed mode for local demonstrations. GitHub Pages uses the frontend's offline demo mode because Pages cannot run Node.js.

## Files

- `index.js`: starts Express, configures CORS and JSON handling, serves uploads, seeds products, and mounts the API.
- `db.js`: opens `finishline.db`, creates the products/orders/order_items tables, and inserts the four demo products on an empty database.
- `routes.js`: contains product and order REST routes, validation, parameterized SQL, multer image uploads, and the demo administrator role check.
- `seed/`: copies of the four supplied product assets used by the initial database records.
- `uploads/`: runtime upload directory. Its contents are ignored by Git; `.gitkeep` keeps the directory available.

## Run

From the repository root:

```bash
npm install
npm run server
```

Or run Vite and the API together:

```bash
npm run dev:full
```

The API listens on port `3001`. The frontend sends the logged-in role in `x-role`; this is only a simple demo guard and is not a replacement for production authentication.