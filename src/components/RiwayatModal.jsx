import React, { useState, useMemo } from 'react';
import { formatTgl, statusOf, fmtRp } from '../utils/helpers';

export default function RiwayatModal({ unit, poData, onClose }) {
  const allRiwayat = useMemo(() => {
    return (poData || [])
      .filter(r => String(r.NOPOL || '').trim() === String(unit.NOPOL || '').trim())
      .sort((a, b) => new Date(b.TGL_MASUK) - new Date(a.TGL_MASUK));
  }, [poData, unit]);

  const tahunList = useMemo(() => {
    const years = [...new Set(allRiwayat.map(r => {
      const d = new Date(r.TGL_MASUK);
      return isNaN(d) ? null : d.getFullYear();
    }).filter(Boolean))].sort((a, b) => b - a);
    return years;
  }, [allRiwayat]);

  const currentYear = new Date().getFullYear();
  const [filterTahun, setFilterTahun] = useState(
    tahunList.includes(currentYear) ? currentYear : (tahunList[0] || '')
  );

  const riwayat = useMemo(() => {
    if (!filterTahun) return allRiwayat;
    return allRiwayat.filter(r => {
      const d = new Date(r.TGL_MASUK);
      return !isNaN(d) && d.getFullYear() === Number(filterTahun);
    });
  }, [allRiwayat, filterTahun]);

  const totalBiaya = riwayat.reduce((s, r) => s + (Number(r.TOTAL_BIAYA || r.BIAYA) || 0), 0);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">
              🚗 {unit.NOPOL} — {unit.MERK || ''} {unit.TYPE || ''}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              {unit.DEPO || ''}{unit.DIVISI ? ` • ${unit.DIVISI}` : ''}{unit.DRIVER ? ` • ${unit.DRIVER}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tahunList.length > 0 && (
              <select
                className="filter-select"
                value={filterTahun}
                onChange={e => setFilterTahun(e.target.value)}
                style={{ fontSize: 12, padding: '4px 8px', height: 30 }}
              >
                <option value="">Semua tahun</option>
                {tahunList.map(y => (
                  <option key={y} value={y}>📅 {y}</option>
                ))}
              </select>
            )}
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 12, letterSpacing: '0.05em' }}>
            📋 RIWAYAT PERBAIKAN
          </div>

          {riwayat.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '32px 0', fontSize: 13 }}>
              Belum ada riwayat perbaikan{filterTahun ? ` di tahun ${filterTahun}` : ''} untuk unit ini
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {riwayat.map((r, i) => {
                const status = statusOf(String(r.KETERANGAN || r.KET || ''));
                const biaya  = Number(r.TOTAL_BIAYA || r.BIAYA) || 0;
                return (
                  <div key={r.NO_PO || i} style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                      background: status === 'SELESAI' ? 'var(--green-bg)' : status === 'PROSES' ? 'var(--blue-dim)' : 'var(--amber-bg)',
                    }}>
                      {status === 'SELESAI' ? '✓' : status === 'PROSES' ? '⚙️' : '⏳'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                            {r.BENGKEL || '—'}
                          </div>
                          {r.REASON && (
                            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, fontStyle: 'italic' }}>
                              "{r.REASON}"
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>
                            {formatTgl(r.TGL_MASUK) || '—'}
                          </div>
                          {biaya > 0 && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-t)', marginTop: 2 }}>
                              {fmtRp(biaya)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                        PO #{r.NO_PO} •
                        <span className={`pill pill-${status.toLowerCase()}`} style={{ marginLeft: 6, fontSize: 9, padding: '1px 6px' }}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer summary */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 20px',
          display: 'flex',
          gap: 16,
          justifyContent: 'space-between',
          background: 'var(--surface2)',
          borderRadius: '0 0 var(--radius) var(--radius)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue-t)' }}>{riwayat.length}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 2 }}>
              📄 Total PO{filterTahun ? ` ${filterTahun}` : ''}
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-t)' }}>{fmtRp(totalBiaya)}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 2 }}>
              💰 Total Biaya{filterTahun ? ` ${filterTahun}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
