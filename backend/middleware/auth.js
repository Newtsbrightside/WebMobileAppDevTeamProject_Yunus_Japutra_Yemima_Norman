const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'finishline_jwt_secret_key_2026_group14';

// Verify JWT token from Authorization header
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  // Fallback for demo or transition if x-role is provided
  if (!token && req.headers['x-role']) {
    req.user = {
      id: req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null,
      username: req.headers['x-username'] || req.headers['x-role'],
      role: req.headers['x-role'] === 'admin' ? 'administrator' : req.headers['x-role']
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    // Normalize role so administrator and admin are consistent
    const role = decoded.role === 'admin' ? 'administrator' : decoded.role;
    req.user = { ...decoded, role };
    next();
  });
}

// Optional auth: attaches user if token present, but doesn't block if missing
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        const role = decoded.role === 'admin' ? 'administrator' : decoded.role;
        req.user = { ...decoded, role };
      }
      next();
    });
  } else if (req.headers['x-role']) {
    req.user = {
      id: req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null,
      username: req.headers['x-username'] || req.headers['x-role'],
      role: req.headers['x-role'] === 'admin' ? 'administrator' : req.headers['x-role']
    };
    next();
  } else {
    next();
  }
}

// Require admin or administrator role
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && (req.user.role === 'administrator' || req.user.role === 'admin')) {
      return next();
    }
    return res.status(403).json({ error: 'Administrator access required.' });
  });
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  optionalAuth,
  requireAdmin
};
