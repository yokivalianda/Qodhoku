import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useQodho } from '../context/QodhoContext';
import { IconTrendUp } from '../components/Icons';

const StatisticsScreen = () => {
  const [tab, setTab] = useState('mingguan');
  const { history, totalCompleted, totalTarget, streak, prayers, dailyTarget } = useQodho();

  /* Chart data */
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const count = history.filter(h => h.date === dateStr).length;
    return {
      count,
      day: d.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 3),
      isToday: i === 6,
    };
  });

  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const compliance = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
  const remaining = Math.max(0, totalTarget - totalCompleted);

  const daysLeft = Math.ceil(remaining / (dailyTarget || 3));
  const payoffDate = new Date();
  payoffDate.setDate(payoffDate.getDate() + daysLeft);
  const payoffDateStr = payoffDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const exportToCSV = () => {
    if (history.length === 0) return alert('Belum ada data untuk diekspor.');
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Waktu Sholat,Jumlah,Tanggal Pelaksanaan,Waktu Dicatat\n";
    history.forEach(row => {
      const ts = row.timestamp ? new Date(row.timestamp).toLocaleString('id-ID') : '';
      csvContent += `${row.prayer},${row.count},${row.date},"${ts}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Riwayat_QodhoKu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* Prayer breakdown sorted by progress */
  const prayerList = Object.entries(prayers).map(([key, val]) => ({
    key,
    ...val,
    pct: val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  const PRAYER_COLORS = {
    subuh: '#f59e0b', dzuhur: '#fb923c', ashar: '#f43f5e',
    maghrib: '#a78bfa', isya: '#60a5fa',
  };
  const PRAYER_EMOJIS = {
    subuh: '🌅', dzuhur: '☀️', ashar: '🌤️', maghrib: '🌆', isya: '🌙',
  };
  const PRAYER_LABELS = {
    subuh: 'Subuh', dzuhur: 'Dzuhur', ashar: 'Ashar', maghrib: 'Maghrib', isya: 'Isya',
  };

  return (
    <div className="screen-scroll">
      <div className="screen-container">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>Statistik</h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pantau progres amalmu</p>
          </div>
          <button 
            onClick={exportToCSV}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              color: 'var(--primary-color)', padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer'
            }}
          >
            ⬇️ CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="stat-tabs">
          <div className={`stat-tab ${tab === 'mingguan' ? 'active' : ''}`} onClick={() => setTab('mingguan')}>
            Mingguan
          </div>
          <div className={`stat-tab ${tab === 'bulanan' ? 'active' : ''}`} onClick={() => setTab('bulanan')}>
            Bulanan
          </div>
        </div>

        {/* Chart */}
        <div className="card mb-lg" style={{ padding: '1.25rem 1rem 1rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Qodho per Hari</p>
            <IconTrendUp size={16} color="var(--primary-color)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '6px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            {chartData.map((d, idx) => {
              const heightPct = Math.max((d.count / maxCount) * 100, d.count > 0 ? 6 : 2);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {d.count > 0 && (
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--primary-400)' }}>{d.count}</p>
                  )}
                  <div style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    borderRadius: '4px 4px 0 0',
                    background: d.isToday
                      ? 'linear-gradient(180deg, #34d399, #10b981)'
                      : d.count > 0
                        ? 'linear-gradient(180deg, #059669, #047857)'
                        : 'var(--bg-elevated)',
                    opacity: d.isToday ? 1 : d.count > 0 ? 0.75 : 0.4,
                    boxShadow: d.isToday ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                    transition: 'height 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {chartData.map((d, idx) => (
              <span key={idx} style={{
                flex: 1, textAlign: 'center',
                fontSize: '0.6rem',
                color: d.isToday ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: d.isToday ? 700 : 400,
              }}>{d.day}</span>
            ))}
          </div>
        </div>

        {/* Payoff Simulator Card */}
        <div className="card-glow" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0
          }}>
            🎯
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>
              Estimasi Lunas
            </p>
            {remaining > 0 ? (
              <>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)' }}>{payoffDateStr}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dengan target {dailyTarget} sholat/hari</p>
              </>
            ) : (
              <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)' }}>Alhamdulillah, Lunas!</p>
            )}
          </div>
        </div>

        {/* Summary mini cards */}
        <div className="stat-mini-grid">
          <div className="stat-mini-card">
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399' }}>{compliance}%</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Selesai</p>
          </div>
          <div className="stat-mini-card">
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24' }}>{streak.current}🔥</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Streak</p>
          </div>
          <div className="stat-mini-card">
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#60a5fa' }}>{remaining}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Sisa</p>
          </div>
        </div>

        {/* Prayer breakdown */}
        <div className="card" style={{ background: 'var(--bg-surface)' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Per Waktu Sholat
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {prayerList.map(p => {
              const color = PRAYER_COLORS[p.key] || 'var(--primary-color)';
              return (
                <div key={p.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>{PRAYER_EMOJIS[p.key]}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {PRAYER_LABELS[p.key]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.completed}/{p.total}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color, background: `${color}18`, padding: '1px 6px', borderRadius: '99px' }}>
                        {p.pct}%
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${p.pct}%`, height: '100%',
                      background: `linear-gradient(90deg, ${color}cc, ${color})`,
                      borderRadius: '3px',
                      transition: 'width 0.8s ease',
                      boxShadow: `0 0 6px ${color}66`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      <BottomNav currentScreen="statistics" />
    </div>
  );
};

export default StatisticsScreen;
