import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useQodho } from '../context/QodhoContext';
import { IconArrowLeft, IconCheckCircle } from '../components/Icons';

const PRAYERS = [
  { key: 'subuh',   label: 'Subuh',   emoji: '🌅', color: '#f59e0b', rakaat: 2 },
  { key: 'dzuhur',  label: 'Dzuhur',  emoji: '☀️', color: '#fb923c', rakaat: 4 },
  { key: 'ashar',   label: 'Ashar',   emoji: '🌤️', color: '#f43f5e', rakaat: 4 },
  { key: 'maghrib', label: 'Maghrib', emoji: '🌆', color: '#a78bfa', rakaat: 3 },
  { key: 'isya',    label: 'Isya',    emoji: '🌙', color: '#60a5fa', rakaat: 4 },
];

const QuickAddScreen = () => {
  const { navigate } = useNavigation();
  const { addQodho } = useQodho();
  const [selected, setSelected] = useState({});
  const [saved, setSaved] = useState(false);

  const toggle = key => {
    setSelected(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const remove = key => {
    setSelected(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const totalSelected = Object.values(selected).reduce((s, v) => s + v, 0);

  const handleSave = () => {
    Object.entries(selected).forEach(([key, count]) => addQodho(key, count));
    setSaved(true);
    setTimeout(() => navigate('home'), 900);
  };

  return (
    <div className="screen-container" style={{ paddingTop: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.75rem' }}>
        <button className="btn-icon" onClick={() => navigate('home')}>
          <IconArrowLeft size={22} />
        </button>
        <div style={{ marginLeft: '0.75rem' }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Catat Qodho</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Prayer Selector */}
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem' }}>
        Pilih Waktu Sholat
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {PRAYERS.map(p => {
          const count = selected[p.key] || 0;
          const isSelected = count > 0;
          return (
            <div
              key={p.key}
              onClick={() => toggle(p.key)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '0.875rem 1rem',
                background: isSelected ? `${p.color}12` : 'var(--bg-surface)',
                border: `1px solid ${isSelected ? p.color + '55' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: isSelected ? `0 0 16px ${p.color}22` : 'none',
              }}
            >
              {/* Emoji icon */}
              <div style={{
                width: '40px', height: '40px',
                borderRadius: '12px',
                background: isSelected ? `${p.color}22` : 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', marginRight: '0.875rem', flexShrink: 0,
                transition: 'all 0.18s ease',
              }}>
                {p.emoji}
              </div>

              {/* Name & rakaat */}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? p.color : 'var(--text-primary)' }}>
                  {p.label}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.rakaat} raka'at</p>
              </div>

              {/* Counter control */}
              {isSelected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={e => { e.stopPropagation(); count === 1 ? remove(p.key) : setSelected(prev => ({ ...prev, [p.key]: prev[p.key] - 1 })); }}
                    style={{
                      width: '28px', height: '28px',
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', color: 'var(--text-muted)',
                      fontWeight: 700,
                    }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: p.color, minWidth: '24px', textAlign: 'center' }}>
                    {count}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); toggle(p.key); }}
                    style={{
                      width: '28px', height: '28px',
                      borderRadius: '50%',
                      background: `${p.color}22`,
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', color: p.color, fontWeight: 700,
                    }}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  border: '1.5px dashed var(--border-color-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', fontSize: '1.1rem',
                }}>
                  +
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary strip */}
      <div style={{
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.875rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'auto',
      }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.1rem' }}>TOTAL DIPILIH</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: totalSelected > 0 ? 'var(--primary-color)' : 'var(--text-muted)' }}>
            {totalSelected > 0 ? `${totalSelected} Sholat Qodho` : 'Belum ada pilihan'}
          </p>
        </div>
        {totalSelected > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Object.entries(selected).map(([key, count]) => {
              const p = PRAYERS.find(p => p.key === key);
              return p ? (
                <div key={key} style={{
                  background: `${p.color}22`,
                  borderRadius: '99px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: p.color,
                }}>
                  {p.emoji}{count}
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{ marginTop: '1.25rem' }}>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={totalSelected === 0 || saved}
          style={{ fontSize: '0.95rem' }}
        >
          {saved ? '✅ Tersimpan!' : (
            <>
              Simpan Qodho
              <IconCheckCircle size={18} style={{ marginLeft: '0.5rem' }} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuickAddScreen;
