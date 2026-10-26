const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Ensure database tables and initial seeds are ready
require('./database');

const authRoutes = require('./routes/auth');
const shoesRoutes = require('./routes/shoes');
const ordersRoutes = require('./routes/orders');
const messagesRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-role', 'x-username', 'x-user-id']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (images and uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/seed', express.static(path.join(__dirname, 'seed')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Finishline API Server',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Finishline Sneaker Store Backend API',
    endpoints: {
      auth: '/api/auth',
      shoes: '/api/shoes',
      orders: '/api/orders',
      messages: '/api/messages',
      health: '/api/health'
    }
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/shoes', shoesRoutes);
app.use('/api/products', shoesRoutes); // Alias for frontend compatibility
app.use('/api/orders', ordersRoutes);
app.use('/api/messages', messagesRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found.` });
});

// Central error handling middleware
app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected server error occurred.'
  });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Finishline Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
