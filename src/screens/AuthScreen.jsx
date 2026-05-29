import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useQodho } from '../context/QodhoContext';
import { IconUser, IconCheck, IconShield, IconClock } from '../components/Icons';

const AuthScreen = () => {
  const { navigate } = useNavigation();
  const { token, user, syncing, login, register, logout, hasOnboarded } = useQodho();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Email dan Password wajib diisi.');
      return;
    }

    if (activeTab === 'register' && !name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    if (activeTab === 'login') {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMsg('Berhasil masuk! Memuat data...');
        setTimeout(() => {
          // Jika sudah pernah onboarding → langsung ke home
          // Jika belum → jalani onboarding dulu
          navigate(hasOnboarded ? 'home' : 'onboarding');
        }, 800);
      } else {
        setErrorMsg(res.error || 'Gagal masuk. Periksa kembali email & password.');
      }
    } else {
      const res = await register(name, email, password);
      if (res.success) {
        setSuccessMsg('Akun berhasil dibuat! Memulai setup...');
        // User baru → selalu onboarding
        setTimeout(() => navigate('onboarding'), 800);
      } else {
        setErrorMsg(res.error || 'Gagal mendaftar. Email mungkin sudah digunakan.');
      }
    }
  };

  return (
    <div className="screen-scroll">
      <div className="screen-container" style={{ paddingBottom: '30px' }}>

        {/* Header — branding saja, tidak ada back button di halaman awal */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '0.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
            border: '1px solid rgba(16,185,129,0.35)',
            fontSize: '1.75rem', marginBottom: '0.75rem',
            boxShadow: '0 0 24px rgba(16,185,129,0.2)',
          }}>🕌</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Qodho<span style={{ color: 'var(--primary-color)' }}>Ku</span>
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {token ? 'Detail Akun Cloud' : 'Masuk atau daftar untuk memulai'}
          </p>
        </div>

        {token ? (
          /* ── Case 1: USER IS ALREADY LOGGED IN ───────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Connection Dashboard */}
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(10,15,13,0.3) 100%)',
              border: '1px solid rgba(16,185,129,0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Glowing Background Dot */}
              <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '100px', height: '100px',
                background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
                <div style={{ 
                  width: '44px', height: '44px', 
                  borderRadius: '12px', 
                  background: 'rgba(16,185,129,0.18)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary-color)'
                }}>
                  <IconUser size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {user?.name || 'Hamba Allah'}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                    {user?.email}
                  </p>
                </div>
              </div>

              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                background: 'rgba(16,185,129,0.12)', 
                padding: '0.5rem 0.875rem', 
                borderRadius: '8px', 
                border: '1px solid rgba(16,185,129,0.2)' 
              }}>
                <span className="dot-glowing" style={{ 
                  width: '8px', height: '8px', 
                  background: '#10b981', 
                  borderRadius: '50%', 
                  boxShadow: '0 0 8px #10b981' 
                }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399' }}>
                  Sinkron Cloud Aktif (Turso)
                </span>
              </div>
            </div>

            {/* Sync Benefits Checklist */}
            <div className="card" style={{ background: 'var(--bg-surface)' }}>
              <p style={{ 
                fontSize: '0.75rem', fontWeight: 700, 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', letterSpacing: '0.07em', 
                marginBottom: '1rem' 
              }}>
                Keuntungan Akun Cloud:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <IconCheck size={16} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    <strong>Akses Multi-Perangkat:</strong> Data qodho terhubung real-time di HP, tablet, maupun komputer.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <IconCheck size={16} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    <strong>Backup Aman Turso:</strong> Riwayat sholat Anda aman tersimpan di cloud terdistribusi global.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <IconCheck size={16} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    <strong>Migrasi Instan:</strong> Progress offline terdahulu Anda telah berhasil diunggah.
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div style={{ marginTop: '1.5rem' }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  logout();
                  navigate('auth');
                }}
                style={{ 
                  background: 'rgba(248,113,113,0.12)', 
                  border: '1px solid rgba(248,113,113,0.3)', 
                  color: '#f87171',
                  fontSize: '0.95rem'
                }}
              >
                Keluar & Disconnect Cloud
              </button>
              <p className="text-center" style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Keluar akun akan mengembalikan aplikasi ke penyimpanan offline lokal.
              </p>
            </div>

          </div>
        ) : (
          /* ── Case 2: USER IS NOT LOGGED IN ───────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              background: 'var(--bg-surface)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '4px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                style={{
                  flex: 1, padding: '0.65rem', border: 'none', borderRadius: '10px',
                  background: activeTab === 'login' ? 'var(--bg-surface-2)' : 'transparent',
                  color: activeTab === 'login' ? 'var(--primary-color)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'login' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                }}
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                Masuk Akun
              </button>
              <button
                style={{
                  flex: 1, padding: '0.65rem', border: 'none', borderRadius: '10px',
                  background: activeTab === 'register' ? 'var(--bg-surface-2)' : 'transparent',
                  color: activeTab === 'register' ? 'var(--primary-color)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'register' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                }}
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                Daftar Baru
              </button>
            </div>

            {/* Explanation Banner */}
            <div className="setup-step-banner" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.4rem' }}>☁️</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {activeTab === 'login' 
                  ? 'Masuk untuk memulihkan data qodho Anda dari cloud database Turso dan sinkronkan di perangkat ini.' 
                  : 'Daftar akun agar data Anda tersimpan aman di cloud. Progress offline Anda saat ini akan ikut diunggah otomatis!'}
              </p>
            </div>

            {/* Feedback Messages */}
            {errorMsg && (
              <div style={{
                background: 'rgba(248,113,113,0.1)', 
                border: '1px solid rgba(248,113,113,0.25)', 
                borderRadius: 'var(--radius-lg)', 
                padding: '0.75rem 1rem', 
                fontSize: '0.8rem', color: '#f87171',
                lineHeight: 1.4
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: 'rgba(52,211,153,0.1)', 
                border: '1px solid rgba(52,211,153,0.25)', 
                borderRadius: 'var(--radius-lg)', 
                padding: '0.75rem 1rem', 
                fontSize: '0.8rem', color: '#34d399',
                lineHeight: 1.4
              }}>
                ✨ {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {activeTab === 'register' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>NAMA LENGKAP</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Yoki Saputra"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={syncing}
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ALAMAT EMAIL</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={syncing}
                  style={{ fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PASSWORD</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={syncing}
                  style={{ fontSize: '0.9rem' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={syncing}
                style={{ marginTop: '1rem', fontSize: '0.95rem' }}
              >
                {syncing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <span className="spinner" style={{ 
                      width: '16px', height: '16px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderTopColor: '#fff', 
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Memproses...
                  </span>
                ) : (
                  activeTab === 'login' ? 'Masuk & Sinkronkan 🚀' : 'Daftar & Mulai ☁️'
                )}
              </button>
            </form>

            {/* Skip — lanjut tanpa akun (offline mode) */}
            <button
              onClick={() => navigate(hasOnboarded ? 'home' : 'onboarding')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: '0.82rem',
                padding: '0.75rem', width: '100%', cursor: 'pointer',
                textDecoration: 'underline', textUnderlineOffset: '3px',
              }}
            >
              Lanjut tanpa akun (offline)
            </button>

            {/* Explanatory Info Card */}
            <div className="card" style={{ background: 'var(--bg-surface)', padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                <IconShield size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Data Aman & Terenskripsi</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Koneksi data diamankan dengan SSL HTTPS. Password Anda disandikan secara satu-arah (bcrypt) di backend server sebelum masuk ke database Turso.
              </p>
            </div>

          </div>
        )}

      </div>

      {/* Embedded Spinner Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default AuthScreen;
