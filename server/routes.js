const express = require('express');
const path = require('node:path');
const multer = require('multer');
const { pool } = require('./db');

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

router.get('/products', async (_request, response) => {
  try {
    const { rows } = await pool.query('SELECT id, name, category, price, stock, image FROM products ORDER BY id');
    response.json(rows);
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
});

router.post('/products', requireAdmin, async (request, response) => {
  const error = validateProduct(request.body);
  if (error) return response.status(400).json({ error });
  const id = `s${Date.now()}`;
  const image = request.body.image || '';
  
  try {
    await pool.query(
      'INSERT INTO products (id, name, category, price, stock, image) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, request.body.name.trim(), request.body.category.trim(), Number(request.body.price), Number(request.body.stock), image]
    );
    const { rows } = await pool.query('SELECT id, name, category, price, stock, image FROM products WHERE id = $1', [id]);
    response.status(201).json(rows[0]);
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', requireAdmin, async (request, response) => {
  const { category, price, stock, image } = request.body;
  const id = request.params.id;

  try {
    if (image !== undefined) {
      if (typeof image !== 'string' || !image.startsWith('https://')) return response.status(400).json({ error: 'Image URLs must start with https://.' });
      const result = await pool.query('UPDATE products SET image = $1 WHERE id = $2 RETURNING id, name, category, price, stock, image', [image, id]);
      if (result.rowCount === 0) return response.status(404).json({ error: 'Product not found.' });
      return response.json(result.rows[0]);
    }
    
    const { rows } = await pool.query('SELECT category, price, stock FROM products WHERE id = $1', [id]);
    if (rows.length === 0) return response.status(404).json({ error: 'Product not found.' });
    
    const product = rows[0];
    const nextCategory = category === undefined ? product.category : String(category).trim();
    const nextPrice = price === undefined ? product.price : Number(price);
    const nextStock = stock === undefined ? product.stock : Number(stock);
    
    if (!nextCategory || Number.isNaN(nextPrice) || nextPrice < 0 || Number.isNaN(nextStock) || nextStock < 0) return response.status(400).json({ error: 'Category, non-negative price, and non-negative stock are required.' });
    
    const updateResult = await pool.query(
      'UPDATE products SET category = $1, price = $2, stock = $3 WHERE id = $4 RETURNING id, name, category, price, stock, image',
      [nextCategory, nextPrice, nextStock, id]
    );
    if (updateResult.rowCount === 0) return response.status(404).json({ error: 'Product not found.' });
    response.json(updateResult.rows[0]);
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
});

router.put('/products/:id/image', requireAdmin, upload.single('image'), async (request, response) => {
  if (!request.file) return response.status(400).json({ error: 'A PNG, JPEG, or WEBP image up to 2 MB is required.' });
  const image = `/uploads/${request.file.filename}`;
  const id = request.params.id;
  
  try {
    const result = await pool.query('UPDATE products SET image = $1 WHERE id = $2 RETURNING id, name, category, price, stock, image', [image, id]);
    if (result.rowCount === 0) return response.status(404).json({ error: 'Product not found.' });
    response.json(result.rows[0]);
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', requireAdmin, async (request, response) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [request.params.id]);
    if (result.rowCount === 0) return response.status(404).json({ error: 'Product not found.' });
    response.status(204).end();
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
});

router.get('/orders', async (_request, response) => {
  try {
    const { rows: orders } = await pool.query('SELECT id, customer, total, status, created_at AS date FROM orders ORDER BY created_at DESC');
    const { rows: orderItems } = await pool.query('SELECT order_id, product_id AS id, quantity FROM order_items');
    
    response.json(orders.map(order => ({
      ...order,
      // Postgres jsonb driver might already parse it into an object, depending on how it was queried. 
      // If customer is an object, no need to parse. If string, parse it.
      customer: typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer,
      items: orderItems.filter(item => item.order_id === order.id).map(i => ({ id: i.id, quantity: i.quantity }))
    })));
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
});

router.post('/orders', async (request, response) => {
  const { customer, items } = request.body;
  if (!customer?.name || !customer?.address || !Array.isArray(items) || items.length === 0) return response.status(400).json({ error: 'Customer details and at least one order item are required.' });
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check products
    const productIds = items.map(item => item.id);
    const { rows: products } = await client.query('SELECT id, price, stock FROM products WHERE id = ANY($1)', [productIds]);
    
    if (products.length !== items.length) {
      await client.query('ROLLBACK');
      return response.status(400).json({ error: 'One or more products no longer exist.' });
    }
    
    // Validate stock and compute total
    let total = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      const quantity = Number(item.quantity || 1);
      if (product.stock < quantity) {
        await client.query('ROLLBACK');
        return response.status(409).json({ error: 'One or more products do not have enough stock.' });
      }
      total += product.price * quantity;
    }
    
    const id = `ORD-${Math.floor(Math.random() * 1000000)}`;
    const status = 'Pending';
    const createdAt = new Date().toISOString();
    
    // Postgres inserts customer as JSONB natively
    await client.query(
      'INSERT INTO orders (id, customer, total, status, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, customer, total, status, createdAt]
    );
    
    for (const item of items) {
      const quantity = Number(item.quantity || 1);
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
        [id, item.id, quantity]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [quantity, item.id]
      );
    }
    
    await client.query('COMMIT');
    response.status(201).json({ id, customer, total, status });
  } catch (err) {
    await client.query('ROLLBACK');
    response.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/orders/:id', requireAdmin, async (request, response) => {
  const allowed = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(request.body.status)) return response.status(400).json({ error: 'Invalid order status.' });
  
  try {
    const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING id', [request.body.status, request.params.id]);
    if (result.rowCount === 0) return response.status(404).json({ error: 'Order not found.' });
    response.json({ id: request.params.id, status: request.body.status });
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
});

module.exports = router;
