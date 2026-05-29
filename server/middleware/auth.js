import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/** Sign a JWT payload (30-day expiry) */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Hono middleware — verify Bearer JWT, attach decoded payload to ctx as 'user'.
 * Usage: app.use('/api/protected/*', authMiddleware)
 */
export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: missing token' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expired, please login again'
      : 'Invalid token';
    return c.json({ error: msg }, 401);
  }
}
