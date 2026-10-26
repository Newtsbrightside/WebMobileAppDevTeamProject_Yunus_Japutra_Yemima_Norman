const express = require('express');
const db = require('../database');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to format order with items for response
function formatOrder(orderRow, itemsRows = []) {
  if (!orderRow) return null;

  const items = itemsRows.map(item => ({
    id: item.shoe_id,
    shoe_id: item.shoe_id,
    name: item.name || item.shoe_name,
    brand: item.brand,
    image: item.image_url,
    selectedSize: item.selected_size,
    quantity: item.quantity,
    price: item.unit_price,
    unit_price: item.unit_price
  }));

  return {
    id: orderRow.id,
    user_id: orderRow.user_id,
    customer_name: orderRow.customer_name,
    delivery_address: orderRow.delivery_address,
    customer: {
      name: orderRow.customer_name,
      address: orderRow.delivery_address
    },
    total: Number(orderRow.total_amount),
    total_amount: Number(orderRow.total_amount),
    status: orderRow.status,
    created_at: orderRow.created_at,
    date: orderRow.created_at,
    items
  };
}

// POST /api/orders - Client places an order (decrements stock in transaction)
router.post('/', optionalAuth, (req, res) => {
  const { customer, customer_name, delivery_address, items, total, total_amount } = req.body;

  const resolvedCustomerName = (customer && customer.name) || customer_name;
  const resolvedAddress = (customer && customer.address) || delivery_address || 'Standard Delivery';

  if (!resolvedCustomerName) {
    return res.status(400).json({ error: 'Customer name is required to place an order.' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }

  const userId = req.user ? req.user.id : null;
  const orderId = req.body.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    const placeOrderTransaction = db.transaction(() => {
      let calculatedTotal = 0;
      const verifiedItems = [];

      // 1. Verify stock and calculate total
      for (const item of items) {
        const shoeId = item.id || item.shoe_id;
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const selectedSize = item.selectedSize || item.selected_size || item.size || 'Standard';

        const shoe = db.prepare('SELECT id, name, price, stock, image_url, brand FROM shoes WHERE id = ?').get(shoeId);
        if (!shoe) {
          throw new Error(`Shoe with ID '${shoeId}' not found in catalogue.`);
        }

        if (shoe.stock < quantity) {
          const err = new Error(`Insufficient stock for '${shoe.name}'. Available: ${shoe.stock}, requested: ${quantity}.`);
          err.statusCode = 409;
          throw err;
        }

        calculatedTotal += Number(shoe.price) * quantity;
        verifiedItems.push({
          shoeId: shoe.id,
          name: shoe.name,
          brand: shoe.brand,
          image_url: shoe.image_url,
          selectedSize,
          quantity,
          unitPrice: Number(shoe.price)
        });
      }

      const finalTotal = total || total_amount ? Number(total || total_amount) : calculatedTotal;
      const now = new Date().toISOString();

      // 2. Insert into orders table
      db.prepare(`
        INSERT INTO orders (id, user_id, customer_name, delivery_address, total_amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, userId, resolvedCustomerName, resolvedAddress, finalTotal, 'Pending', now);

      // 3. Insert items and decrement stock
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, shoe_id, selected_size, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?)
      `);
      const decrementStock = db.prepare(`
        UPDATE shoes SET stock = stock - ? WHERE id = ?
      `);

      for (const item of verifiedItems) {
        insertItem.run(orderId, item.shoeId, item.selectedSize, item.quantity, item.unitPrice);
        decrementStock.run(item.quantity, item.shoeId);
      }

      return {
        id: orderId,
        user_id: userId,
        customer_name: resolvedCustomerName,
        delivery_address: resolvedAddress,
        total_amount: finalTotal,
        status: 'Pending',
        created_at: now,
        items: verifiedItems.map(v => ({
          shoe_id: v.shoeId,
          name: v.name,
          brand: v.brand,
          image_url: v.image_url,
          selected_size: v.selectedSize,
          quantity: v.quantity,
          unit_price: v.unitPrice
        }))
      };
    });

    const createdOrder = placeOrderTransaction();
    return res.status(201).json(formatOrder(createdOrder, createdOrder.items));
  } catch (err) {
    console.error('Order placement error:', err.message);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({ error: err.message || 'Failed to place order.' });
  }
});

// GET /api/orders/mine - Client gets own order history
router.get('/mine', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE user_id = ? OR LOWER(customer_name) = LOWER(?)
      ORDER BY created_at DESC
    `).all(req.user.id, req.user.username);

    const fullOrders = orders.map(order => {
      const items = db.prepare(`
        SELECT oi.*, s.name, s.brand, s.image_url
        FROM order_items oi
        LEFT JOIN shoes s ON oi.shoe_id = s.id
        WHERE oi.order_id = ?
      `).all(order.id);
      return formatOrder(order, items);
    });

    return res.json(fullOrders);
  } catch (err) {
    console.error('Fetch my orders error:', err);
    return res.status(500).json({ error: 'Failed to retrieve order history.' });
  }
});

// GET /api/orders - Admin gets all orders
router.get('/', requireAdmin, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();

    const fullOrders = orders.map(order => {
      const items = db.prepare(`
        SELECT oi.*, s.name, s.brand, s.image_url
        FROM order_items oi
        LEFT JOIN shoes s ON oi.shoe_id = s.id
        WHERE oi.order_id = ?
      `).all(order.id);
      return formatOrder(order, items);
    });

    return res.json(fullOrders);
  } catch (err) {
    console.error('Fetch orders error:', err);
    return res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// PUT /api/orders/:id/status - Admin updates order status
router.put('/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    const items = db.prepare(`
      SELECT oi.*, s.name, s.brand, s.image_url
      FROM order_items oi
      LEFT JOIN shoes s ON oi.shoe_id = s.id
      WHERE oi.order_id = ?
    `).all(id);

    return res.json(formatOrder(updated, items));
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// Alias for PUT /api/orders/:id (allows updating status directly via /api/orders/:id)
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status) {
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const items = db.prepare(`
    SELECT oi.*, s.name, s.brand, s.image_url
    FROM order_items oi
    LEFT JOIN shoes s ON oi.shoe_id = s.id
    WHERE oi.order_id = ?
  `).all(id);

  return res.json(formatOrder(updated, items));
});

module.exports = router;
