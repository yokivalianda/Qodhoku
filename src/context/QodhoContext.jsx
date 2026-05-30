import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'qodhoku_data';
// Di Vercel: frontend & backend satu domain, pakai path relatif /api
// Di lokal: fallback ke localhost:3001
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

const defaultState = {
  prayers: {
    subuh: { total: 0, completed: 0 },
    dzuhur: { total: 0, completed: 0 },
    ashar: { total: 0, completed: 0 },
    maghrib: { total: 0, completed: 0 },
    isya: { total: 0, completed: 0 },
  },
  dailyTarget: 3,
  streak: { current: 0, best: 0, lastDate: null },
  history: [],
  user: { name: 'Sobat QodhoKu', joinDate: new Date().toISOString() },
  hasOnboarded: false,
};

// --- Sync Queue Helpers ---
const SYNC_QUEUE_KEY = 'qodhoku_sync_queue';
const getSyncQueue = () => {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveSyncQueue = (q) => localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q));
const generateLocalId = () => 'local_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
// --------------------------

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
  // Return data dari server agar caller bisa baca nilai terbaru
  // (React state update async, tidak bisa langsung dibaca setelah setState)
  const fetchQodhoData = useCallback(async (authToken) => {
    if (!authToken) return null;
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
          history: data.history,
          // hasOnboarded dari server menang atas local
          hasOnboarded: data.hasOnboarded ?? prev.hasOnboarded,
        }));
        return data; // ← return agar caller bisa pakai nilai fresh
      }
    } catch (err) {
      console.error("Failed to fetch qodho data from server:", err);
    }
    return null;
  }, []);

  // Process any pending offline sync operations
  const processSyncQueue = useCallback(async (authToken) => {
    if (!authToken) return;
    const queue = getSyncQueue();
    if (queue.length === 0) return;

    let successCount = 0;
    const remainingQueue = [];

    for (const action of queue) {
      try {
        if (action.type === 'ADD') {
          const res = await fetch(`${API_URL}/qodho`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(action.payload)
          });
          if (!res.ok) throw new Error('API Sync Failed');
        } else if (action.type === 'DELETE') {
          const res = await fetch(`${API_URL}/qodho/${action.payload.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!res.ok) throw new Error('API Sync Failed');
        } else if (action.type === 'PUT_TARGET') {
          const res = await fetch(`${API_URL}/qodho/target`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(action.payload)
          });
          if (!res.ok) throw new Error('API Sync Failed');
        } else if (action.type === 'PUT_PRAYER_TOTALS') {
          const res = await fetch(`${API_URL}/qodho/prayer-totals`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(action.payload)
          });
          if (!res.ok) throw new Error('API Sync Failed');
        } else if (action.type === 'PUT_ONBOARDING') {
          const res = await fetch(`${API_URL}/qodho/onboarding`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!res.ok) throw new Error('API Sync Failed');
        }
        successCount++;
      } catch (err) {
        remainingQueue.push(action);
        const idx = queue.indexOf(action);
        remainingQueue.push(...queue.slice(idx + 1));
        break; 
      }
    }

    if (remainingQueue.length !== queue.length) {
      saveSyncQueue(remainingQueue);
      if (successCount > 0) {
        fetchQodhoData(authToken);
      }
    }
  }, [fetchQodhoData]);

  // Sync initial online data and process offline queue on mount
  useEffect(() => {
    if (token) {
      fetchQodhoData(token);
      processSyncQueue(token);
    }
  }, [token, fetchQodhoData, processSyncQueue]);

  // Attach online listener to auto-sync when network recovers
  useEffect(() => {
    const handleOnline = () => {
      const activeToken = localStorage.getItem('qodhoku_token');
      if (activeToken) processSyncQueue(activeToken);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processSyncQueue]);

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

      // Fetch data dari server dan return hasilnya
      // PENTING: return serverData.hasOnboarded bukan dari React state
      // karena setState() async — nilai di closure masih stale saat setTimeout fire
      const serverData = await fetchQodhoData(data.token);
      return { success: true, hasOnboarded: serverData?.hasOnboarded ?? false };
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

  const addQodho = useCallback(async (prayerKey, count = 1, customDate = null) => {
    const localId = generateLocalId();
    // 1. Instant update UI locally first
    setState(prev => {
      const prayer = prev.prayers[prayerKey];
      if (!prayer) return prev;
      const newCompleted = Math.min(prayer.completed + count, prayer.total);
      
      const targetDate = customDate || new Date().toISOString().slice(0, 10);

      const newHistory = [
        ...prev.history,
        { id: localId, prayer: prayerKey, count, date: targetDate, timestamp: Date.now() },
      ];

      // Streak logic (Optimistic update)
      // Only advance streak optimistically if we are logging for today.
      // (Backend will recalculate the true streak on next fetch anyway)
      let newStreak = { ...prev.streak };
      const todayStr = new Date().toISOString().slice(0, 10);
      
      if (targetDate === todayStr && prev.streak.lastDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (prev.streak.lastDate === yStr) {
          newStreak.current += 1;
        } else {
          newStreak.current = 1;
        }
        newStreak.lastDate = todayStr;
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
    const syncDate = customDate || new Date().toISOString().slice(0, 10);
    
    if (activeToken) {
      try {
        const res = await fetch(`${API_URL}/qodho`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ prayer: prayerKey, count, date: syncDate })
        });
        if (!res.ok) throw new Error('API addQodho failed');
        // Re-fetch calculations to ensure streaks are computed exactly as by the backend
        fetchQodhoData(activeToken);
      } catch (err) {
        console.warn("Offline! Adding qodho entry to sync queue:", err);
        const queue = getSyncQueue();
        queue.push({
          type: 'ADD', localId,
          payload: { prayer: prayerKey, count, date: syncDate, timestamp: Date.now() }
        });
        saveSyncQueue(queue);
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
      // Check if it's a pending offline entry
      if (entry.id && String(entry.id).startsWith('local_')) {
        let queue = getSyncQueue();
        queue = queue.filter(q => q.localId !== entry.id);
        saveSyncQueue(queue);
        return; // Fully aborted the un-synced offline entry
      }

      try {
        let res;
        if (entry.id) {
          res = await fetch(`${API_URL}/qodho/${entry.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${activeToken}` }
          });
        } else {
          res = await fetch(`${API_URL}/qodho`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeToken}` },
            body: JSON.stringify({ prayer: entry.prayer, count: -entry.count, date: entry.date })
          });
        }
        if (!res.ok) throw new Error('API undoQodho failed');
        // Re-fetch from server to recalculate totals & streak
        await fetchQodhoData(activeToken);
      } catch (err) {
        console.warn("Offline! Adding undo entry to sync queue:", err);
        const queue = getSyncQueue();
        if (entry.id) {
          queue.push({ type: 'DELETE', payload: { id: entry.id } });
        } else {
          queue.push({ type: 'ADD', payload: { prayer: entry.prayer, count: -entry.count, date: entry.date } });
        }
        saveSyncQueue(queue);
      }
    }
  }, [fetchQodhoData]);

  const setDailyTarget = useCallback(async (target) => {
    setState(prev => ({ ...prev, dailyTarget: target }));

    const activeToken = localStorage.getItem('qodhoku_token');
    if (activeToken) {
      try {
        const res = await fetch(`${API_URL}/qodho/target`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ dailyTarget: target })
        });
        if (!res.ok) throw new Error('API setDailyTarget failed');
      } catch (err) {
        console.warn("Offline! Adding daily target update to sync queue:", err);
        const queue = getSyncQueue();
        const cleanQueue = queue.filter(q => q.type !== 'PUT_TARGET');
        cleanQueue.push({ type: 'PUT_TARGET', payload: { dailyTarget: target } });
        saveSyncQueue(cleanQueue);
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
        const res = await fetch(`${API_URL}/qodho/prayer-totals`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ prayers: totals })
        });
        if (!res.ok) throw new Error('API setPrayerTotals failed');
      } catch (err) {
        console.warn("Offline! Adding prayer totals update to sync queue:", err);
        const queue = getSyncQueue();
        const cleanQueue = queue.filter(q => q.type !== 'PUT_PRAYER_TOTALS');
        cleanQueue.push({ type: 'PUT_PRAYER_TOTALS', payload: { prayers: totals } });
        saveSyncQueue(cleanQueue);
      }
    }
  }, []);

  const setOnboarded = useCallback(() => {
    setState(prev => ({ ...prev, hasOnboarded: true }));

    // Sync ke server jika user sedang login — agar tidak hilang saat clear cookies
    const activeToken = localStorage.getItem('qodhoku_token');
    if (activeToken) {
      fetch(`${API_URL}/qodho/onboarding`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${activeToken}` },
      }).then(res => {
        if (!res.ok) throw new Error('API setOnboarded failed');
      }).catch(err => {
        console.warn('Offline! Adding onboarding status to sync queue:', err);
        const queue = getSyncQueue();
        const cleanQueue = queue.filter(q => q.type !== 'PUT_ONBOARDING');
        cleanQueue.push({ type: 'PUT_ONBOARDING' });
        saveSyncQueue(cleanQueue);
      });
    }
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
