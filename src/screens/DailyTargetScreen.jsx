import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useQodho } from '../context/QodhoContext';
import { IconCheck, IconArrowRight } from '../components/Icons';

const TARGETS = [
  {
    value: 1,
    emoji: '🌱',
    title: '1 Sholat / Hari',
    subtitle: 'Ringan & Konsisten',
    desc: 'Cocok untuk pemula. Kuncinya adalah konsistensi jangka panjang.',
    color: '#34d399',
    estimatedDays: '400+ hari',
  },
  {
    value: 3,
    emoji: '⚡',
    title: '3 Sholat / Hari',
    subtitle: 'Paling Direkomendasikan',
    desc: 'Seimbang antara kecepatan dan keberlanjutan. Pilihan terpopuler.',
    recommended: true,
    color: '#10b981',
    estimatedDays: '~135 hari',
  },
  {
    value: 5,
    emoji: '🚀',
    title: '5 Sholat / Hari',
    subtitle: 'Intensif',
    desc: 'Untuk yang ingin menyelesaikan lebih cepat dengan komitmen tinggi.',
    color: '#f59e0b',
    estimatedDays: '~80 hari',
  },
];

const DailyTargetScreen = () => {
  const { navigate } = useNavigation();
  const { setDailyTarget: saveDailyTarget, setOnboarded, totalTarget, totalCompleted } = useQodho();
  const [selectedTarget, setSelectedTarget] = useState(3);

  const handleSave = () => {
    saveDailyTarget(selectedTarget);
    setOnboarded();
    navigate('home');
  };

  const remaining = Math.max(0, totalTarget - totalCompleted);

  const getDynamicTargetDetails = (tVal) => {
    const daysLeft = Math.ceil(remaining / tVal);
    const pDate = new Date();
    pDate.setDate(pDate.getDate() + daysLeft);
    const dateStr = pDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return {
      daysLeft,
      dateStr,
      estimatedText: remaining > 0 ? `${daysLeft} hari lagi` : 'Sudah Lunas'
    };
  };

  const selected = TARGETS.find(t => t.value === selectedTarget);
  const selectedDetails = selected ? getDynamicTargetDetails(selected.value) : null;

  return (
    <div className="screen-container" style={{ paddingTop: '2.5rem' }}>

      {/* Step indicator */}
      <div className="step-indicator">
        <div className="step-circle completed"><IconCheck size={14} /></div>
        <div className="step-line completed" />
        <div className="step-circle completed"><IconCheck size={14} /></div>
        <div className="step-line completed" />
        <div className="step-circle active">3</div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Target Harian
        </h1>
        <p className="subtitle">
          Pilih target yang realistis dan bisa dijaga konsistensinya.
        </p>
      </div>

      {/* Target cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: 'auto' }}>
        {TARGETS.map(target => {
          const isSelected = selectedTarget === target.value;
          return (
            <div
              key={target.value}
              onClick={() => setSelectedTarget(target.value)}
              className={`target-card ${isSelected ? 'selected' : ''}`}
            >
              {target.recommended && (
                <span className="target-badge">⭐ DISARANKAN</span>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Emoji circle */}
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: '14px',
                  background: isSelected ? `${target.color}22` : 'var(--bg-elevated)',
                  border: `1.5px solid ${isSelected ? target.color : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 16px ${target.color}44` : 'none',
                }}>
                  {target.emoji}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? target.color : 'var(--text-primary)' }}>
                      {target.title}
                    </p>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      color: isSelected ? target.color : 'var(--text-muted)',
                      background: isSelected ? `${target.color}18` : 'var(--bg-elevated)',
                      padding: '2px 8px', borderRadius: '99px',
                    }}>
                      {getDynamicTargetDetails(target.value).estimatedText}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{target.desc}</p>
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  width: '20px', height: '20px',
                  borderRadius: '50%',
                  background: target.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 12px ${target.color}66`,
                }}>
                  <IconCheck size={10} color="white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview banner */}
      {selected && selectedDetails && (
        <div style={{
          background: 'var(--bg-surface-2)',
          border: `1px solid ${selected.color}44`,
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1rem',
          marginTop: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Estimasi Selesai</p>
               <p style={{ fontSize: '1.1rem', fontWeight: 800, color: selected.color }}>{selectedDetails.estimatedText}</p>
             </div>
             <div style={{ textAlign: 'right' }}>
               <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Qodho / hari</p>
               <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedTarget}x Sholat</p>
             </div>
          </div>
          {remaining > 0 && (
            <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                🎉 Insya Allah lunas pada <span style={{ fontWeight: 800, color: selected.color }}>{selectedDetails.dateStr}</span>
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '1.25rem' }}>
        <button className="btn-primary" onClick={handleSave}>
          Mulai Sekarang 🎯
          <IconArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
        </button>
      </div>
    </div>
  );
};

export default DailyTargetScreen;
