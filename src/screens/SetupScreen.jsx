import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useQodho } from '../context/QodhoContext';
import { IconCheck, IconArrowRight } from '../components/Icons';

const OPTIONS = [
  {
    id: 'quick',
    emoji: '⚡',
    title: 'Perkiraan Cepat',
    desc: 'Bulan Terakhir (30 Hari)',
    total: '± 150 Shalat',
    color: '#f59e0b',
  },
  {
    id: 'medium',
    emoji: '📅',
    title: 'Perkiraan Menengah',
    desc: '6 Bulan Terakhir',
    total: '± 900 Shalat',
    color: '#10b981',
  },
  {
    id: 'year',
    emoji: '🗓️',
    title: 'Satu Tahun',
    desc: '12 Bulan Terakhir',
    total: '± 1.800 Shalat',
    color: '#3b82f6',
  },
  {
    id: 'custom',
    emoji: '✏️',
    title: 'Input Manual',
    desc: 'Tentukan jumlah sendiri',
    total: 'Custom',
    color: '#8b5cf6',
  },
];

const SetupScreen = () => {
  const { navigate } = useNavigation();
  const { updateUserName } = useQodho();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('medium');
  const [step, setStep] = useState(1); // 1 = name, 2 = options

  const handleNext = () => {
    if (step === 1) {
      if (name.trim()) updateUserName(name.trim());
      setStep(2);
    } else {
      navigate('dailyTarget');
    }
  };

  return (
    <div className="screen-container" style={{ paddingTop: '2.5rem' }}>

      {/* Step indicator */}
      <div className="step-indicator">
        <div className={`step-circle ${step >= 1 ? 'completed' : 'pending'}`}>
          {step > 1 ? <IconCheck size={14} /> : '1'}
        </div>
        <div className={`step-line ${step > 1 ? 'completed' : 'pending'}`} />
        <div className={`step-circle ${step >= 2 ? 'active' : 'pending'}`}>2</div>
        <div className="step-line pending" />
        <div className="step-circle pending">3</div>
      </div>

      {step === 1 ? (
        /* ── Step 1: Name input ───────────────────────── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="title" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Halo, siapa namamu? 👋
            </h1>
            <p className="subtitle">
              Kami akan personalisasi pengalaman ibadahmu
            </p>
          </div>

          {/* Name input card */}
          <div className="setup-step-banner" style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>
              Nama Panggilan
            </p>
            <input
              className="form-input"
              type="text"
              placeholder="Tulis namamu di sini..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && handleNext()}
              autoFocus
              style={{ fontSize: '1.05rem', fontWeight: 600 }}
            />
            {name.trim() && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                Assalamu'alaikum, <strong>{name}</strong>! 🌙
              </p>
            )}
          </div>

          {/* Why we ask */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            border: '1px solid var(--border-color)',
            marginBottom: 'auto',
          }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Mengapa ini penting?
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Nama digunakan untuk menyapa dan memotivasi kamu sepanjang perjalanan melunasi qodho sholat.
            </p>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!name.trim()}
            >
              Lanjutkan
              <IconArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
            </button>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', width: '100%', padding: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}
              onClick={() => { navigate('dailyTarget'); }}
            >
              Lewati
            </button>
          </div>
        </div>
      ) : (
        /* ── Step 2: Estimation options ──────────────── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Estimasi Qodho Sholat
            </h1>
            <p className="subtitle">Pilih rentang waktu sebagai referensi awal</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: 'auto' }}>
            {OPTIONS.map(opt => (
              <div
                key={opt.id}
                className={`setup-option-card ${selected === opt.id ? 'selected' : ''}`}
                onClick={() => setSelected(opt.id)}
              >
                {/* Color accent bar */}
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: '3px',
                  borderRadius: '99px 0 0 99px',
                  background: selected === opt.id ? opt.color : 'transparent',
                  transition: 'background 0.2s ease',
                }} />

                <div className="setup-option-icon">
                  <span style={{ fontSize: '1.3rem' }}>{opt.emoji}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {opt.title}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {opt.desc}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontSize: '0.78rem', fontWeight: 700,
                    color: selected === opt.id ? opt.color : 'var(--text-muted)',
                    transition: 'color 0.2s ease',
                  }}>
                    {opt.total}
                  </p>
                </div>

                <div className="setup-option-check">
                  {selected === opt.id && <IconCheck size={12} />}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn-primary" onClick={handleNext}>
              Selanjutnya
              <IconArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
            </button>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', width: '100%', padding: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}
              onClick={() => setStep(1)}
            >
              ← Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupScreen;
