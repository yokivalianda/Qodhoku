import React, { useEffect, useRef } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { IconArrowRight } from '../components/Icons';

const FEATURES = [
  { icon: '🕌', text: 'Lacak qodho 5 waktu' },
  { icon: '📈', text: 'Pantau progres harian' },
  { icon: '🔥', text: 'Jaga streak konsistensi' },
];

const OnboardingScreen = () => {
  const { navigate } = useNavigation();
  const canvasRef = useRef(null);

  /* ── Particle animation ────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 28 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Hero Section */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(160deg, #0f2318 0%, #0e1512 60%, #0a0f0d 100%)',
        flex: '0 0 55%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '2rem',
      }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

        {/* Glow ring */}
        <div style={{
          position: 'absolute',
          width: '260px', height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Icon */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '90px', height: '90px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 0 40px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '2.5rem' }}>🕌</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h1 style={{
            fontSize: '2.25rem', fontWeight: 900,
            color: '#f0fdf4', letterSpacing: '-0.02em',
            marginBottom: '0.5rem', lineHeight: 1.1,
          }}>
            Qodho<span style={{ color: '#10b981' }}>Ku</span>
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: '#6b7280',
            lineHeight: 1.6,
            maxWidth: '220px',
            margin: '0 auto',
          }}>
            Lunasi hutang sholat dengan disiplin & terukur
          </p>
        </div>

        {/* Bottom curve */}
        <div style={{
          position: 'absolute', bottom: -1, left: 0, right: 0,
          height: '40px',
          background: 'var(--bg-app)',
          borderRadius: '40px 40px 0 0',
        }} />
      </div>

      {/* Bottom Section */}
      <div style={{ flex: 1, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.875rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              animation: `screenFadeSlide 0.4s ease-out ${i * 0.08}s both`,
            }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'var(--primary-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
              }}>{f.icon}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '1.5rem' }}>
          <button className="btn-primary" onClick={() => navigate('setup')} style={{ fontSize: '1rem' }}>
            Mulai Perjalanan
            <IconArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
          </button>
          <p className="text-center" style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Gratis selamanya • Tanpa iklan
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
