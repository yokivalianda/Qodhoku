import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { db, ensurePrayerTotals } from '../db.js';
import { signToken } from '../middleware/auth.js';

const auth = new Hono();

/* ── POST /api/auth/register ────────────────────────────── */
auth.post('/register', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { name, email, password } = body;

  // Validation
  if (!name?.trim())     return c.json({ error: 'Name is required' }, 400);
  if (!email?.trim())    return c.json({ error: 'Email is required' }, 400);
  if (!password)         return c.json({ error: 'Password is required' }, 400);
  if (password.length < 6)
    return c.json({ error: 'Password must be at least 6 characters' }, 400);

  const emailLower = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower))
    return c.json({ error: 'Invalid email format' }, 400);

  try {
    // Check duplicate
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [emailLower],
    });
    if (existing.rows.length > 0) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await db.execute({
      sql: `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
      args: [name.trim(), emailLower, password_hash],
    });

    const userId = Number(result.lastInsertRowid);

    // Create default prayer_totals rows
    await ensurePrayerTotals(userId);

    const token = signToken({ id: userId, email: emailLower, name: name.trim() });

    return c.json({
      token,
      user: { id: userId, name: name.trim(), email: emailLower, daily_target: 3 },
    }, 201);

  } catch (err) {
    console.error('Register error:', err);
    return c.json({ error: 'Server error during registration' }, 500);
  }
});

/* ── POST /api/auth/login ───────────────────────────────── */
auth.post('/login', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, password } = body;

  if (!email || !password)
    return c.json({ error: 'Email and password are required' }, 400);

  const emailLower = email.toLowerCase().trim();

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [emailLower],
    });

    const user = result.rows[0];
    if (!user) {
      return c.json({ error: 'Email atau password salah' }, 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Email atau password salah' }, 401);
    }

    const token = signToken({
      id: Number(user.id),
      email: user.email,
      name: user.name,
    });

    return c.json({
      token,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        daily_target: Number(user.daily_target),
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    return c.json({ error: 'Server error during login' }, 500);
  }
});

/* ── GET /api/auth/me ───────────────────────────────────── */
auth.get('/me', async (c) => {
  const jwtUser = c.get('user');
  try {
    const result = await db.execute({
      sql: 'SELECT id, name, email, daily_target, created_at FROM users WHERE id = ?',
      args: [jwtUser.id],
    });

    if (!result.rows[0]) return c.json({ error: 'User not found' }, 404);

    const user = result.rows[0];
    return c.json({
      id: Number(user.id),
      name: user.name,
      email: user.email,
      daily_target: Number(user.daily_target),
      created_at: user.created_at,
    });
  } catch (err) {
    console.error('Me error:', err);
    return c.json({ error: 'Server error' }, 500);
  }
});

export default auth;
