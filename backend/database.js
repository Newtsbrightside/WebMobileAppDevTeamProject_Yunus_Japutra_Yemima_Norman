// Opens the database and makes sure every table and column exists.
//
// - On your laptop: a local SQLite file (backend/finishline.db).
// - In production (Render): the hosted Turso database, chosen by setting
//   TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Render → Environment.
//
// The `libsql` package has the same API as better-sqlite3, so the routes did not change.
// Starting the server NEVER deletes rows. Sample data comes only from `npm run seed`.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Database = require('libsql');

const tursoUrl = process.env.TURSO_DATABASE_URL;
const isTurso = Boolean(tursoUrl);

const db = isTurso
  ? new Database(tursoUrl, { authToken: process.env.TURSO_AUTH_TOKEN })
  : new Database(process.env.DB_PATH || path.join(__dirname, 'finishline.db'));

db.location = isTurso ? 'turso' : 'local-file';

if (!isTurso) {
  db.exec('PRAGMA journal_mode = WAL');
}
try {
  db.exec('PRAGMA foreign_keys = ON');
} catch (err) {
  console.warn('Could not enable foreign keys:', err.message);
}

// Adds a column to a table that already exists, keeping every row.
// This is how a new column reaches a database that already holds real data.
function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(existing => existing.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${table}.${column}`);
  }
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      wallet_balance REAL NOT NULL DEFAULT 0.0
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS shoes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT 'Finish Line',
      price REAL NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      description TEXT,
      sizes TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      shoe_id TEXT,
      selected_size TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (shoe_id) REFERENCES shoes(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Week 13 changes. Each line is safe to run again: it only adds what is missing.
function migrate() {
  // A customer can save a different size for each foot.
  ensureColumn('users', 'left_size', 'REAL');
  ensureColumn('users', 'right_size', 'REAL');
  // An order line can have a different size for each foot.
  ensureColumn('order_items', 'left_size', 'REAL');
  ensureColumn('order_items', 'right_size', 'REAL');
  // Keep the shoe's name on the order, so old orders still read well if a shoe is deleted.
  ensureColumn('order_items', 'shoe_name', 'TEXT');

  // Week 10 seed rows pointed at /assets/images/, a folder the server never had.
  // The pictures are served from /images/ now (backend/public/images).
  db.exec("UPDATE shoes SET image_url = REPLACE(image_url, '/assets/images/', '/images/') WHERE image_url LIKE '/assets/images/%'");
}

createTables();
migrate();

module.exports = db;
