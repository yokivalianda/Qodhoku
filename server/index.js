import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import 'dotenv/config';

import { initSchema } from './db.js';
import authRoutes from './routes/auth.js';
import qodhoRoutes from './routes/qodho.js';
import { authMiddleware } from './middleware/auth.js';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: '*', // For local dev, allow all
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Initialize DB schema on start
initSchema()
  .then(() => {
    console.log('📦 Database initialized successfully.');
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
  });

// Logger middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[API] ${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`);
});

// Mount auth routes (register & login are unprotected inside)
app.route('/api/auth', authRoutes);

// Protect all /api/qodho routes
app.use('/api/qodho/*', authMiddleware);
app.route('/api/qodho', qodhoRoutes);

// Basic healthcheck
app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date() }));

// Error handler
app.onError((err, c) => {
  console.error('[Hono Error]:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

const PORT = Number(process.env.PORT || 3001);
console.log(`🚀 QodhoKu Hono API Server starting on port ${PORT}...`);

serve({
  fetch: app.fetch,
  port: PORT,
});
