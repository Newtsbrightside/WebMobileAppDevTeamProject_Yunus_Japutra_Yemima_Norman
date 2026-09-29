const express = require('express');
const path = require('node:path');
const multer = require('multer');
const { db } = require('./db');

const router = express.Router();
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    callback(null, ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype));
  }
});

// Demo-level role check only; production authentication must use signed sessions or tokens.
const requireAdmin = (request, response, next) => {
  if (request.header('x-role') !== 'administrator') return response.status(403).json({ error: 'Administrator access required.' });
  next();
};

const validateProduct = body => {
  if (!body.name || !body.category || Number.isNaN(Number(body.price)) || Number(body.price) < 0 || Number.isNaN(Number(body.stock)) || Number(body.stock) < 0) {
    return 'Name, category, non-negative price, and non-negative stock are required.';
  }
  return null;
};

router.get('/products', (_request, response) => {
  response.json(db.prepare('SELECT id, name, category, price, stock, image FROM products ORDER BY id').all());
});

router.post('/products', requireAdmin, (request, response) => {
  const error = validateProduct(request.body);
  if (error) return response.status(400).json({ error });
  const id = `s${Date.now()}`;
  const image = request.body.image || '';
  db.prepare('INSERT INTO products (id, name, category, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)').run(id, request.body.name.trim(), request.body.category.trim(), Number(request.body.price), Number(request.body.stock), image);
  response.status(201).json(db.prepare('SELECT id, name, category, price, stock, image FROM products WHERE id = ?').get(id));
});

router.put('/products/:id', requireAdmin, (request, response) => {
  const { category, price, stock } = request.body;
  if (!category || Number.isNaN(Number(price)) || Number(price) < 0 || Number.isNaN(Number(stock)) || Number(stock) < 0) return response.status(400).json({ error: 'Category, non-negative price, and non-negative stock are required.' });
  const result = db.prepare('UPDATE products SET category = ?, price = ?, stock = ? WHERE id = ?').run(category.trim(), Number(price), Number(stock), request.params.id);
  if (!result.changes) return response.status(404).json({ error: 'Product not found.' });
  response.json(db.prepare('SELECT id, name, category, price, stock, image FROM products WHERE id = ?').get(request.params.id));
});

router.put('/products/:id/image', requireAdmin, upload.single('image'), (request, response) => {
  if (!request.file) return response.status(400).json({ error: 'A PNG, JPEG, or WEBP image up to 2 MB is required.' });
  const image = `/uploads/${request.file.filename}`;
  const result = db.prepare('UPDATE products SET image = ? WHERE id = ?').run(image, request.params.id);
  if (!result.changes) return response.status(404).json({ error: 'Product not found.' });
  response.json(db.prepare('SELECT id, name, category, price, stock, image FROM products WHERE id = ?').get(request.params.id));
});

router.delete('/products/:id', requireAdmin, (request, response) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(request.params.id);
  if (!result.changes) return response.status(404).json({ error: 'Product not found.' });
  response.status(204).end();
});

router.get('/orders', (_request, response) => {
  const orders = db.prepare('SELECT id, customer, total, status, created_at AS date FROM orders ORDER BY created_at DESC').all();
  response.json(orders.map(order => ({ ...order, customer: JSON.parse(order.customer), items: db.prepare('SELECT product_id AS id, quantity FROM order_items WHERE order_id = ?').all(order.id) })));
});

router.post('/orders', (request, response) => {
  const { customer, items } = request.body;
  if (!customer?.name || !customer?.address || !Array.isArray(items) || items.length === 0) return response.status(400).json({ error: 'Customer details and at least one order item are required.' });
  const products = items.map(item => db.prepare('SELECT id, price, stock FROM products WHERE id = ?').get(item.id));
  if (products.some(product => !product)) return response.status(400).json({ error: 'One or more products no longer exist.' });
  if (products.some((product, index) => product.stock < Number(items[index].quantity || 1))) return response.status(409).json({ error: 'One or more products do not have enough stock.' });
  const id = `ORD-${Math.floor(Math.random() * 1000000)}`;
  const total = products.reduce((sum, product, index) => sum + product.price * Number(items[index].quantity || 1), 0);
  const createOrder = db.transaction(() => {
    db.prepare('INSERT INTO orders (id, customer, total, status, created_at) VALUES (?, ?, ?, ?, ?)').run(id, JSON.stringify(customer), total, 'Pending', new Date().toISOString());
    const addItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)');
    const reduceStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    items.forEach((item, index) => { const quantity = Number(item.quantity || 1); addItem.run(id, item.id, quantity); reduceStock.run(quantity, products[index].id); });
  });
  createOrder();
  response.status(201).json({ id, customer, total, status: 'Pending' });
});

router.put('/orders/:id', requireAdmin, (request, response) => {
  const allowed = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(request.body.status)) return response.status(400).json({ error: 'Invalid order status.' });
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(request.body.status, request.params.id);
  if (!result.changes) return response.status(404).json({ error: 'Order not found.' });
  response.json({ id: request.params.id, status: request.body.status });
});

module.exports = router;
