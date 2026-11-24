const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, signToken } = require('../middleware/auth');
const { isValidSize } = require('../lib/sizes');

const router = express.Router();

// What the API sends back about a user. Never the password hash.
function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    wallet_balance: Number(row.wallet_balance),
    left_size: row.left_size == null ? null : Number(row.left_size),
    right_size: row.right_size == null ? null : Number(row.right_size)
  };
}

function findUserById(id) {
  return db.prepare(
    'SELECT id, username, role, wallet_balance, left_size, right_size FROM users WHERE id = ?'
  ).get(id);
}

// POST /api/auth/register — create a CLIENT account.
// The role is never taken from the request: administrators are created by the seed only.
router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
  }
  if (typeof password !== 'string' || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  const normalizedUsername = username.trim().toLowerCase();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(normalizedUsername);
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role, wallet_balance)
      VALUES (?, ?, 'client', 500)
    `).run(normalizedUsername, bcrypt.hashSync(password, 10));

    const user = publicUser(findUserById(Number(result.lastInsertRowid)));
    return res.status(201).json({ message: 'Registration successful.', token: signToken(user), user });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login — check the password and return a token.
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = publicUser(row);
    return res.json({ message: 'Login successful.', token: signToken(user), user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me — the logged-in user (read from the token).
router.get('/me', authenticateToken, (req, res) => {
  const row = findUserById(req.user.id);
  if (!row) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user: publicUser(row) });
});

// PUT /api/auth/me/sizes — save the user's size for each foot.
// Body: { "left_size": 9, "right_size": 9.5 }  (both null clears them)
router.put('/me/sizes', authenticateToken, (req, res) => {
  const { left_size: left, right_size: right } = req.body;
  const clearing = left === null && right === null;

  if (!clearing && (!isValidSize(left) || !isValidSize(right))) {
    return res.status(400).json({ error: 'Sizes must be US sizes between 3 and 16, in half sizes.' });
  }

  db.prepare('UPDATE users SET left_size = ?, right_size = ? WHERE id = ?').run(
    clearing ? null : Number(left),
    clearing ? null : Number(right),
    req.user.id
  );

  return res.json({ user: publicUser(findUserById(req.user.id)) });
});

module.exports = router;
