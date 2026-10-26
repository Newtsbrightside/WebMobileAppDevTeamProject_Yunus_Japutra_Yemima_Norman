const express = require('express');
const db = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

function formatMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    sender_role: row.sender_role,
    sender: row.sender_role, // Compatibility with frontend state
    sender_name: row.sender_name,
    text: row.text,
    time: row.created_at,
    created_at: row.created_at
  };
}

// GET /api/messages - Fetch full chat history
router.get('/', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM messages ORDER BY created_at ASC, id ASC').all();
    return res.json(rows.map(formatMessage));
  } catch (err) {
    console.error('Fetch messages error:', err);
    return res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// POST /api/messages - Send a new support message
router.post('/', optionalAuth, (req, res) => {
  const { sender_role, sender, sender_name, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text cannot be empty.' });
  }

  // Resolve role from body or authenticated user
  let role = sender_role || sender;
  if (!role && req.user) {
    role = req.user.role === 'administrator' || req.user.role === 'admin' ? 'admin' : 'client';
  }
  if (!role) {
    role = 'client';
  }

  // Resolve name
  let name = sender_name;
  if (!name && req.user) {
    name = req.user.username;
  }
  if (!name) {
    name = role === 'admin' ? 'Finishline Team' : 'Shopper';
  }

  const now = new Date().toISOString();

  try {
    const result = db.prepare(`
      INSERT INTO messages (sender_role, sender_name, text, created_at)
      VALUES (?, ?, ?, ?)
    `).run(role, name, text.trim(), now);

    const created = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(formatMessage(created));
  } catch (err) {
    console.error('Create message error:', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
