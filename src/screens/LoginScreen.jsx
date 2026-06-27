import React, { useState } from 'react';
import { useQodho } from '../context/QodhoContext';
import { useNavigation } from '../context/NavigationContext';

const LoginScreen = () => {
  const { login } = useQodho();
  const { navigate } = useNavigation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      // navigate to home is handled by App.jsx via auth state change
    } catch (err) {
      setError(err.message || 'Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-app)', overflow: 'auto',
    }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0f2318 0%, #0e1512 60%, #0a0f0d 100%)',
        padding: '3rem 1.5rem 2.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 80%, rgba(16,185,129,0.1) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
            border: '1px solid rgba(16,185,129,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 32px rgba(16,185,129,0.2)',
            fontSize: '2rem',
          }}>🕌</div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 900, color: '#f0fdf4',
            letterSpacing: '-0.02em', marginBottom: '0.375rem',
          }}>
            Masuk ke <span style={{ color: '#10b981' }}>QodhoKu</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Lanjutkan perjalanan ibadahmu
          </p>
        </div>
        {/* curve */}
        <div style={{
          position: 'absolute', bottom: -1, left: 0, right: 0,
          height: '32px', background: 'var(--bg-app)', borderRadius: '32px 32px 0 0',
        }} />
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <form id="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius)', color: '#f87171', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              animation: 'screenFadeSlide 0.2s ease-out',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@contoh.com"
              autoComplete="email"
              style={{
                width: '100%', padding: '0.875rem 1rem', borderRadius: 'var(--radius)',
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', fontSize: '1rem',
                outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: '100%', padding: '0.875rem 1rem', borderRadius: 'var(--radius)',
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', fontSize: '1rem',
                outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner" />
                Masuk...
              </span>
            ) : 'Masuk'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          margin: '1.5rem 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>atau</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Register link */}
        <button
          id="go-to-register"
          onClick={() => navigate('register')}
          style={{
            width: '100%', padding: '0.875rem',
            background: 'transparent', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)', color: 'var(--text-primary)',
            fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-primary)'; }}
        >
          Belum punya akun? <strong>Daftar sekarang</strong>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
