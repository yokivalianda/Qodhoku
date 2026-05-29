import { Hono } from 'hono';
import { db, ensurePrayerTotals } from '../db.js';

const qodho = new Hono();

/** Helper to calculate current and best streak based on unique dates */
function calculateStreak(dates) {
  if (dates.length === 0) {
    return { current: 0, best: 0, lastDate: null };
  }

  // Ensure unique, sort descending (e.g. ['2026-05-29', '2026-05-28', ...])
  const sortedDates = [...new Set(dates)].sort().reverse();
  const todayStr = new Date().toISOString().slice(0, 10);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const lastDate = sortedDates[0];
  const isActive = lastDate === todayStr || lastDate === yesterdayStr;

  let currentStreak = 0;
  if (isActive) {
    currentStreak = 1;
    let expectedDate = new Date(lastDate);
    for (let i = 1; i < sortedDates.length; i++) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      const expectedStr = expectedDate.toISOString().slice(0, 10);
      if (sortedDates[i] === expectedStr) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  const sortedAsc = [...sortedDates].reverse();
  for (let i = 0; i < sortedAsc.length; i++) {
    const dStr = sortedAsc[i];
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedAsc[i - 1]);
      prevDate.setDate(prevDate.getDate() + 1);
      const expectedStr = prevDate.toISOString().slice(0, 10);
      if (dStr === expectedStr) {
        tempStreak += 1;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  return {
    current: currentStreak,
    best: bestStreak,
    lastDate,
  };
}

/* ── GET /api/qodho ─────────────────────────────────────── */
qodho.get('/', async (c) => {
  const user = c.get('user');

  try {
    // 1. Ensure prayer totals row exists
    await ensurePrayerTotals(user.id);

    // 2. Fetch daily_target from users
    const userRes = await db.execute({
      sql: 'SELECT daily_target FROM users WHERE id = ?',
      args: [user.id],
    });
    const dailyTarget = Number(userRes.rows[0]?.daily_target ?? 3);

    // 3. Fetch all total targets for each prayer
    const totalsRes = await db.execute({
      sql: 'SELECT prayer, total FROM prayer_totals WHERE user_id = ?',
      args: [user.id],
    });
    
    const targets = {
      subuh: 25,
      dzuhur: 25,
      ashar: 25,
      maghrib: 25,
      isya: 20
    };
    for (const row of totalsRes.rows) {
      targets[row.prayer] = Number(row.total);
    }

    // 4. Fetch sums of completed prayers from qodho_entries
    const completedRes = await db.execute({
      sql: 'SELECT prayer, SUM(count) as completed FROM qodho_entries WHERE user_id = ? GROUP BY prayer',
      args: [user.id],
    });

    const completed = {
      subuh: 0,
      dzuhur: 0,
      ashar: 0,
      maghrib: 0,
      isya: 0
    };
    for (const row of completedRes.rows) {
      completed[row.prayer] = Math.max(0, Number(row.completed));
    }

    // 5. Construct prayers object matching the frontend context expectation
    const prayers = {};
    for (const p of ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']) {
      prayers[p] = {
        completed: completed[p],
        total: targets[p]
      };
    }

    // 6. Fetch history of qodho entries
    const historyRes = await db.execute({
      sql: `SELECT id, prayer, count, date, created_at 
            FROM qodho_entries 
            WHERE user_id = ? 
            ORDER BY date DESC, created_at DESC, id DESC 
            LIMIT 150`,
      args: [user.id],
    });

    const history = historyRes.rows.map(row => ({
      id: Number(row.id),
      prayer: row.prayer,
      count: Number(row.count),
      date: row.date,
      timestamp: Date.parse(row.created_at) || Date.now(),
    }));

    // 7. Calculate streak
    const datesRes = await db.execute({
      sql: 'SELECT DISTINCT date FROM qodho_entries WHERE user_id = ? ORDER BY date DESC',
      args: [user.id],
    });
    const uniqueDates = datesRes.rows.map(r => r.date);
    const streak = calculateStreak(uniqueDates);

    return c.json({
      prayers,
      dailyTarget,
      streak,
      history,
    });

  } catch (err) {
    console.error('Fetch qodho error:', err);
    return c.json({ error: 'Server error fetching qodho data' }, 500);
  }
});

/* ── POST /api/qodho ────────────────────────────────────── */
qodho.post('/', async (c) => {
  const user = c.get('user');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { prayer, count, date } = body;
  const valCount = Number(count ?? 1);

  if (!prayer) {
    return c.json({ error: 'Prayer is required' }, 400);
  }

  const allowedPrayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  if (!allowedPrayers.includes(prayer)) {
    return c.json({ error: 'Invalid prayer type' }, 400);
  }

  // Default to local/client date or today's date in YYYY-MM-DD
  const targetDate = date || new Date().toISOString().slice(0, 10);

  try {
    // 1. Ensure target exists
    await ensurePrayerTotals(user.id);

    // 2. Fetch current total target to prevent exceeding it
    const targetRes = await db.execute({
      sql: 'SELECT total FROM prayer_totals WHERE user_id = ? AND prayer = ?',
      args: [user.id, prayer],
    });
    const targetLimit = Number(targetRes.rows[0]?.total ?? 25);

    // 3. Fetch currently completed
    const completedRes = await db.execute({
      sql: 'SELECT SUM(count) as completed FROM qodho_entries WHERE user_id = ? AND prayer = ?',
      args: [user.id, prayer],
    });
    const currentCompleted = Number(completedRes.rows[0]?.completed ?? 0);

    // Ensure we don't go below 0 or above total limit
    let finalCount = valCount;
    if (currentCompleted + valCount < 0) {
      finalCount = -currentCompleted;
    } else if (currentCompleted + valCount > targetLimit) {
      finalCount = targetLimit - currentCompleted;
    }

    if (finalCount === 0) {
      return c.json({ message: 'Count unchanged or limit reached', success: true });
    }

    // 4. Insert qodho entry
    await db.execute({
      sql: `INSERT INTO qodho_entries (user_id, prayer, count, date) VALUES (?, ?, ?, ?)`,
      args: [user.id, prayer, finalCount, targetDate],
    });

    return c.json({ success: true, countAdded: finalCount });

  } catch (err) {
    console.error('Add qodho error:', err);
    return c.json({ error: 'Server error saving qodho entry' }, 500);
  }
});

/* ── PUT /api/qodho/target ──────────────────────────────── */
qodho.put('/target', async (c) => {
  const user = c.get('user');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const dailyTarget = Number(body.dailyTarget ?? body.daily_target);
  if (isNaN(dailyTarget) || dailyTarget < 1) {
    return c.json({ error: 'Daily target must be a positive number' }, 400);
  }

  try {
    await db.execute({
      sql: 'UPDATE users SET daily_target = ? WHERE id = ?',
      args: [dailyTarget, user.id],
    });
    return c.json({ success: true, dailyTarget });
  } catch (err) {
    console.error('Update daily target error:', err);
    return c.json({ error: 'Server error updating daily target' }, 500);
  }
});

/* ── PUT /api/qodho/prayer-totals ───────────────────────── */
qodho.put('/prayer-totals', async (c) => {
  const user = c.get('user');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { prayers } = body;
  if (!prayers || typeof prayers !== 'object') {
    return c.json({ error: 'Prayers object required' }, 400);
  }

  try {
    await ensurePrayerTotals(user.id);

    for (const [prayer, total] of Object.entries(prayers)) {
      const totalNum = Number(total);
      if (isNaN(totalNum) || totalNum < 0) continue;

      await db.execute({
        sql: `INSERT OR REPLACE INTO prayer_totals (user_id, prayer, total) VALUES (?, ?, ?)`,
        args: [user.id, prayer, totalNum],
      });
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Update prayer totals error:', err);
    return c.json({ error: 'Server error updating prayer totals' }, 500);
  }
});

/* ── POST /api/qodho/reset ──────────────────────────────── */
qodho.post('/reset', async (c) => {
  const user = c.get('user');
  try {
    // Delete entries
    await db.execute({
      sql: 'DELETE FROM qodho_entries WHERE user_id = ?',
      args: [user.id],
    });
    // Reset targets to default or 0
    await db.execute({
      sql: 'UPDATE prayer_totals SET total = 25 WHERE user_id = ?',
      args: [user.id],
    });
    // Set daily target back to 3
    await db.execute({
      sql: 'UPDATE users SET daily_target = 3 WHERE id = ?',
      args: [user.id],
    });

    return c.json({ success: true });
  } catch (err) {
    console.error('Reset qodho error:', err);
    return c.json({ error: 'Server error resetting qodho data' }, 500);
  }
});

/* ── DELETE /api/qodho/:id ──────────────────────────────── */
qodho.delete('/:id', async (c) => {
  const user = c.get('user');
  const entryId = Number(c.req.param('id'));

  if (!entryId || isNaN(entryId)) {
    return c.json({ error: 'Invalid entry ID' }, 400);
  }

  try {
    // Make sure entry belongs to this user before deleting
    const check = await db.execute({
      sql: 'SELECT id, prayer, count FROM qodho_entries WHERE id = ? AND user_id = ?',
      args: [entryId, user.id],
    });

    if (check.rows.length === 0) {
      return c.json({ error: 'Entry not found or access denied' }, 404);
    }

    await db.execute({
      sql: 'DELETE FROM qodho_entries WHERE id = ? AND user_id = ?',
      args: [entryId, user.id],
    });

    return c.json({ success: true, deleted: entryId });

  } catch (err) {
    console.error('Delete qodho entry error:', err);
    return c.json({ error: 'Server error deleting entry' }, 500);
  }
});

export default qodho;

