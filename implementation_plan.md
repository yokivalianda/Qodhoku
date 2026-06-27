# QodhoKu — Backend + Auth + Turso DB

## Gambaran Arsitektur

```
Frontend (Vite/React) ←→ API Server (Hono/Node) ←→ Turso (LibSQL Cloud)
     :5173                      :3001                    turso.io
```

Karena Turso adalah cloud SQLite, koneksi **harus melalui backend server** — tidak bisa langsung dari browser. Kita tambahkan **Express/Hono API** sebagai backend ringan.

---

## Stack yang Ditambahkan

| Layer | Tech |
|-------|------|
| Backend API | **Hono** (framework ringan, modern, ESM-native) |
| Database | **Turso** via `@libsql/client` |
| Auth | **JWT** (`jsonwebtoken`) + **bcryptjs** password hashing |
| Dev runner | **tsx** (run TypeScript/JS Node tanpa build) |

---

## Open Questions

> [!IMPORTANT]
> **Apakah kamu sudah punya akun Turso?**
> Jika belum, saya akan sertakan instruksi `turso db create qodhoku` di README. Kamu perlu:
> 1. Install Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
> 2. `turso auth login`
> 3. `turso db create qodhoku`
> 4. `turso db show qodhoku` → salin **URL** dan **auth token** ke file `.env`

---

## Proposed Changes

### Backend (`server/`)

#### [NEW] `server/index.js` — Hono API entrypoint
- `POST /api/auth/register` — daftar akun baru
- `POST /api/auth/login` — login, return JWT
- `GET  /api/auth/me` — ambil profil user (butuh token)
- `GET  /api/qodho` — ambil semua qodho user (butuh token)
- `POST /api/qodho/add` — tambah qodho entry
- `PUT  /api/user/target` — update target harian
- `GET  /api/stats` — statistik user

#### [NEW] `server/db.js` — Turso client + schema init
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  daily_target INTEGER DEFAULT 3,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE qodho_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  prayer TEXT NOT NULL,        -- subuh/dzuhur/ashar/maghrib/isya
  count INTEGER DEFAULT 1,
  date TEXT NOT NULL,          -- YYYY-MM-DD
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE prayer_totals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  prayer TEXT NOT NULL,
  total INTEGER DEFAULT 0,     -- total hutang awal
  UNIQUE(user_id, prayer)
);
```

#### [NEW] `server/middleware/auth.js` — JWT verification middleware

#### [NEW] `.env` — environment variables
```
TURSO_URL=libsql://...
TURSO_AUTH_TOKEN=...
JWT_SECRET=...
PORT=3001
```

---

### Frontend

#### [NEW] `src/screens/LoginScreen.jsx`
- Form email + password
- Link ke RegisterScreen
- Login → simpan JWT ke `localStorage`

#### [NEW] `src/screens/RegisterScreen.jsx`
- Form nama + email + password + confirm password
- Auto-login setelah register berhasil

#### [MODIFY] `src/context/QodhoContext.jsx`
- Ganti `localStorage` data → fetch dari API (`/api/qodho`, `/api/stats`)
- Tambah `authToken`, `isLoggedIn`, `login()`, `logout()`, `register()` actions
- Semua mutasi (addQodho, setDailyTarget) → POST ke API

#### [MODIFY] `src/context/NavigationContext.jsx`
- Tambah `isReady` state untuk mencegah flicker saat cek token

#### [MODIFY] `src/App.jsx`
- Tambah routing untuk `login` dan `register` screen
- Guard: jika tidak ada token → redirect ke `login`

#### [MODIFY] `vite.config.js`
- Tambah proxy `/api → http://localhost:3001` untuk dev

#### [MODIFY] `package.json`
- Tambah script `dev:server`, `dev:all` (concurrently)

---

## Migration Strategy
Data localStorage lama (jika ada) akan diabaikan — user perlu register baru. Ini lebih bersih karena data lama tidak memiliki user_id.

---

## Verification Plan

### Automated
- `npm run build` harus berhasil
- Backend bisa start: `node server/index.js`

### Manual
1. Register user baru → dapat JWT
2. Login dengan akun yang sama → dapat JWT
3. Buka Home → data ter-fetch dari Turso
4. Tambah qodho → tersimpan di DB, terlihat di semua device
5. Refresh halaman → tetap login (token di localStorage)
6. Logout → kembali ke login screen
