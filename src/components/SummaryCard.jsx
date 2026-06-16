import React from 'react';

export default function SummaryCard({ label, value, sub, icon, accent, iconBg }) {
  return (
    <div className="metric-card">
      <div className="metric-card-accent" style={{ background: accent || 'var(--blue)' }} />
      <div className="metric-icon" style={{ background: iconBg || 'var(--blue-dim)', color: accent || 'var(--blue-t)' }}>
        {icon}
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: accent || 'var(--text)' }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}