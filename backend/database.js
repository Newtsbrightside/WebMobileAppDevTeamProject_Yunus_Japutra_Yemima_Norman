const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'finishline.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      wallet_balance REAL NOT NULL DEFAULT 0.0
    );
  `);

  // 2. Shoes table
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

  // 3. Orders table
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

  // 4. Order items table
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

  // 5. Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedData();
}

function seedData() {
  // Seed initial users if table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, role, wallet_balance)
      VALUES (?, ?, ?, ?)
    `);

    const saltRounds = 10;
    const adminHash = bcrypt.hashSync('password', saltRounds);
    const clientHash = bcrypt.hashSync('password', saltRounds);

    insertUser.run('admin', adminHash, 'administrator', 0.0);
    insertUser.run('client', clientHash, 'client', 500.0);
  }

  // Seed initial shoes if table is empty
  const shoeCount = db.prepare('SELECT COUNT(*) as count FROM shoes').get().count;
  if (shoeCount === 0) {
    const insertShoe = db.prepare(`
      INSERT INTO shoes (id, name, brand, price, category, stock, image_url, description, sizes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialShoes = [
      {
        id: 's1',
        name: 'AeroGlide Pro Runner',
        brand: 'Finish Line',
        price: 150.00,
        category: 'Running',
        stock: 24,
        image_url: '/assets/images/aeroglide.jpg',
        description: 'Ultra-lightweight mesh and responsive foam make this the ultimate racing shoe.',
        sizes: JSON.stringify([8, 9, 10, 11, 12])
      },
      {
        id: 's2',
        name: 'Classic Court Leather',
        brand: 'Finish Line',
        price: 110.00,
        category: 'Casual',
        stock: 45,
        image_url: '/assets/images/classic-court.jpg',
        description: 'Premium white leather and classic styling for everyday comfort.',
        sizes: JSON.stringify([7, 8, 9, 10, 11, 12])
      },
      {
        id: 's3',
        name: 'Elevate High-Top X',
        brand: 'Finish Line',
        price: 185.00,
        category: 'Basketball',
        stock: 12,
        image_url: '/assets/images/elevate-high-top.jpg',
        description: 'Ankle support and high-grip rubber for explosive court performance.',
        sizes: JSON.stringify([9, 10, 10.5, 11, 11.5, 12, 13])
      },
      {
        id: 's4',
        name: 'Urban Suede Retro',
        brand: 'Finish Line',
        price: 130.00,
        category: 'Lifestyle',
        stock: 30,
        image_url: '/assets/images/urban-suede.jpg',
        description: 'Navy blue suede with a chunky retro sole for maximum style.',
        sizes: JSON.stringify([8, 8.5, 9, 9.5, 10, 11])
      }
    ];

    const seedTransaction = db.transaction((shoes) => {
      for (const shoe of shoes) {
        insertShoe.run(
          shoe.id,
          shoe.name,
          shoe.brand,
          shoe.price,
          shoe.category,
          shoe.stock,
          shoe.image_url,
          shoe.description,
          shoe.sizes
        );
      }
    });

    seedTransaction(initialShoes);
  }

  // Seed initial support message if empty
  const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
  if (msgCount === 0) {
    db.prepare(`
      INSERT INTO messages (sender_role, sender_name, text, created_at)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'Finishline Team', 'Welcome to Finishline support. How can we help?', new Date().toISOString());
  }
}

initDatabase();

module.exports = db;
