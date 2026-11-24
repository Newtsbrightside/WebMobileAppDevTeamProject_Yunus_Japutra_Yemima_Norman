const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function formatMessage(row) {
  return {
    id: row.id,
    sender_role: row.sender_role,
    sender: row.sender_role, // the web app reads `sender`
    sender_name: row.sender_name,
    text: row.text,
    time: row.created_at,
    created_at: row.created_at
  };
}

// GET /api/messages — support chat history (logged-in users only)
router.get('/', authenticateToken, (_req, res) => {
  const rows = db.prepare('SELECT * FROM messages ORDER BY created_at ASC, id ASC').all();
  return res.json(rows.map(formatMessage));
});

// POST /api/messages — send a support message.
// Who sent it comes from the token, so a client cannot post as "Finishline Team".
router.post('/', authenticateToken, (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'Message text cannot be empty.' });
  }
  if (text.length > 1000) {
    return res.status(400).json({ error: 'Messages can be at most 1000 characters.' });
  }

  const isAdmin = req.user.role === 'administrator';
  const result = db.prepare(`
    INSERT INTO messages (sender_role, sender_name, text, created_at)
    VALUES (?, ?, ?, ?)
  `).run(isAdmin ? 'admin' : 'client', isAdmin ? 'Finishline Team' : req.user.username, text, new Date().toISOString());

  const created = db.prepare('SELECT * FROM messages WHERE id = ?').get(Number(result.lastInsertRowid));
  return res.status(201).json(formatMessage(created));
});

module.exports = router;
