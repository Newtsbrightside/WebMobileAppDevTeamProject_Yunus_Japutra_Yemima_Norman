const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { db, seedProducts, ensureUploadsDirectory } = require('./db');
const routes = require('./routes');

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://newtsbrightside.github.io'
];

ensureUploadsDirectory();
seedProducts([
  { id: 's1', name: 'AeroGlide Pro Runner', category: 'Running', price: 150, stock: 24, image: '/seed/aeroglide.jpg' },
  { id: 's2', name: 'Classic Court Leather', category: 'Casual', price: 110, stock: 45, image: '/seed/classic-court.jpg' },
  { id: 's3', name: 'Elevate High-Top X', category: 'Basketball', price: 185, stock: 12, image: '/seed/elevate-high-top.jpg' },
  { id: 's4', name: 'Urban Suede Retro', category: 'Lifestyle', price: 130, stock: 30, image: '/seed/urban-suede.jpg' }
]);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/seed', express.static(path.join(__dirname, 'seed')));
app.get('/api/health', (_request, response) => response.json({ ok: true }));
app.use('/api', routes);
app.use((error, _request, response, _next) => {
  if (error.code === 'LIMIT_FILE_SIZE') return response.status(400).json({ error: 'The image must be 2 MB or smaller.' });
  if (error.message?.includes('Unexpected field')) return response.status(400).json({ error: 'Upload the image using the image field.' });
  response.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(port, () => console.log(`Finishline API running at http://localhost:${port}`));

process.on('SIGINT', () => { db.close(); process.exit(0); });
process.on('SIGTERM', () => { db.close(); process.exit(0); });
