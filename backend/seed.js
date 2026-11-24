// npm run seed — DELETES every row, then inserts the sample data again.
//
// On your laptop: run it whenever you want fresh sample data.
// On production (Turso): run it ONCE, at setup. Never again — it deletes real users' data.
// That is why it refuses to run when TURSO_DATABASE_URL is set, unless you add --production.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (process.env.TURSO_DATABASE_URL && !process.argv.includes('--production')) {
  console.error('TURSO_DATABASE_URL is set, so this would wipe the PRODUCTION database.');
  console.error('Only for the one-time setup, run: npm run seed -- --production');
  process.exit(1);
}

const bcrypt = require('bcryptjs');
const db = require('./database');

const passwordHash = bcrypt.hashSync('password', 10);

const users = [
  { username: 'admin', role: 'administrator', wallet: 0 },
  { username: 'client', role: 'client', wallet: 500 },
  { username: 'client2', role: 'client', wallet: 500 }
];

// image_url is a path served by this backend (backend/public/images) or a full https:// address.
const shoes = [
  {
    id: 's1',
    name: 'AeroGlide Pro Runner',
    price: 150,
    category: 'Running',
    stock: 24,
    image_url: '/images/aeroglide.jpg',
    description: 'Ultra-lightweight mesh and responsive foam make this the ultimate racing shoe.',
    sizes: [8, 9, 10, 11, 12]
  },
  {
    id: 's2',
    name: 'Classic Court Leather',
    price: 110,
    category: 'Casual',
    stock: 45,
    image_url: '/images/classic-court.jpg',
    description: 'Premium white leather and classic styling for everyday comfort.',
    sizes: [7, 8, 9, 10, 11, 12]
  },
  {
    id: 's3',
    name: 'Elevate High-Top X',
    price: 185,
    category: 'Basketball',
    stock: 12,
    image_url: '/images/elevate-high-top.jpg',
    description: 'Ankle support and high-grip rubber for explosive court performance.',
    sizes: [9, 10, 10.5, 11, 11.5, 12, 13]
  },
  {
    id: 's4',
    name: 'Urban Suede Retro',
    price: 130,
    category: 'Lifestyle',
    stock: 30,
    image_url: '/images/urban-suede.jpg',
    description: 'Navy blue suede with a chunky retro sole for maximum style.',
    sizes: [8, 8.5, 9, 9.5, 10, 11]
  }
];

const seed = db.transaction(() => {
  // Children first, because of the foreign keys.
  db.exec('DELETE FROM order_items');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM shoes');
  db.exec('DELETE FROM users');

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, role, wallet_balance) VALUES (?, ?, ?, ?)'
  );
  for (const user of users) {
    insertUser.run(user.username, passwordHash, user.role, user.wallet);
  }

  const insertShoe = db.prepare(`
    INSERT INTO shoes (id, name, brand, price, category, stock, image_url, description, sizes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const shoe of shoes) {
    insertShoe.run(
      shoe.id, shoe.name, 'Finish Line', shoe.price, shoe.category, shoe.stock,
      shoe.image_url, shoe.description, JSON.stringify(shoe.sizes)
    );
  }

  db.prepare('INSERT INTO messages (sender_role, sender_name, text, created_at) VALUES (?, ?, ?, ?)')
    .run('admin', 'Finishline Team', 'Welcome to Finishline support. How can we help?', new Date().toISOString());
});

seed();
console.log(`Seeded ${users.length} users and ${shoes.length} shoes into the ${db.location} database.`);
console.log('Demo logins: admin / password, client / password, client2 / password');
