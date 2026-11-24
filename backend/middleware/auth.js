const jwt = require('jsonwebtoken');

// The secret that signs every login token. It comes ONLY from the environment:
// backend/.env on your laptop, Render → Environment in production.
// There is deliberately no default: a default written here would be on GitHub.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy backend/.env.example to backend/.env and fill it in.');
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Any logged-in user. No token, or an invalid/expired token → 401.
// The user comes from the token, never from the request body or other headers.
function authenticateToken(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Login required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role === 'admin' ? 'administrator' : decoded.role
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

// Administrators only: no valid token → 401, logged in with another role → 403.
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }
    return next();
  });
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authenticateToken, requireAdmin, signToken };
