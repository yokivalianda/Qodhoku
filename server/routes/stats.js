import { Hono } from 'hono';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const stats = new Hono();

// All routes require auth
stats.use('*', authMiddleware);

/* ── GET /api/stats ─────────────────────────────────────── */
stats.get('/', async (c) => {
  const user = c.get('user');
  const today = new Date().toISOString().slice(0, 10);

  try {
    // Prayer totals (initial debt)
    const totalsResult = await db.execute({
      sql: 'SELECT prayer, total FROM prayer_totals WHERE user_id = ?',
      args: [user.id],
    });

    // Completed per prayer
    const completedResult = await db.execute({
      sql: `SELECT prayer, SUM(count) as completed
            FROM qodho_entries WHERE user_id = ? GROUP BY prayer`,
      args: [user.id],
    });

    // Today's count
    const todayResult = await db.execute({
      sql: `SELECT COUNT(*) as cnt, SUM(count) as total_count
            FROM qodho_entries WHERE user_id = ? AND date = ?`,
      args: [user.id, today],
    });

    // Streak calculation — get distinct dates with entries, ordered desc
    const datesResult = await db.execute({
      sql: `SELECT DISTINCT date FROM qodho_entries
            WHERE user_id = ? ORDER BY date DESC LIMIT 365`,
      args: [user.id],
    });

    // User info
    const userResult = await db.execute({
      sql: 'SELECT name, daily_target, created_at FROM users WHERE id = ?',
      args: [user.id],
    });

    // Build completedMap
    const completedMap = {};
    for (const row of completedResult.rows) {
      completedMap[row.prayer] = Number(row.completed);
    }

    let totalCompleted = 0;
    let totalDebt = 0;
    for (const row of totalsResult.rows) {
      const debt = Number(row.total);
      const done = Math.min(completedMap[row.prayer] ?? 0, debt);
      totalCompleted += done;
      totalDebt += debt;
    }

    // Streak logic
    const dates = datesResult.rows.map(r => r.date).sort().reverse();
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const dateStr of dates) {
      if (!prevDate) {
        tempStreak = 1;
        prevDate = dateStr;
      } else {
        const diff = dayDiff(prevDate, dateStr);
        if (diff === 1) {
          tempStreak += 1;
          prevDate = dateStr;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
          prevDate = dateStr;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    // Current streak only counts if today or yesterday has an entry
    if (dates.length > 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      if (dates[0] === today || dates[0] === yStr) {
        // count streak from today backwards
        let streak = 0;
        let check = today;
        const dateSet = new Set(dates);
        while (dateSet.has(check)) {
          streak++;
          const d = new Date(check);
          d.setDate(d.getDate() - 1);
          check = d.toISOString().slice(0, 10);
        }
        currentStreak = streak;
      } else {
        currentStreak = 0;
      }
    }

    const userData = userResult.rows[0];

    return c.json({
      totalCompleted,
      totalDebt,
      progress: totalDebt > 0 ? totalCompleted / totalDebt : 0,
      streak: {
        current: currentStreak,
        best: Math.max(bestStreak, currentStreak),
        lastDate: dates[0] ?? null,
      },
      todayCount: Number(todayResult.rows[0]?.total_count ?? 0),
      dailyTarget: userData ? Number(userData.daily_target) : 3,
      joinDate: userData?.created_at?.slice(0, 10) ?? today,
    });
  } catch (err) {
    console.error('GET /stats error:', err);
    return c.json({ error: 'Server error' }, 500);
  }
});

/** Return absolute day difference between two YYYY-MM-DD strings */
function dayDiff(a, b) {
  // a > b assumed (a is more recent)
  const da = new Date(a);
  const db2 = new Date(b);
  return Math.round((da - db2) / 86400000);
}

export default stats;
