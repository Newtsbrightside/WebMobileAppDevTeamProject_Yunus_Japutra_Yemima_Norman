require('dotenv').config();
const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/finishline',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  await pool.query(`
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
      customer JSONB NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0)
    );
  `);
};

const seedProducts = async (products) => {
  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM products');
  if (parseInt(rows[0].count) > 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const product of products) {
      await client.query(
        'INSERT INTO products (id, name, category, price, stock, image) VALUES ($1, $2, $3, $4, $5, $6)',
        [product.id, product.name, product.category, product.price, product.stock, product.image]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const ensureUploadsDirectory = () => {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
};

// Initialize tables on startup
initDB().catch(err => console.error('Database init error:', err));

module.exports = { pool, seedProducts, ensureUploadsDirectory };
