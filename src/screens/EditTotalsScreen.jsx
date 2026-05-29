import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useQodho } from '../context/QodhoContext';
import { IconArrowLeft, IconCheck } from '../components/Icons';

const PRAYERS = [
  { key: 'subuh',   label: 'Subuh',   emoji: '🌅', color: '#f59e0b', rakaat: 2 },
  { key: 'dzuhur',  label: 'Dzuhur',  emoji: '☀️',  color: '#fb923c', rakaat: 4 },
  { key: 'ashar',   label: 'Ashar',   emoji: '🌤️', color: '#f43f5e', rakaat: 4 },
  { key: 'maghrib', label: 'Maghrib', emoji: '🌆', color: '#a78bfa', rakaat: 3 },
  { key: 'isya',    label: 'Isya',    emoji: '🌙', color: '#60a5fa', rakaat: 4 },
];

const EditTotalsScreen = () => {
  const { navigate } = useNavigation();
  const { prayers, setPrayerTotals, syncing } = useQodho();

  // Pre-fill with current totals
  const [values, setValues] = useState(() =>
    Object.fromEntries(PRAYERS.map(p => [p.key, String(prayers[p.key]?.total ?? 25)]))
  );
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (key, raw) => {
    setValues(prev => ({ ...prev, [key]: raw }));
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    PRAYERS.forEach(({ key }) => {
      const v = Number(values[key]);
      const completed = prayers[key]?.completed ?? 0;
      if (!values[key] || isNaN(v) || v < 0) {
        newErrors[key] = 'Masukkan angka yang valid';
      } else if (v < completed) {
        newErrors[key] = `Min. ${completed} (sudah selesai ${completed})`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const totals = Object.fromEntries(
      PRAYERS.map(({ key }) => [key, Number(values[key])])
    );
    await setPrayerTotals(totals);
    setSaved(true);
    setTimeout(() => navigate('profile'), 1000);
  };

  const totalNew = PRAYERS.reduce((s, p) => s + (Number(values[p.key]) || 0), 0);
  const totalCompleted = PRAYERS.reduce((s, p) => s + (prayers[p.key]?.completed ?? 0), 0);
  const totalRemaining = totalNew - totalCompleted;

  return (
    <div className="screen-scroll">
      <div className="screen-container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.75rem' }}>
          <button
            className="btn-icon"
            onClick={() => navigate('profile')}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconArrowLeft size={20} color="var(--text-primary)" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Edit Jumlah Qodho
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
              Sesuaikan total hutang qodho tiap waktu sholat
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="setup-step-banner" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📋</span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Masukkan jumlah total qodho yang harus Anda lunasi untuk tiap waktu sholat. Angka tidak boleh lebih kecil dari jumlah yang sudah diselesaikan.
          </p>
        </div>

        {/* Summary strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.625rem', marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Total Hutang', value: totalNew, color: 'var(--primary-color)' },
            { label: 'Sudah Selesai', value: totalCompleted, color: '#34d399' },
            { label: 'Sisa', value: Math.max(0, totalRemaining), color: '#fbbf24' },
          ].map(item => (
            <div key={item.label} className="stat-mini-card">
              <p style={{ fontSize: '1.3rem', fontWeight: 900, color: item.color }}>{item.value}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Prayer inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
          {PRAYERS.map(p => {
            const completed = prayers[p.key]?.completed ?? 0;
            const hasError = !!errors[p.key];
            return (
              <div key={p.key} style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${hasError ? '#f87171' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                transition: 'border-color 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.75rem' }}>
                  {/* Emoji */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: `${p.color}18`, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}>
                    {p.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{p.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                      {p.rakaat} raka'at · Selesai: <span style={{ color: '#34d399', fontWeight: 700 }}>{completed}</span>
                    </p>
                  </div>
                  {/* Quick preset buttons */}
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {[25, 100, 365].map(preset => (
                      <button
                        key={preset}
                        onClick={() => handleChange(p.key, String(preset))}
                        style={{
                          padding: '3px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          background: Number(values[p.key]) === preset ? `${p.color}22` : 'var(--bg-elevated)',
                          color: Number(values[p.key]) === preset ? p.color : 'var(--text-muted)',
                          fontSize: '0.65rem', fontWeight: 700,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number input with stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleChange(p.key, String(Math.max(completed, (Number(values[p.key]) || 0) - 1)))}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                      fontSize: '1.2rem', fontWeight: 700, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={completed}
                    value={values[p.key]}
                    onChange={e => handleChange(p.key, e.target.value)}
                    className="form-input"
                    style={{
                      textAlign: 'center', flex: 1,
                      fontSize: '1.1rem', fontWeight: 800,
                      color: hasError ? '#f87171' : p.color,
                      padding: '0.5rem',
                    }}
                  />

                  <button
                    onClick={() => handleChange(p.key, String((Number(values[p.key]) || 0) + 1))}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: `${p.color}18`, color: p.color,
                      fontSize: '1.2rem', fontWeight: 700, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>

                {hasError && (
                  <p style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '0.4rem' }}>
                    ⚠️ {errors[p.key]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={syncing || saved}
          style={{ fontSize: '0.95rem' }}
        >
          {saved ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <IconCheck size={18} /> Tersimpan!
            </span>
          ) : syncing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <span style={{
                width: '16px', height: '16px',
                border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              Menyimpan...
            </span>
          ) : (
            '💾 Simpan Perubahan'
          )}
        </button>

        <p className="text-center" style={{ marginTop: '0.875rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Perubahan otomatis tersinkronisasi ke cloud database Anda
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      ` }} />
    </div>
  );
};

export default EditTotalsScreen;
