const express = require('express');
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { parseSizes, isValidSize, sizeLabel } = require('../lib/sizes');

const router = express.Router();

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const MAX_QUANTITY = 10;

function httpError(status, message) {
  const err = new Error(message);
  err.statusCode = status;
  return err;
}

function loadItems(orderId) {
  return db.prepare(`
    SELECT oi.*, s.name AS current_name, s.brand, s.image_url
    FROM order_items oi
    LEFT JOIN shoes s ON oi.shoe_id = s.id
    WHERE oi.order_id = ?
  `).all(orderId);
}

// Shape of an order in every API response.
function formatOrder(row, itemRows) {
  const items = itemRows.map(item => {
    const left = item.left_size == null ? null : Number(item.left_size);
    const right = item.right_size == null ? null : Number(item.right_size);
    return {
      id: item.shoe_id,
      shoe_id: item.shoe_id,
      name: item.shoe_name || item.current_name || 'Removed shoe',
      brand: item.brand || 'Finish Line',
      image: item.image_url || null,
      left_size: left,
      right_size: right,
      split_size: left !== null && right !== null && left !== right,
      selectedSize: item.selected_size, // e.g. "9" or "L 9 / R 9.5"
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      price: Number(item.unit_price)
    };
  });

  return {
    id: row.id,
    user_id: row.user_id,
    customer_name: row.customer_name,
    delivery_address: row.delivery_address,
    customer: { name: row.customer_name, address: row.delivery_address },
    total: Number(row.total_amount),
    total_amount: Number(row.total_amount),
    status: row.status,
    created_at: row.created_at,
    date: row.created_at,
    items
  };
}

function newOrderId() {
  for (;;) {
    const id = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    if (!db.prepare('SELECT id FROM orders WHERE id = ?').get(id)) return id;
  }
}

// Works out the size for each foot of one order line, and checks the shoe has them.
// The item can send one size ({ selectedSize: 9 }) or one per foot ({ left_size: 9, right_size: 9.5 }).
function resolveSizes(item, shoe) {
  const single = item.selectedSize ?? item.selected_size ?? item.size;
  const left = Number(item.left_size ?? single);
  const right = Number(item.right_size ?? single);

  if (!isValidSize(left) || !isValidSize(right)) {
    throw httpError(400, `Choose a size for ${shoe.name}.`);
  }

  const available = parseSizes(shoe.sizes);
  for (const [foot, size] of [['left', left], ['right', right]]) {
    if (!available.includes(size)) {
      throw httpError(400, `Size ${size} (${foot} foot) is not available for ${shoe.name}. Available: ${available.join(', ')}.`);
    }
  }
  return { left, right };
}

// POST /api/orders — a logged-in user places an order.
// The server reads prices and stock from the database; prices sent by the app are ignored.
router.post('/', authenticateToken, (req, res) => {
  const { customer, customer_name, delivery_address, items } = req.body;
  const name = String((customer && customer.name) || customer_name || '').trim();
  const address = String((customer && customer.address) || delivery_address || '').trim();

  if (!name || !address) {
    return res.status(400).json({ error: 'Name and delivery address are required.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }

  try {
    const placeOrder = db.transaction(() => {
      const orderId = newOrderId();
      const now = new Date().toISOString();
      const lines = [];
      let total = 0;

      for (const item of items) {
        const shoeId = String(item.id || item.shoe_id || '');
        const shoe = db.prepare('SELECT id, name, price, stock, sizes FROM shoes WHERE id = ?').get(shoeId);
        if (!shoe) throw httpError(404, `Shoe '${shoeId}' is not in the catalogue.`);

        const quantity = Math.floor(Number(item.quantity) || 1);
        if (quantity < 1 || quantity > MAX_QUANTITY) {
          throw httpError(400, `Quantity must be between 1 and ${MAX_QUANTITY}.`);
        }

        const { left, right } = resolveSizes(item, shoe);

        // Take the stock only if there is enough left. One pair = one unit, even with two sizes.
        const taken = db.prepare('UPDATE shoes SET stock = stock - ? WHERE id = ? AND stock >= ?')
          .run(quantity, shoe.id, quantity);
        if (taken.changes !== 1) {
          throw httpError(409, `Not enough stock for ${shoe.name}. Available: ${shoe.stock}.`);
        }

        total += Number(shoe.price) * quantity;
        lines.push({ shoe, quantity, left, right });
      }

      db.prepare(`
        INSERT INTO orders (id, user_id, customer_name, delivery_address, total_amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'Pending', ?)
      `).run(orderId, req.user.id, name, address, total, now);

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, shoe_id, shoe_name, selected_size, left_size, right_size, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const line of lines) {
        insertItem.run(
          orderId, line.shoe.id, line.shoe.name, sizeLabel(line.left, line.right),
          line.left, line.right, line.quantity, Number(line.shoe.price)
        );
      }

      return orderId;
    });

    const orderId = placeOrder();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return res.status(201).json(formatOrder(order, loadItems(orderId)));
  } catch (err) {
    if (!err.statusCode) console.error('Order placement error:', err);
    return res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Failed to place order.' });
  }
});

// GET /api/orders/mine — the logged-in user's orders only.
// The user id comes from the token, so nobody can ask for someone else's orders.
router.get('/mine', authenticateToken, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  return res.json(orders.map(order => formatOrder(order, loadItems(order.id))));
});

// GET /api/orders — administrators see every order
router.get('/', requireAdmin, (_req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  return res.json(orders.map(order => formatOrder(order, loadItems(order.id))));
});

// PUT /api/orders/:id/status — administrators move an order along
router.put('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${STATUSES.join(', ')}` });
  }

  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  return res.json(formatOrder(order, loadItems(req.params.id)));
});

module.exports = router;
