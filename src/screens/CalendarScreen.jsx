import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useQodho } from '../context/QodhoContext';
import { IconChevronLeft, IconChevronRight } from '../components/Icons';

const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const PRAYER_META = {
  subuh:   { label: 'Subuh',   emoji: '🌅', color: '#f59e0b' },
  dzuhur:  { label: 'Dzuhur',  emoji: '☀️',  color: '#fb923c' },
  ashar:   { label: 'Ashar',   emoji: '🌤️', color: '#f43f5e' },
  maghrib: { label: 'Maghrib', emoji: '🌆', color: '#a78bfa' },
  isya:    { label: 'Isya',    emoji: '🌙', color: '#60a5fa' },
};

const getLevelColor = level => {
  switch (level) {
    case 1: return 'rgba(16,185,129,0.18)';
    case 2: return 'rgba(16,185,129,0.38)';
    case 3: return '#10b981';
    case 4: return '#34d399';
    default: return 'var(--bg-elevated)';
  }
};

const getLevelText = level => level >= 3 ? 'white' : level > 0 ? '#86efac' : 'var(--text-muted)';

const CalendarScreen = () => {
  const { history, dailyTarget, undoQodho } = useQodho();
  const [monthOffset, setMonthOffset] = useState(0);
  const [undoingId, setUndoingId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7;
  const monthName = viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = day => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getLevel = day => {
    if (!day) return 0;
    const count = history.filter(h => h.date === getDateStr(day)).length;
    if (count >= 5) return 4;
    if (count >= 3) return 3;
    if (count >= 1) return 2;
    return 0;
  };

  const todayCount = history.filter(h => h.date === todayStr).length;

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const activeDays = monthDays.filter(d => getLevel(d) > 0).length;
  const totalThisMonth = history.filter(h => h.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length;

  /* Recent history for undo — sorted newest first, only positive entries */
  const positiveHistory = [...history]
    .filter(h => (h.count ?? 1) > 0)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const displayHistory = showAll ? positiveHistory : positiveHistory.slice(0, 10);

  const handleUndo = async (entry, idx) => {
    // Use id if available (cloud entry), else use index as fallback
    const key = entry.id != null ? entry.id : (entry.timestamp ?? idx);
    setUndoingId(key);
    await undoQodho(entry);
    setUndoingId(null);
  };

  return (
    <div className="screen-scroll">
      <div className="screen-container">

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>Konsistensi</h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Lacak kehadiran qodho harian</p>
        </div>

        {/* Month summary strip */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Hari Aktif', value: activeDays, color: 'var(--primary-color)' },
            { label: 'Total Qodho', value: totalThisMonth, color: '#34d399' },
            { label: 'Target/Hari', value: dailyTarget, color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} className="stat-mini-card" style={{ flex: 1 }}>
              <p style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div className="card" style={{ background: 'var(--bg-surface)', marginBottom: '1.25rem' }}>

          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button className="btn-icon" onClick={() => setMonthOffset(p => p - 1)}>
              <IconChevronLeft size={18} />
            </button>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{monthName}</p>
            <button
              className="btn-icon"
              onClick={() => setMonthOffset(p => p + 1)}
              disabled={monthOffset >= 0}
              style={{ opacity: monthOffset >= 0 ? 0.3 : 1 }}
            >
              <IconChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="calendar-grid" style={{ marginBottom: '6px' }}>
            {DAY_HEADERS.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.2rem 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="calendar-grid">
            {cells.map((day, idx) => {
              const level = day ? getLevel(day) : 0;
              const ds = day ? getDateStr(day) : '';
              const isToday = ds === todayStr;
              return (
                <div
                  key={idx}
                  className="calendar-cell"
                  style={{
                    backgroundColor: day ? getLevelColor(level) : 'transparent',
                    color: day ? (isToday ? 'white' : getLevelText(level)) : 'transparent',
                    border: isToday ? '1.5px solid var(--primary-color)' : day ? 'none' : 'none',
                    boxShadow: isToday ? '0 0 10px rgba(16,185,129,0.5)' : 'none',
                    fontWeight: isToday ? 800 : level > 0 ? 600 : 400,
                    fontSize: '0.75rem',
                    opacity: day ? 1 : 0,
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Rendah</span>
            {[0, 1, 2, 3, 4].map(l => (
              <div key={l} style={{
                width: '12px', height: '12px',
                borderRadius: '3px',
                background: getLevelColor(l),
                border: l === 0 ? '1px solid var(--border-color)' : 'none',
              }} />
            ))}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tinggi</span>
          </div>
        </div>

        {/* Today card */}
        <div className="card-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
              Hari Ini
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-color)' }}>
              {todayCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {dailyTarget} qodho</span>
            </h3>
          </div>
          <div style={{
            width: '56px', height: '56px',
            borderRadius: '50%',
            background: `conic-gradient(var(--primary-color) ${(todayCount / dailyTarget) * 360}deg, var(--bg-elevated) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '44px', height: '44px',
              borderRadius: '50%', background: 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                {Math.min(Math.round((todayCount / dailyTarget) * 100), 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* ── History Log with Undo ── */}
        <div style={{ marginBottom: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Riwayat Pencatatan
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Ketuk 🗑️ untuk batalkan entri yang salah
            </p>
          </div>
          {positiveHistory.length > 10 && (
            <button
              onClick={() => setShowAll(p => !p)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {showAll ? 'Tampilkan sedikit' : `Lihat semua (${positiveHistory.length})`}
            </button>
          )}
        </div>

        {displayHistory.length === 0 ? (
          <div className="card" style={{ background: 'var(--bg-surface)', textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Belum ada riwayat pencatatan qodho.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {displayHistory.map((entry, i) => {
              const meta = PRAYER_META[entry.prayer] || { label: entry.prayer, emoji: '🕌', color: 'var(--primary-color)' };
              const entryKey = entry.id != null ? entry.id : (entry.timestamp ?? i);
              const isUndoing = undoingId === entryKey;
              const dateLabel = entry.date === todayStr ? 'Hari ini' : entry.date;
              const timeLabel = entry.timestamp
                ? new Date(entry.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <div
                  key={entryKey}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem 1rem',
                    transition: 'opacity 0.2s ease',
                    opacity: isUndoing ? 0.5 : 1,
                  }}
                >
                  {/* Emoji */}
                  <div style={{
                    width: '36px', height: '36px', flexShrink: 0,
                    borderRadius: '10px', background: `${meta.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                  }}>
                    {meta.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {meta.label}
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: meta.color, marginLeft: '0.4rem',
                        background: `${meta.color}18`,
                        padding: '1px 6px', borderRadius: '99px',
                      }}>
                        +{entry.count}
                      </span>
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {dateLabel}{timeLabel ? ` • ${timeLabel}` : ''}
                    </p>
                  </div>

                  {/* Undo button */}
                  <button
                    onClick={() => handleUndo(entry, i)}
                    disabled={isUndoing}
                    title="Batalkan entri ini"
                    style={{
                      width: '36px', height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.2)',
                      color: '#f87171',
                      cursor: isUndoing ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                  >
                    {isUndoing ? '⏳' : '🗑️'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
      <BottomNav currentScreen="calendar" />
    </div>
  );
};

export default CalendarScreen;
