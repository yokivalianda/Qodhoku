import React from 'react';
import BottomNav from '../components/BottomNav';
import { useQodho } from '../context/QodhoContext';
import { useTheme } from '../context/ThemeContext';
import {
  IconUser, IconSettings, IconBell, IconTarget,
  IconUpload, IconInfo, IconLogout,
  IconBook, IconShield, IconChevronRight, IconClock
} from '../components/Icons';
import { useNavigation } from '../context/NavigationContext';
import InstallPWA from '../components/InstallPWA';

const SETTING_ITEMS = [
  { icon: IconUser,    label: 'Account & Security',         color: 'var(--primary-color)' },
  { icon: IconBell,    label: 'Notifikasi Waktu Sholat',    color: '#60a5fa' },
  { icon: IconTarget,  label: 'Atur Target Harian',         color: '#fbbf24' },
  { icon: IconUpload,  label: 'Edit Hutang Qodho',          color: '#a78bfa' },
  { icon: IconInfo,    label: 'Tentang QodhoKu',            color: 'var(--text-muted)' },
  { icon: IconLogout,  label: 'Keluar',                     color: '#f87171', isLast: true },
];

const ThemeToggle = () => {
  const { isLight, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle tema"
      style={{
        position: 'relative',
        width: '56px',
        height: '30px',
        borderRadius: '99px',
        border: 'none',
        cursor: 'pointer',
        background: isLight
          ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
          : 'linear-gradient(135deg, #1e3a5f, #0f2744)',
        boxShadow: isLight
          ? '0 0 12px rgba(251,191,36,0.5), inset 0 1px 3px rgba(0,0,0,0.1)'
          : '0 0 12px rgba(16,185,129,0.3), inset 0 1px 3px rgba(0,0,0,0.3)',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
      }}
    >
      {/* Track icons */}
      <span style={{
        position: 'absolute',
        left: '5px',
        fontSize: '11px',
        opacity: isLight ? 0 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: 'none',
      }}>🌙</span>
      <span style={{
        position: 'absolute',
        right: '5px',
        fontSize: '11px',
        opacity: isLight ? 1 : 0,
        transition: 'opacity 0.2s',
        pointerEvents: 'none',
      }}>☀️</span>
      {/* Thumb */}
      <span style={{
        display: 'block',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: '#ffffff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transform: isLight ? 'translateX(26px)' : 'translateX(0)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        flexShrink: 0,
      }} />
    </button>
  );
};

const ProfileScreen = () => {
  const { navigate } = useNavigation();
  const { user, totalCompleted, totalTarget, streak, history, token, logout } = useQodho();

  const handleSettingClick = (label) => {
    if (label === 'Account & Security') {
      navigate('auth');
    } else if (label === 'Atur Target Harian') {
      navigate('dailyTarget');
    } else if (label === 'Edit Hutang Qodho') {
      navigate('editTotals');
    } else if (label === 'Keluar') {
      if (token) {
        logout();
        alert('Berhasil keluar akun. Penyimpanan kembali offline lokal.');
      } else {
        alert('Anda sedang offline (belum masuk/daftar akun).');
      }
    }
  };

  const xpProgress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
  const level = Math.max(1, Math.floor(totalCompleted / 5) + 1);
  const totalDays = [...new Set(history.map(h => h.date))].length;
  const remaining = totalTarget - totalCompleted;

  return (
    <div className="screen-scroll">
      <div className="screen-container" style={{ paddingBottom: '90px', overflowY: 'auto' }}>

        {/* Top header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>Profil</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ThemeToggle />
            <button className="btn-icon"><IconSettings size={20} /></button>
          </div>
        </div>

        {/* Profile Hero */}
        <div className="profile-hero" style={{ marginBottom: '1.25rem' }}>
          <div className="profile-avatar">
            <IconUser size={40} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.25rem' }}>{user.name || 'Hamba Allah'}</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="pill">✨ Level {level}</span>
            <span className="pill" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.25)' }}>
              🔥 {streak.current} Streak
            </span>
            {token && (
              <span className="pill" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', borderColor: 'rgba(16,185,129,0.25)' }}>
                ☁️ Cloud Aktif
              </span>
            )}
          </div>
        </div>

        {/* Stat row */}
        <div className="stat-mini-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-mini-card">
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-color)' }}>{totalCompleted}</p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Selesai</p>
          </div>
          <div className="stat-mini-card">
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24' }}>{streak.best}</p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Best Streak</p>
          </div>
          <div className="stat-mini-card">
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#60a5fa' }}>{totalDays}</p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Hari Aktif</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="card mb-md" style={{ background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>XP Progress</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Level {level} → {level + 1}</p>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              {totalCompleted * 100} XP
            </span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{xpProgress}% selesai</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{remaining} sisa</p>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="card mb-md" style={{ background: 'var(--bg-surface)' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>
            Achievement
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Badge icon={<IconClock size={22} />} label="Sholat Rutin" color="#fbbf24" earned={totalCompleted >= 5} />
            <Badge icon={<IconBook size={22} />} label="Qur'an" color="#60a5fa" earned={streak.current >= 3} />
            <Badge icon={<IconShield size={22} />} label="Konsisten" color="#a78bfa" earned={streak.best >= 7} />
          </div>
        </div>

        {/* Install App Section */}
        <div className="mb-md">
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
            Aplikasi
          </p>
          <InstallPWA />
        </div>

        {/* Settings list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-surface)' }}>
          {SETTING_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div 
                key={i} 
                className="setting-item" 
                onClick={() => handleSettingClick(item.label)}
                style={{ borderBottom: item.isLast ? 'none' : undefined, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', color: item.color }}>
                  <div style={{
                    width: '34px', height: '34px',
                    borderRadius: '10px',
                    background: `${item.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: item.isLast ? item.color : 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                </div>
                <IconChevronRight size={15} color="var(--text-muted)" />
              </div>
            );
          })}
        </div>

      </div>
      <BottomNav currentScreen="profile" />
    </div>
  );
};

const Badge = ({ icon, label, color, earned }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
    <div style={{
      width: '56px', height: '56px',
      borderRadius: '50%',
      background: earned ? `${color}18` : 'var(--bg-elevated)',
      border: `1.5px ${earned ? 'solid' : 'dashed'} ${earned ? color : 'var(--border-color)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: earned ? color : 'var(--text-muted)',
      boxShadow: earned ? `0 0 16px ${color}33` : 'none',
      transition: 'all 0.3s ease',
    }}
    className="badge-circle"
    >
      {icon}
    </div>
    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: earned ? 'var(--text-secondary)' : 'var(--text-muted)', textAlign: 'center' }}>
      {label}
    </span>
    {earned && (
      <span style={{ fontSize: '0.6rem', fontWeight: 700, color, background: `${color}18`, padding: '1px 6px', borderRadius: '99px' }}>
        ✓ Earned
      </span>
    )}
  </div>
);

export default ProfileScreen;
