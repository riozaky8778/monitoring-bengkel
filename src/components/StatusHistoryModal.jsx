import React, { useState, useEffect } from 'react';
import { apiFetch, IS_DEMO } from '../services/api';

// ── Parse tanggal dari format Apps Script: 'dd-MMM-yyyy HH:mm:ss' ──
function parseDateStr(str) {
  if (!str) return null;
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  try {
    const [datePart, timePart = '00:00:00'] = str.split(' ');
    const [dd, mmm, yyyy] = datePart.split('-');
    const [hh, mm, ss = '0'] = timePart.split(':');
    return new Date(+yyyy, months[mmm], +dd, +hh, +mm, +ss);
  } catch { return null; }
}

// ── Hitung durasi antar dua timestamp ──────────────────────────
function calcDuration(fromStr, toStr) {
  const d1 = parseDateStr(fromStr);
  const d2 = parseDateStr(toStr);
  if (!d1 || !d2) return null;
  const diff = d2 - d1;
  if (diff <= 0) return null;
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (days > 0 && hours > 0) return `${days} hari ${hours} jam`;
  if (days > 0)              return `${days} hari`;
  if (hours > 0)             return `${hours} jam ${mins} menit`;
  return `${mins} menit`;
}

// ── Konfigurasi warna per status ───────────────────────────────
const STATUS_CFG = {
  'PENDING':            { color: '#f59e0b', bg: '#fef9ee', border: '#f59e0b40', icon: '⏳', label: 'Pending' },
  'PROSES PERBAIKAN':   { color: '#3b82f6', bg: '#eff6ff', border: '#3b82f640', icon: '🔧', label: 'Proses Perbaikan' },
  'MENUNGGU SPAREPART': { color: '#8b5cf6', bg: '#f5f3ff', border: '#8b5cf640', icon: '📦', label: 'Menunggu Sparepart' },
  'SELESAI':            { color: '#10b981', bg: '#f0fdf4', border: '#10b98140', icon: '✅', label: 'Selesai' },
};

function getCfg(status) {
  return STATUS_CFG[(status || '').toUpperCase()] || {
    color: '#6b7280', bg: '#f9fafb', border: '#6b728040', icon: '📋', label: status || '—',
  };
}

// ── Demo data ──────────────────────────────────────────────────
const DEMO_HISTORY = [
  { OLD_STATUS: '—',              NEW_STATUS: 'PENDING',            CHANGED_AT: '15-Jun-2026 08:00:00' },
  { OLD_STATUS: 'PENDING',        NEW_STATUS: 'PROSES PERBAIKAN',   CHANGED_AT: '17-Jun-2026 13:30:00' },
  { OLD_STATUS: 'PROSES PERBAIKAN', NEW_STATUS: 'SELESAI',          CHANGED_AT: '20-Jun-2026 09:15:00' },
];

// ── Komponen utama ─────────────────────────────────────────────
export default function StatusHistoryModal({ row, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (IS_DEMO) {
      setTimeout(() => { setHistory(DEMO_HISTORY); setLoading(false); }, 400);
      return;
    }
    apiFetch({ action: 'getStatusHistory', no_po: row.NO_PO })
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setHistory(d.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [row.NO_PO]);

  // Hitung total durasi dari status pertama ke terakhir
  const totalDurasi = history.length >= 2
    ? calcDuration(history[0].CHANGED_AT, history[history.length - 1].CHANGED_AT)
    : null;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">🕐 Riwayat Status — PO {row.NO_PO}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">

          {/* Info kendaraan */}
          <div style={{
            background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
            padding: '10px 14px', marginBottom: 20,
            display: 'flex', gap: 16, alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--blue-t)' }}>{row.NOPOL}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{row.JENIS_MOBIL || '—'}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{row.DRIVER || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{row.DEPO || '—'}</div>
            </div>
            {totalDurasi && (
              <div style={{
                marginLeft: 'auto', textAlign: 'right', flexShrink: 0,
                background: 'var(--surface)', borderRadius: 6,
                padding: '6px 10px', border: '1px solid var(--border2)',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Waktu</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{totalDurasi}</div>
              </div>
            )}
          </div>

          {/* Timeline */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: 'auto' }} />
              <div style={{ marginTop: 12, color: 'var(--text3)', fontSize: 13 }}>Memuat riwayat...</div>
            </div>

          ) : error ? (
            <div style={{ textAlign: 'center', color: 'var(--red-t)', padding: 32, fontSize: 13 }}>
              ❌ {error}
            </div>

          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontWeight: 600, color: 'var(--text2)' }}>Belum ada riwayat</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                Riwayat akan tercatat otomatis saat status PO diubah pertama kali.
              </div>
            </div>

          ) : (
            <div style={{ position: 'relative', paddingLeft: 32 }}>

              {/* Garis vertikal */}
              <div style={{
                position: 'absolute', left: 10, top: 10,
                bottom: 10, width: 2,
                background: 'var(--border2)',
              }} />

              {history.map((h, i) => {
                const cfg      = getCfg(h.NEW_STATUS);
                const isLast   = i === history.length - 1;
                const duration = i > 0
                  ? calcDuration(history[i - 1].CHANGED_AT, h.CHANGED_AT)
                  : null;

                return (
                  <div key={i}>

                    {/* Durasi antar step */}
                    {duration && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        margin: '0 0 8px 0', paddingLeft: 4,
                        fontSize: 11, color: 'var(--text3)', fontStyle: 'italic',
                      }}>
                        <div style={{ width: 20, textAlign: 'center' }}>⏱</div>
                        {duration}
                      </div>
                    )}

                    {/* Status node */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start',
                      gap: 12, marginBottom: isLast ? 0 : 8,
                    }}>

                      {/* Dot */}
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: cfg.color, flexShrink: 0,
                        marginLeft: -32, marginTop: 3,
                        border: '2.5px solid var(--surface)',
                        boxShadow: `0 0 0 3px ${cfg.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9,
                      }} />

                      {/* Card */}
                      <div style={{
                        flex: 1, padding: '10px 14px',
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        borderRadius: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>
                          📅 {h.CHANGED_AT}
                        </div>
                        {h.OLD_STATUS && h.OLD_STATUS !== '—' && (
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                            Sebelumnya: <span style={{ color: getCfg(h.OLD_STATUS).color }}>{getCfg(h.OLD_STATUS).label}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Tutup</button>
        </div>

      </div>
    </div>
  );
}
