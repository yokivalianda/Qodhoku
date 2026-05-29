import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'qodhoku_data';
// Di Vercel: frontend & backend satu domain, pakai path relatif /api
// Di lokal: fallback ke localhost:3001
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

const defaultState = {
  user: {
    name: '',
    joinDate: new Date().toISOString().slice(0, 10),
  },
  prayers: {
    subuh:   { completed: 0,  total: 25 },
    dzuhur:  { completed: 0,  total: 25 },
    ashar:   { completed: 0,  total: 25 },
    maghrib: { completed: 0,  total: 25 },
    isya:    { completed: 0,  total: 20 },
  },
  dailyTarget: 3,
  streak: {
    current: 0,
    best: 0,
    lastDate: null,
  },
  history: [],
  hasOnboarded: false,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted data — fall back
  }
  return defaultState;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full — silent fail
  }
}

/* ── helpers ─────────────────────────────────────────────── */

function getTotalCompleted(prayers) {
  return Object.values(prayers).reduce((s, p) => s + p.completed, 0);
}

function getTotalTarget(prayers) {
  return Object.values(prayers).reduce((s, p) => s + p.total, 0);
}

/* ── context ─────────────────────────────────────────────── */

const QodhoContext = createContext(null);

export function QodhoProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [token, setToken] = useState(() => localStorage.getItem('qodhoku_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qodhoku_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [syncing, setSyncing] = useState(false);

  // Persist state to localStorage every time it changes (for offline mode)
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Fetch the latest data from Hono server (Turso DB)
  const fetchQodhoData = useCallback(async (authToken) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/qodho`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({
          ...prev,
          prayers: data.prayers,
          dailyTarget: data.dailyTarget,
          streak: data.streak,
          history: data.history
        }));
      }
    } catch (err) {
      console.error("Failed to fetch qodho data from server:", err);
    }
  }, []);

  // Sync initial online data on mount if logged in
  useEffect(() => {
    if (token) {
      fetchQodhoData(token);
    }
  }, [token, fetchQodhoData]);

  // Upload/migrate existing local state data to Turso database upon first login/register
  const syncLocalDataToServer = useCallback(async (authToken, localState) => {
    try {
      setSyncing(true);
      
      // 1. Sync daily target
      await fetch(`${API_URL}/qodho/target`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ dailyTarget: localState.dailyTarget })
      });

      // 2. Sync prayer totals (targets)
      const prayersTarget = {};
      Object.entries(localState.prayers).forEach(([k, v]) => {
        prayersTarget[k] = v.total;
      });
      await fetch(`${API_URL}/qodho/prayer-totals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ prayers: prayersTarget })
      });

      // 3. Sync history logs (upload log entries)
      // Since local history might contain duplicates, we send each entry one by one.
      // To keep it safe, only upload if there is any history
      if (localState.history && localState.history.length > 0) {
        for (const item of localState.history) {
          await fetch(`${API_URL}/qodho`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              prayer: item.prayer,
              count: item.count,
              date: item.date
            })
          });
        }
      }
      console.log('✅ Local data successfully synchronized with Turso.');
    } catch (err) {
      console.error("Error migrating local data to server:", err);
    } finally {
      setSyncing(false);
    }
  }, []);

  /* ── actions ───────────────────────────────────────────── */

  const register = useCallback(async (name, email, password) => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Pendaftaran gagal');

      localStorage.setItem('qodhoku_token', data.token);
      localStorage.setItem('qodhoku_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      // Migrate existing local offline progress to cloud database
      await syncLocalDataToServer(data.token, state);
      
      // Update local React state with server's returned user profile
      setState(prev => ({
        ...prev,
        user: { name: data.user.name, joinDate: prev.user.joinDate }
      }));

      // Fetch fresh calculated data from Turso
      await fetchQodhoData(data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSyncing(false);
    }
  }, [state, syncLocalDataToServer, fetchQodhoData]);

  const login = useCallback(async (email, password) => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');

      localStorage.setItem('qodhoku_token', data.token);
      localStorage.setItem('qodhoku_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      // Langsung fetch data dari server — JANGAN sync local ke server
      // karena setelah logout, state sudah direset ke default (nilai 25)
      // dan akan menimpa data asli user di database.
      await fetchQodhoData(data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSyncing(false);
    }
  }, [fetchQodhoData]);

  const logout = useCallback(() => {
    localStorage.removeItem('qodhoku_token');
    localStorage.removeItem('qodhoku_user');
    setToken(null);
    setUser(null);
    // Reset data akun ke default, tapi PERTAHANKAN hasOnboarded
    // Onboarding adalah flag perangkat — cukup dilakukan sekali, tidak ikut reset saat logout
    setState(prev => ({ ...defaultState, hasOnboarded: prev.hasOnboarded }));
  }, []);

  const addQodho = useCallback(async (prayerKey, count = 1) => {
    // 1. Instant update UI locally first
    setState(prev => {
      const prayer = prev.prayers[prayerKey];
      if (!prayer) return prev;
      const newCompleted = Math.min(prayer.completed + count, prayer.total);
      const today = new Date().toISOString().slice(0, 10);

      const newHistory = [
        ...prev.history,
        { prayer: prayerKey, count, date: today, timestamp: Date.now() },
      ];

      // Streak logic
      let newStreak = { ...prev.streak };
      if (prev.streak.lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (prev.streak.lastDate === yStr) {
          newStreak.current += 1;
        } else {
          newStreak.current = 1;
        }
        newStreak.lastDate = today;
      }
      newStreak.best = Math.max(newStreak.best, newStreak.current);

      return {
        ...prev,
        prayers: {
          ...prev.prayers,
          [prayerKey]: { ...prayer, completed: newCompleted },
        },
        history: newHistory,
        streak: newStreak,
      };
    });

    // 2. Sync to Hono / Turso database in the background
    const activeToken = localStorage.getItem('qodhoku_token');
    if (activeToken) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`${API_URL}/qodho`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ prayer: prayerKey, count, date: today })
        });
        if (res.ok) {
          // Re-fetch calculations to ensure streaks are computed exactly as by the backend
          fetchQodhoData(activeToken);
        }
      } catch (err) {
        console.error("Failed to sync qodho log addition:", err);
      }
    }
  }, [fetchQodhoData]);

  const undoQodho = useCallback(async (entry) => {
    // 1. Optimistic update: remove from local history immediately
    setState(prev => {
      const newHistory = prev.history.filter(h => {
        if (entry.id && h.id) return h.id !== entry.id;
        // fallback for local-only entries (no id)
        return !(h.prayer === entry.prayer && h.date === entry.date && h.timestamp === entry.timestamp);
      });

      const prayer = prev.prayers[entry.prayer];
      if (!prayer) return { ...prev, history: newHistory };

      const newCompleted = Math.max(0, prayer.completed - Number(entry.count));
      return {
        ...prev,
        history: newHistory,
        prayers: {
          ...prev.prayers,
          [entry.prayer]: { ...prayer, completed: newCompleted },
        },
      };
    });

    // 2. Sync to server
    const activeToken = localStorage.getItem('qodhoku_token');
    if (activeToken) {
      try {
        if (entry.id) {
          // Clean DELETE by ID — no race conditions
          await fetch(`${API_URL}/qodho/${entry.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${activeToken}` }
          });
        } else {
          // Local entry not yet synced — just post negative count
          await fetch(`${API_URL}/qodho`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify({ prayer: entry.prayer, count: -entry.count, date: entry.date })
          });
        }
        // Re-fetch from server to recalculate totals & streak
        await fetchQodhoData(activeToken);
      } catch (err) {
        console.error("Failed to undo qodho entry:", err);
      }
    }
  }, [fetchQodhoData]);

  const setDailyTarget = useCallback(async (target) => {
    setState(prev => ({ ...prev, dailyTarget: target }));

    const activeToken = localStorage.getItem('qodhoku_token');
    if (activeToken) {
      try {
        await fetch(`${API_URL}/qodho/target`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ dailyTarget: target })
        });
      } catch (err) {
        console.error("Failed to sync daily target to server:", err);
      }
    }
  }, []);

  const setPrayerTotals = useCallback(async (totals) => {
    // totals = { subuh: 300, dzuhur: 300, ... }
    setState(prev => {
      const newPrayers = { ...prev.prayers };
      Object.entries(totals).forEach(([key, total]) => {
        if (newPrayers[key]) {
          newPrayers[key] = {
            ...newPrayers[key],
            total: Math.max(newPrayers[key].completed, Number(total)),
          };
        }
      });
      return { ...prev, prayers: newPrayers };
    });

    const activeToken = localStorage.getItem('qodhoku_token');
    if (activeToken) {
      try {
        await fetch(`${API_URL}/qodho/prayer-totals`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ prayers: totals })
        });
      } catch (err) {
        console.error("Failed to sync prayer totals to server:", err);
      }
    }
  }, []);

  const setOnboarded = useCallback(() => {
    setState(prev => ({ ...prev, hasOnboarded: true }));
  }, []);

  const resetData = useCallback(async () => {
    setState(defaultState);

    const activeToken = localStorage.getItem('qodhoku_token');
    if (activeToken) {
      try {
        await fetch(`${API_URL}/qodho/reset`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeToken}`
          }
        });
      } catch (err) {
        console.error("Failed to reset database on server:", err);
      }
    }
  }, []);

  const updateUserName = useCallback((name) => {
    setState(prev => ({ ...prev, user: { ...prev.user, name } }));

    // Also update logged in profile info
    const savedUser = localStorage.getItem('qodhoku_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      u.name = name;
      localStorage.setItem('qodhoku_user', JSON.stringify(u));
      setUser(u);
    }
  }, []);

  /* ── derived values ────────────────────────────────────── */

  const totalCompleted = getTotalCompleted(state.prayers);
  const totalTarget = getTotalTarget(state.prayers);
  const progress = totalTarget > 0 ? totalCompleted / totalTarget : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = state.history.filter(h => h.date === todayStr).length;

  const value = {
    ...state,
    totalCompleted,
    totalTarget,
    progress,
    todayCount,
    // Sync attributes
    token,
    user: user || state.user,
    syncing,
    // Actions
    addQodho,
    undoQodho,
    setDailyTarget,
    setPrayerTotals,
    setOnboarded,
    resetData,
    updateUserName,
    // Auth actions
    register,
    login,
    logout,
    refetch: () => fetchQodhoData(token),
  };

  return (
    <QodhoContext.Provider value={value}>
      {children}
    </QodhoContext.Provider>
  );
}

export function useQodho() {
  const ctx = useContext(QodhoContext);
  if (!ctx) throw new Error('useQodho must be used within QodhoProvider');
  return ctx;
}
