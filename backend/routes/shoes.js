const express = require('express');
const db = require('../database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to format shoe record for API response
function formatShoe(row) {
  if (!row) return null;
  let parsedSizes = [8, 9, 10, 11, 12];
  if (row.sizes) {
    try {
      parsedSizes = typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes;
    } catch {
      parsedSizes = [8, 9, 10, 11, 12];
    }
  }

  return {
    id: row.id,
    name: row.name,
    brand: row.brand || 'Finish Line',
    price: Number(row.price),
    category: row.category,
    stock: Number(row.stock),
    image_url: row.image_url,
    image: row.image_url, // For compatibility with frontend image rendering
    description: row.description || '',
    sizes: parsedSizes,
    colors: ['Standard', 'Alternate']
  };
}

// GET /api/shoes - Fetch all shoes with optional search & category filter
router.get('/', (req, res) => {
  const { search, category, sort } = req.query;

  try {
    let query = 'SELECT * FROM shoes WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category.trim().toLowerCase() !== 'all') {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category.trim());
    }

    if (sort === 'price-asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price-desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'name') {
      query += ' ORDER BY name ASC';
    } else {
      query += ' ORDER BY id ASC';
    }

    const rows = db.prepare(query).all(...params);
    const shoes = rows.map(formatShoe);
    return res.json(shoes);
  } catch (err) {
    console.error('Fetch shoes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve shoes catalogue.' });
  }
});

// GET /api/shoes/:id - Fetch single shoe by ID
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM shoes WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Shoe not found.' });
    }
    return res.json(formatShoe(row));
  } catch (err) {
    console.error('Fetch shoe details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve shoe details.' });
  }
});

// POST /api/shoes - Admin: Add new shoe
router.post('/', requireAdmin, (req, res) => {
  const {
    id,
    name,
    brand = 'Finish Line',
    price,
    category,
    stock = 0,
    image_url,
    image,
    description = '',
    sizes = [8, 9, 10, 11, 12]
  } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required.' });
  }

  const shoeId = id || `s${Date.now()}`;
  const finalImage = image_url || image || '/assets/images/aeroglide.jpg';
  const serializedSizes = Array.isArray(sizes) ? JSON.stringify(sizes) : (sizes || JSON.stringify([8, 9, 10, 11, 12]));

  try {
    db.prepare(`
      INSERT INTO shoes (id, name, brand, price, category, stock, image_url, description, sizes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      shoeId,
      name,
      brand,
      Number(price),
      category,
      Number(stock),
      finalImage,
      description,
      serializedSizes
    );

    const created = db.prepare('SELECT * FROM shoes WHERE id = ?').get(shoeId);
    return res.status(201).json(formatShoe(created));
  } catch (err) {
    console.error('Add shoe error:', err);
    return res.status(500).json({ error: 'Failed to add shoe to catalogue.' });
  }
});

// PUT /api/shoes/:id - Admin: Update shoe stock, price, details
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM shoes WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Shoe not found.' });
    }

    const name = req.body.name !== undefined ? req.body.name : existing.name;
    const brand = req.body.brand !== undefined ? req.body.brand : existing.brand;
    const price = req.body.price !== undefined ? Number(req.body.price) : existing.price;
    const category = req.body.category !== undefined ? req.body.category : existing.category;
    const stock = req.body.stock !== undefined ? Number(req.body.stock) : existing.stock;
    const image_url = req.body.image_url || req.body.image || existing.image_url;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const sizes = req.body.sizes !== undefined
      ? (Array.isArray(req.body.sizes) ? JSON.stringify(req.body.sizes) : req.body.sizes)
      : existing.sizes;

    db.prepare(`
      UPDATE shoes
      SET name = ?, brand = ?, price = ?, category = ?, stock = ?, image_url = ?, description = ?, sizes = ?
      WHERE id = ?
    `).run(name, brand, price, category, stock, image_url, description, sizes, id);

    const updated = db.prepare('SELECT * FROM shoes WHERE id = ?').get(id);
    return res.json(formatShoe(updated));
  } catch (err) {
    console.error('Update shoe error:', err);
    return res.status(500).json({ error: 'Failed to update shoe.' });
  }
});

// DELETE /api/shoes/:id - Admin: Delete shoe
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM shoes WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Shoe not found.' });
    }

    db.prepare('DELETE FROM shoes WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Shoe deleted successfully.', id });
  } catch (err) {
    console.error('Delete shoe error:', err);
    return res.status(500).json({ error: 'Failed to delete shoe.' });
  }
});

module.exports = router;
