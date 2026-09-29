const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, 'finishline.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    image TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
  );
`);

const seedProducts = products => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
  if (count > 0) return;

  const insert = db.prepare('INSERT INTO products (id, name, category, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)');
  const seed = db.transaction(items => items.forEach(product => insert.run(
    product.id,
    product.name,
    product.category,
    product.price,
    product.stock,
    product.image
  )));
  seed(products);
};

const ensureUploadsDirectory = () => {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
};

module.exports = { db, seedProducts, ensureUploadsDirectory };
