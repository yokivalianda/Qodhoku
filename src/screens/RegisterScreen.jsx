import React, { useState } from 'react';
import { useQodho } from '../context/QodhoContext';
import { useNavigation } from '../context/NavigationContext';

const RegisterScreen = () => {
  const { register } = useQodho();
  const { navigate } = useNavigation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())     return setError('Nama wajib diisi');
    if (!form.email.trim())    return setError('Email wajib diisi');
    if (!form.password)        return setError('Password wajib diisi');
    if (form.password.length < 6) return setError('Password minimal 6 karakter');
    if (form.password !== form.confirm) return setError('Password tidak cocok');

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      // After register → navigate to setup to enter initial prayer totals
      navigate('setup');
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.875rem 1rem', borderRadius: 'var(--radius)',
    background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
    color: 'var(--text-primary)', fontSize: '1rem',
    outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-app)', overflow: 'auto',
    }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0f2318 0%, #0e1512 60%, #0a0f0d 100%)',
        padding: '2.5rem 1.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 80%, rgba(16,185,129,0.1) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
            border: '1px solid rgba(16,185,129,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 28px rgba(16,185,129,0.18)',
            fontSize: '1.75rem',
          }}>✨</div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 900, color: '#f0fdf4',
            letterSpacing: '-0.02em', marginBottom: '0.375rem',
          }}>
            Buat Akun <span style={{ color: '#10b981' }}>QodhoKu</span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Data tersimpan aman di cloud
          </p>
        </div>
        <div style={{
          position: 'absolute', bottom: -1, left: 0, right: 0,
          height: '32px', background: 'var(--bg-app)', borderRadius: '32px 32px 0 0',
        }} />
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '1.25rem 1.5rem 1.5rem' }}>
        <form id="register-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

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

          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Nama Lengkap
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Nama kamu"
              autoComplete="name"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@contoh.com"
              autoComplete="email"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Konfirmasi Password
            </label>
            <input
              id="register-confirm"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Ulangi password"
              autoComplete="new-password"
              style={{
                ...inputStyle,
                borderColor: form.confirm && form.password !== form.confirm
                  ? 'rgba(239,68,68,0.6)' : 'var(--border-color)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor =
                form.confirm && form.password !== form.confirm
                  ? 'rgba(239,68,68,0.6)' : 'var(--border-color)'
              }
            />
            {form.confirm && form.password !== form.confirm && (
              <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Password tidak cocok</span>
            )}
          </div>

          {/* Submit */}
          <button
            id="register-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner" />
                Mendaftar...
              </span>
            ) : 'Buat Akun'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          margin: '1.25rem 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>sudah punya akun?</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Login link */}
        <button
          id="go-to-login"
          onClick={() => navigate('login')}
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
          <strong>Masuk</strong> ke akun yang ada
        </button>
      </div>
    </div>
  );
};

export default RegisterScreen;
