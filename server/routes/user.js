import { Hono } from 'hono';
import { db, ensurePrayerTotals } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const user = new Hono();

// All routes require auth
user.use('*', authMiddleware);

/* ── PUT /api/user/target ───────────────────────────────── */
user.put('/target', async (c) => {
  const jwtUser = c.get('user');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { dailyTarget } = body;
  if (!Number.isInteger(dailyTarget) || dailyTarget < 1 || dailyTarget > 50)
    return c.json({ error: 'dailyTarget must be an integer between 1 and 50' }, 400);

  try {
    await db.execute({
      sql: 'UPDATE users SET daily_target = ? WHERE id = ?',
      args: [dailyTarget, jwtUser.id],
    });
    return c.json({ success: true, dailyTarget });
  } catch (err) {
    console.error('PUT /user/target error:', err);
    return c.json({ error: 'Server error' }, 500);
  }
});

/* ── PUT /api/user/totals ───────────────────────────────── */
// Update initial prayer debt totals (called from SetupScreen)
user.put('/totals', async (c) => {
  const jwtUser = c.get('user');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // body.totals = { subuh: 100, dzuhur: 200, ... }
  const { totals } = body;
  if (!totals || typeof totals !== 'object')
    return c.json({ error: 'totals object is required' }, 400);

  const validPrayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  for (const prayer of validPrayers) {
    const val = totals[prayer];
    if (val !== undefined) {
      if (!Number.isInteger(val) || val < 0 || val > 99999)
        return c.json({ error: `Invalid value for ${prayer}` }, 400);
    }
  }

  try {
    for (const prayer of validPrayers) {
      const total = totals[prayer] ?? 0;
      await db.execute({
        sql: `INSERT INTO prayer_totals (user_id, prayer, total)
              VALUES (?, ?, ?)
              ON CONFLICT(user_id, prayer) DO UPDATE SET total = excluded.total`,
        args: [jwtUser.id, prayer, total],
      });
    }
    return c.json({ success: true });
  } catch (err) {
    console.error('PUT /user/totals error:', err);
    return c.json({ error: 'Server error' }, 500);
  }
});

/* ── PUT /api/user/profile ──────────────────────────────── */
user.put('/profile', async (c) => {
  const jwtUser = c.get('user');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { name } = body;
  if (!name?.trim()) return c.json({ error: 'Name is required' }, 400);

  try {
    await db.execute({
      sql: 'UPDATE users SET name = ? WHERE id = ?',
      args: [name.trim(), jwtUser.id],
    });
    return c.json({ success: true, name: name.trim() });
  } catch (err) {
    console.error('PUT /user/profile error:', err);
    return c.json({ error: 'Server error' }, 500);
  }
});

export default user;
