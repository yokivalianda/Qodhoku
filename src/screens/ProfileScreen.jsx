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
import { requestNotificationPermission, getNotificationSettings, setNotificationSettings } from '../utils/notifications';

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
  const { user, totalCompleted, totalTarget, streak, history, token, logout, pendingSyncCount, forceSync, prayers, syncQueue } = useQodho();

  const [notifSettings, setNotifSettings] = React.useState({ enabled: false, time: '20:00' });
  const [showSyncModal, setShowSyncModal] = React.useState(false);

  // Helper pemetaan bahasa untuk antrean
  const getSyncLabel = (action) => {
    switch (action.type) {
      case 'ADD': return `Catat Qodho ${action.payload.prayer} (${action.payload.count}x)`;
      case 'DELETE': return `Batalkan Riwayat Qodho`;
      case 'PUT_TARGET': return `Ubah Target Harian ke ${action.payload.dailyTarget}`;
      case 'PUT_PRAYER_TOTALS': return `Edit Jumlah Hutang Keseluruhan`;
      case 'PUT_ONBOARDING': return `Update Status Onboarding`;
      default: return `Sinkronisasi Sistem`;
    }
  };

  React.useEffect(() => {
    setNotifSettings(getNotificationSettings());
  }, []);

  const handleNotifToggle = async (e) => {
    e.stopPropagation();
    if (!notifSettings.enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        const newSettings = { enabled: true, time: notifSettings.time };
        setNotificationSettings(true, newSettings.time);
        setNotifSettings(newSettings);
      }
    } else {
      const newSettings = { enabled: false, time: notifSettings.time };
      setNotificationSettings(false, newSettings.time);
      setNotifSettings(newSettings);
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    const newSettings = { ...notifSettings, time: newTime };
    setNotificationSettings(newSettings.enabled, newTime);
    setNotifSettings(newSettings);
  };

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
      <div className="screen-container">

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
              <span 
                className="pill" 
                onClick={() => pendingSyncCount > 0 ? setShowSyncModal(true) : null}
                style={{ 
                  background: pendingSyncCount > 0 ? 'rgba(251,191,36,0.12)' : 'rgba(16,185,129,0.12)', 
                  color: pendingSyncCount > 0 ? '#fbbf24' : '#34d399', 
                  borderColor: pendingSyncCount > 0 ? 'rgba(251,191,36,0.25)' : 'rgba(16,185,129,0.25)',
                  cursor: pendingSyncCount > 0 ? 'pointer' : 'default',
                  transition: 'all 0.3s ease'
                }}
              >
                {pendingSyncCount > 0 ? `⏳ ${pendingSyncCount} Tertunda` : '☁️ Cloud Tersinkron'}
              </span>
            )}
          </div>
        </div>

        {/* Gamification / Achievements */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pencapaian Saya
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {[
              { id: 'first', title: 'Langkah Awal', desc: 'Melunasi 10 qodho', unlocked: totalCompleted >= 10, icon: '🌟', color: '#fbbf24' },
              { id: 'streak', title: 'Pejuang Konsisten', desc: 'Streak 7 hari beruntun', unlocked: streak.best >= 7, icon: '🔥', color: '#f43f5e' },
              { id: 'half', title: 'Separuh Jalan', desc: '50% hutang terbayar', unlocked: totalTarget > 0 && totalCompleted >= (totalTarget / 2), icon: '🌗', color: '#60a5fa' },
              { id: 'subuh', title: 'Penakluk Subuh', desc: 'Hutang Subuh Lunas', unlocked: prayers?.subuh?.total > 0 && prayers?.subuh?.completed >= prayers?.subuh?.total, icon: '🌅', color: '#34d399' },
            ].map(badge => (
              <div key={badge.id} style={{
                background: badge.unlocked ? `${badge.color}15` : 'var(--bg-surface)',
                border: `1px solid ${badge.unlocked ? `${badge.color}40` : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'flex', gap: '0.75rem',
                opacity: badge.unlocked ? 1 : 0.6, filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                transition: 'all 0.3s ease', alignItems: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', filter: badge.unlocked ? `drop-shadow(0 0 8px ${badge.color}66)` : 'none' }}>
                  {badge.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: badge.unlocked ? badge.color : 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                    {badge.title}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{badge.desc}</p>
                </div>
              </div>
            ))}
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
                {item.label === 'Notifikasi Waktu Sholat' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} onClick={e => e.stopPropagation()}>
                    <input 
                      type="time" 
                      value={notifSettings.time} 
                      onChange={handleTimeChange}
                      disabled={!notifSettings.enabled}
                      style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                        color: notifSettings.enabled ? 'var(--text-primary)' : 'var(--text-muted)',
                        padding: '0.2rem 0.5rem', borderRadius: '6px', fontFamily: 'inherit', fontSize: '0.75rem',
                        opacity: notifSettings.enabled ? 1 : 0.5, cursor: 'pointer'
                      }}
                    />
                    <div 
                      onClick={handleNotifToggle}
                      style={{
                        width: '42px', height: '24px', borderRadius: '12px',
                        background: notifSettings.enabled ? 'var(--primary-color)' : 'var(--bg-elevated)',
                        border: `1px solid ${notifSettings.enabled ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                        position: 'absolute', top: '2px', left: notifSettings.enabled ? '20px' : '2px',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                      }} />
                    </div>
                  </div>
                ) : (
                  <IconChevronRight size={15} color="var(--text-muted)" />
                )}
              </div>
            );
          })}
        </div>

        {/* Sync Modal Overlay */}
        {showSyncModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem', backdropFilter: 'blur(4px)'
          }} onClick={() => setShowSyncModal(false)}>
            <div style={{
              background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
              padding: '1.5rem', width: '100%', maxWidth: '350px',
              border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Rincian Tertunda
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Aktivitas berikut tersimpan secara offline dan menunggu jaringan untuk dikirim ke cloud:
              </p>
              
              <div style={{ 
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', 
                padding: '0.75rem', marginBottom: '1.25rem', maxHeight: '150px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '0.5rem'
              }}>
                {syncQueue.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--primary-color)' }}>•</span>
                    {getSyncLabel(item)}
                  </div>
                ))}
                {syncQueue.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Antrean kosong.</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setShowSyncModal(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-elevated)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontWeight: 700 }}
                >
                  Tutup
                </button>
                <button 
                  onClick={() => { forceSync(); setShowSyncModal(false); }}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--primary-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 700 }}
                >
                  Sinkronkan
                </button>
              </div>
            </div>
          </div>
        )}

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
