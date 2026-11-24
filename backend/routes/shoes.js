const express = require('express');
const db = require('../database');
const { requireAdmin } = require('../middleware/auth');
const { parseSizes, isValidSize } = require('../lib/sizes');

const router = express.Router();

const DEFAULT_SIZES = [8, 9, 10, 11, 12];

// Shape of a shoe in every API response.
function formatShoe(row) {
  const sizes = parseSizes(row.sizes);
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || 'Finish Line',
    price: Number(row.price),
    category: row.category,
    stock: Number(row.stock),
    image_url: row.image_url || null,
    image: row.image_url || null, // same value, kept for the web app's older code
    description: row.description || '',
    sizes: sizes.length > 0 ? sizes : DEFAULT_SIZES,
    colors: ['Standard', 'Alternate']
  };
}

// Pictures are never stored in the database or on the server's disk.
// The database keeps only an address: a full https:// URL, or /images/... for the
// sample pictures that ship with the code (backend/public/images).
function checkImageUrl(value) {
  if (value === undefined || value === null || value === '') return { ok: true, value: null };
  if (typeof value === 'string' && (value.startsWith('https://') || value.startsWith('/images/'))) {
    return { ok: true, value: value.trim() };
  }
  return { ok: false, error: 'image_url must be an https:// address (uploading files is not supported).' };
}

function checkSizes(value) {
  if (value === undefined) return { ok: true, value: undefined };
  const sizes = Array.isArray(value) ? value : parseSizes(value);
  if (sizes.length === 0 || !sizes.every(isValidSize)) {
    return { ok: false, error: 'sizes must be a list of US sizes between 3 and 16, e.g. [8, 8.5, 9].' };
  }
  return { ok: true, value: JSON.stringify([...new Set(sizes.map(Number))].sort((a, b) => a - b)) };
}

function isNonNegativeNumber(value) {
  return value !== '' && value !== null && Number.isFinite(Number(value)) && Number(value) >= 0;
}

// GET /api/shoes?search=&category=&sort= — public catalogue
router.get('/', (req, res) => {
  const { search, category, sort } = req.query;

  try {
    let query = 'SELECT * FROM shoes WHERE 1=1';
    const params = [];

    if (typeof search === 'string' && search.trim()) {
      query += ' AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (typeof category === 'string' && category.trim() && category.trim().toLowerCase() !== 'all') {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category.trim());
    }

    if (sort === 'price-asc') query += ' ORDER BY price ASC';
    else if (sort === 'price-desc') query += ' ORDER BY price DESC';
    else if (sort === 'name') query += ' ORDER BY name ASC';
    else query += ' ORDER BY id ASC';

    return res.json(db.prepare(query).all(...params).map(formatShoe));
  } catch (err) {
    console.error('Fetch shoes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve shoes catalogue.' });
  }
});

// GET /api/shoes/:id — public detail
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM shoes WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Shoe not found.' });
  }
  return res.json(formatShoe(row));
});

// POST /api/shoes — administrators add a shoe
router.post('/', requireAdmin, (req, res) => {
  const { name, brand = 'Finish Line', price, category, stock = 0, description = '' } = req.body;

  if (!name || !category || !isNonNegativeNumber(price) || !isNonNegativeNumber(stock)) {
    return res.status(400).json({ error: 'Name, category, a price and a stock of 0 or more are required.' });
  }

  const image = checkImageUrl(req.body.image_url ?? req.body.image);
  if (!image.ok) return res.status(400).json({ error: image.error });

  const sizes = checkSizes(req.body.sizes ?? DEFAULT_SIZES);
  if (!sizes.ok) return res.status(400).json({ error: sizes.error });

  const id = `s${Date.now()}`;

  try {
    db.prepare(`
      INSERT INTO shoes (id, name, brand, price, category, stock, image_url, description, sizes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, String(name).trim(), String(brand), Number(price), String(category),
      Math.floor(Number(stock)), image.value, String(description), sizes.value
    );
    return res.status(201).json(formatShoe(db.prepare('SELECT * FROM shoes WHERE id = ?').get(id)));
  } catch (err) {
    console.error('Add shoe error:', err);
    return res.status(500).json({ error: 'Failed to add shoe to catalogue.' });
  }
});

// PUT /api/shoes/:id — administrators change any field
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM shoes WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Shoe not found.' });
  }

  const body = req.body;
  if (body.price !== undefined && !isNonNegativeNumber(body.price)) {
    return res.status(400).json({ error: 'Price must be a number of 0 or more.' });
  }
  if (body.stock !== undefined && !isNonNegativeNumber(body.stock)) {
    return res.status(400).json({ error: 'Stock must be a number of 0 or more.' });
  }

  const imageInput = body.image_url !== undefined ? body.image_url : body.image;
  const image = imageInput === undefined ? { ok: true, value: existing.image_url } : checkImageUrl(imageInput);
  if (!image.ok) return res.status(400).json({ error: image.error });

  const sizes = checkSizes(body.sizes);
  if (!sizes.ok) return res.status(400).json({ error: sizes.error });

  try {
    db.prepare(`
      UPDATE shoes
      SET name = ?, brand = ?, price = ?, category = ?, stock = ?, image_url = ?, description = ?, sizes = ?
      WHERE id = ?
    `).run(
      body.name !== undefined ? String(body.name) : existing.name,
      body.brand !== undefined ? String(body.brand) : existing.brand,
      body.price !== undefined ? Number(body.price) : existing.price,
      body.category !== undefined ? String(body.category) : existing.category,
      body.stock !== undefined ? Math.floor(Number(body.stock)) : existing.stock,
      image.value,
      body.description !== undefined ? String(body.description) : existing.description,
      sizes.value !== undefined ? sizes.value : existing.sizes,
      req.params.id
    );
    return res.json(formatShoe(db.prepare('SELECT * FROM shoes WHERE id = ?').get(req.params.id)));
  } catch (err) {
    console.error('Update shoe error:', err);
    return res.status(500).json({ error: 'Failed to update shoe.' });
  }
});

// DELETE /api/shoes/:id — administrators remove a shoe
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM shoes WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Shoe not found.' });
  }

  db.prepare('DELETE FROM shoes WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Shoe deleted successfully.', id: req.params.id });
});

module.exports = router;
module.exports.formatShoe = formatShoe;
