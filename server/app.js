import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { initSchema } from './db.js';
import authRoutes from './routes/auth.js';
import qodhoRoutes from './routes/qodho.js';
import { authMiddleware } from './middleware/auth.js';

const app = new Hono();

// Enable CORS — izinkan semua origin agar HP bisa akses
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Initialize DB schema on first request (lazy, cocok untuk serverless)
let schemaReady = false;
app.use('*', async (c, next) => {
  if (!schemaReady) {
    await initSchema();
    schemaReady = true;
  }
  await next();
});

// Logger middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[API] ${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms)`);
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

export default app;
