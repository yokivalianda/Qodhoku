import React, { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigation } from '../context/NavigationContext';
import { useQodho } from '../context/QodhoContext';
import { IconBell, IconPlus, IconSun, IconMoon, IconSunset } from '../components/Icons';

const PRAYER_META = {
  subuh:   { label: 'Subuh',   Icon: IconSun,    color: '#f59e0b', emoji: '🌅' },
  dzuhur:  { label: 'Dzuhur',  Icon: IconSun,    color: '#fb923c', emoji: '☀️' },
  ashar:   { label: 'Ashar',   Icon: IconSunset, color: '#f43f5e', emoji: '🌤️' },
  maghrib: { label: 'Maghrib', Icon: IconSunset, color: '#a78bfa', emoji: '🌆' },
  isya:    { label: 'Isya',    Icon: IconMoon,   color: '#60a5fa', emoji: '🌙' },
};

const QUOTES = [
  '"Setiap langkah kecil menuju ketaatan adalah kemenangan besar."',
  '"Qodho bukan beban, melainkan kesempatan menebus dan bertumbuh."',
  '"Konsistensi kecil hari ini lebih baik dari usaha besar yang tidak terjaga."',
];

const HomeDashboard = () => {
  const { navigate } = useNavigation();
  const { user, prayers, totalCompleted, totalTarget, progress, streak, dailyTarget, todayCount } = useQodho();

  const radius = 72;
  const strokeW = 11;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = useState(circumference);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    const t = setTimeout(() => setDashOffset(circumference * (1 - progress)), 150);
    return () => clearTimeout(t);
  }, [progress, circumference]);

  const pct = totalTarget > 0 ? Math.round(progress * 100) : 0;

  return (
    <div className="screen-scroll">
      <div className="screen-container" style={{ paddingBottom: '90px', overflowY: 'auto' }}>

        {/* ── Header ── */}
        <div className="greeting">
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1>Assalamu'alaikum 👋</h1>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>{user.name}</p>
          </div>
          <div className="notification-bell">
            <IconBell size={22} />
            <div className="notification-dot" />
          </div>
        </div>

        {/* ── Progress hero card ── */}
        <div className="progress-card">
          {/* Ring */}
          <div style={{ position: 'relative', width: '168px', height: '168px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="168" height="168" viewBox="0 0 168 168" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="84" cy="84" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth={strokeW} />
              <circle
                cx="84" cy="84" r={radius}
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth={strokeW}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="progress-ring-circle"
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>

            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Qodho</p>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, margin: '0.1rem 0' }}>
                {totalCompleted}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>dari {totalTarget}</p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{pct}%</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Selesai</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>{streak.current}🔥</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hari Streak</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--info)' }}>
                {todayCount}/{dailyTarget}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hari Ini</p>
            </div>
          </div>

          <button
            onClick={() => navigate('quickAdd')}
            className="btn-primary"
            style={{ width: 'auto', padding: '0.7rem 2rem', fontSize: '0.9rem' }}
          >
            <IconPlus size={17} style={{ marginRight: '0.5rem' }} />
            Catat Qodho
          </button>
        </div>

        {/* ── Prayer breakdown ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rincian Per Waktu</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalCompleted} selesai</span>
        </div>

        <div className="grid-2 mb-lg">
          {Object.entries(prayers).map(([key, val]) => {
            const meta = PRAYER_META[key];
            if (!meta) return null;
            const { Icon: PrayerIcon } = meta;
            const pct = val.total > 0 ? (val.completed / val.total) * 100 : 0;
            return (
              <div className="prayer-card" key={key}>
                <div className="prayer-card-header">
                  <span style={{ marginRight: '0.4rem', fontSize: '0.9rem' }}>{meta.emoji}</span>
                  <span className="prayer-card-title">{meta.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
                  <p className="prayer-card-count">{val.completed}/{val.total}</p>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color }}>{Math.round(pct)}%</p>
                </div>
                <div className="prayer-card-bar">
                  <div className="prayer-card-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Streak card ── */}
        <div className="card mb-md" style={{ background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Streak Konsistensi</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Terbaik: {streak.best} hari
              </p>
            </div>
            <div style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-color-hover)',
              borderRadius: 'var(--radius-md)',
              padding: '0.35rem 0.75rem',
            }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24' }}>
                {streak.current} 🔥
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`streak-dot ${i < streak.current ? 'active' : 'inactive'}`}
                style={{ flex: 1, height: '8px', borderRadius: '4px', width: 'auto' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
            {['S','M','S','R','K','J','S'].map((d, i) => (
              <p key={i} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>{d}</p>
            ))}
          </div>
        </div>

        {/* ── Quote card ── */}
        <div className="motivation-card">
          <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.7, position: 'relative', zIndex: 1, marginBottom: '0.5rem' }}>
            {quote}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', position: 'relative', zIndex: 1 }}>
            — Motivasi Hari Ini
          </p>
        </div>

      </div>
      <BottomNav currentScreen="home" />
    </div>
  );
};

export default HomeDashboard;
