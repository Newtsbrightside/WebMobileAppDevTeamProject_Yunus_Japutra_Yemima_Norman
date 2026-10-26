const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Register a new client account
router.post('/register', (req, res) => {
  const { username, password, role = 'client' } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
  }

  if (typeof password !== 'string' || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  const normalizedUsername = username.trim().toLowerCase();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(normalizedUsername);
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const assignedRole = role === 'admin' || role === 'administrator' ? 'administrator' : 'client';
    const passwordHash = bcrypt.hashSync(password, 10);
    const initialWallet = assignedRole === 'client' ? 500.0 : 0.0;

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role, wallet_balance)
      VALUES (?, ?, ?, ?)
    `).run(normalizedUsername, passwordHash, assignedRole, initialWallet);

    const newUser = {
      id: Number(result.lastInsertRowid),
      username: normalizedUsername,
      role: assignedRole,
      wallet_balance: initialWallet
    };

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login - Log in with credentials and receive JWT
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const normalizedUsername = username.trim().toLowerCase();

  try {
    const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get(normalizedUsername);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const passwordMatches = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        wallet_balance: user.wallet_balance
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me - Get current logged-in user details
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, role, wallet_balance FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

module.exports = router;
