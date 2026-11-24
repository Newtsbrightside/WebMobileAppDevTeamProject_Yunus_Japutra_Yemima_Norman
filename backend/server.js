const path = require('path');
// Load backend/.env before anything reads process.env (works from any folder).
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const db = require('./database');

const authRoutes = require('./routes/auth');
const shoesRoutes = require('./routes/shoes');
const ordersRoutes = require('./routes/orders');
const messagesRoutes = require('./routes/messages');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: the web pages that may call this API from a browser.
// CORS_ORIGINS is a comma-separated list, e.g.
// http://localhost:5173,https://newtsbrightside.github.io
// The phone app is not a browser, so CORS does not affect it.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100kb' }));

// Sample shoe pictures that ship with the code. They are part of every deploy,
// so they survive restarts. Uploaded files would not (Render's disk is temporary).
app.use('/images', express.static(path.join(__dirname, 'public', 'images'), { maxAge: '7d' }));

app.get('/', (_req, res) => {
  res.json({
    message: 'Finishline Sneaker Store API',
    endpoints: ['/api/health', '/api/auth', '/api/shoes', '/api/orders', '/api/messages', '/api/ai/fit-advice']
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Finishline API',
    database: db.location, // "turso" in production, "local-file" on a laptop
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/shoes', shoesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Last stop for errors. Invalid JSON in a request body is a 400, not a crash.
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request is too large.' });
  }
  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Finishline API on http://localhost:${PORT} (database: ${db.location})`);
  });
}

module.exports = app;
