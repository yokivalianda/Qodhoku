import { createClient } from '@libsql/client';
import 'dotenv/config';

const url = process.env.TURSO_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

if (!process.env.TURSO_URL) {
  console.log('ℹ️ TURSO_URL is not set. Falling back to local SQLite database: file:local.db');
} else {
  console.log('🚀 Connecting to remote Turso database...');
}

export const db = createClient({
  url,
  authToken,
});

/** Create tables if they don't exist (idempotent) */
export async function initSchema() {
  // Turso/LibSQL doesn't support executeMultiple with DDL in some drivers,
  // so we run them one by one.
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      daily_target  INTEGER NOT NULL DEFAULT 3,
      has_onboarded INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS prayer_totals (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prayer  TEXT    NOT NULL
                      CHECK(prayer IN ('subuh','dzuhur','ashar','maghrib','isya')),
      total   INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, prayer)
    )`,
    `CREATE TABLE IF NOT EXISTS qodho_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prayer     TEXT    NOT NULL
                         CHECK(prayer IN ('subuh','dzuhur','ashar','maghrib','isya')),
      count      INTEGER NOT NULL DEFAULT 1,
      date       TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_qodho_user_date
       ON qodho_entries(user_id, date)`,
    `CREATE INDEX IF NOT EXISTS idx_totals_user
       ON prayer_totals(user_id)`,
  ];

  for (const sql of stmts) {
    await db.execute(sql);
  }

  // Migrasi: tambah kolom has_onboarded ke tabel users yang sudah ada
  // (ALTER TABLE IF NOT EXISTS tidak didukung SQLite, pakai try/catch)
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN has_onboarded INTEGER NOT NULL DEFAULT 0`);
    console.log('✅ Migrated: added has_onboarded column');
  } catch {
    // Kolom sudah ada — aman diabaikan
  }

  console.log('✅ Database schema ready');
}

/** Insert default prayer_totals rows for a new user */
export async function ensurePrayerTotals(userId, initialTotals = {}) {
  const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  for (const prayer of prayers) {
    const total = initialTotals[prayer] ?? 0;
    await db.execute({
      sql: `INSERT OR IGNORE INTO prayer_totals (user_id, prayer, total) VALUES (?, ?, ?)`,
      args: [userId, prayer, total],
    });
  }
}
