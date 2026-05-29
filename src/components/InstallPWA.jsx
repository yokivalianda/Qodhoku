import React, { useState, useEffect } from 'react';

/**
 * InstallPWA — tombol install app ke Home Screen
 * Mendeteksi `beforeinstallprompt` (Android/Chrome) dan
 * menampilkan petunjuk manual untuk iOS Safari.
 */
const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect if already installed (standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    // Android/Chrome: capture beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show button for iOS too (manual guide)
    if (ios) setShowInstallBtn(true);

    // Detect app installed
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  if (installed) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(16,185,129,0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(16,185,129,0.25)',
      }}>
        <span style={{ fontSize: '1.1rem' }}>✅</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>
          Sudah terinstall di perangkat
        </span>
      </div>
    );
  }

  if (!showInstallBtn) return null;

  return (
    <>
      {/* Install Button */}
      <button
        id="pwa-install-btn"
        onClick={handleInstall}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          width: '100%',
          padding: '0.875rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
          border: '1.5px solid rgba(16,185,129,0.4)',
          borderRadius: '14px',
          color: 'var(--primary-color)',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: 'inherit',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.18))';
          e.currentTarget.style.boxShadow = '0 0 24px rgba(16,185,129,0.25)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>📲</span>
        <span>{isIOS ? 'Tambahkan ke Home Screen' : 'Install Aplikasi'}</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.7rem',
          fontWeight: 600,
          background: 'rgba(16,185,129,0.2)',
          padding: '2px 8px',
          borderRadius: '99px',
          color: 'var(--primary-400)',
        }}>GRATIS</span>
      </button>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 0 env(safe-area-inset-bottom, 0)',
          }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              borderRadius: '24px 24px 0 0',
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{
              width: '36px', height: '4px',
              background: 'var(--bg-elevated)',
              borderRadius: '2px',
              margin: '0 auto 1.25rem',
            }} />

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📱</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Tambahkan ke Home Screen
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ikuti langkah berikut di Safari
              </p>
            </div>

            {[
              { step: '1', icon: '⬆️', text: 'Tap ikon Share di bagian bawah browser Safari' },
              { step: '2', icon: '📋', text: 'Scroll ke bawah dan tap "Add to Home Screen"' },
              { step: '3', icon: '✅', text: 'Tap "Add" di pojok kanan atas' },
            ].map(({ step, icon, text }) => (
              <div key={step} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem',
                background: 'var(--bg-surface-2)',
                borderRadius: '12px',
                marginBottom: '0.5rem',
              }}>
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--primary-color)',
                }}>
                  {step}
                </div>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}

            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.875rem',
                background: 'var(--bg-elevated)',
                border: 'none',
                borderRadius: '12px',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default InstallPWA;
