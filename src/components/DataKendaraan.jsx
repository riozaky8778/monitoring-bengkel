import React, { useState, useMemo } from 'react';
import { formatTgl, statusOf, fmtRp } from '../utils/helpers';

const PAGE_SIZE = 15;

const SUMBER_BADGE = {
  SECONDARY:  { cls: 'badge-blue',  label: 'Secondary'  },
  PRIMARY:    { cls: 'badge-green', label: 'Primary'    },
  INVENTARIS: { cls: 'badge-amber', label: 'Inventaris' },
};

// ── Modal Riwayat Perbaikan ───────────────────────────────────
function RiwayatModal({ unit, poData, onClose }) {
  const allRiwayat = useMemo(() => {
    return (poData || [])
      .filter(r => String(r.NOPOL || '').trim() === String(unit.NOPOL || '').trim())
      .sort((a, b) => new Date(b.TGL_MASUK) - new Date(a.TGL_MASUK));
  }, [poData, unit]);

  // Daftar tahun yang tersedia dari data
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
              🚗 {unit.NOPOL} — {unit.MERK} {unit.TYPE}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              {unit.DEPO} • {unit.DIVISI} {unit.DRIVER ? `• ${unit.DRIVER}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Filter tahun */}
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

        {/* Body — scrollable */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 12, letterSpacing: '0.05em' }}>
            📋 RIWAYAT PERBAIKAN
          </div>

          {riwayat.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '32px 0', fontSize: 13 }}>
              Belum ada riwayat perbaikan untuk unit ini
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
                    {/* Icon status */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                      background: status === 'SELESAI' ? 'var(--green-bg)' : status === 'PROSES' ? 'var(--blue-dim)' : 'var(--amber-bg)',
                    }}>
                      {status === 'SELESAI' ? '✓' : status === 'PROSES' ? '⚙️' : '⏳'}
                    </div>

                    {/* Info */}
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

        {/* Footer — summary */}
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

// ── Komponen Utama ────────────────────────────────────────────
export default function DataKendaraan({ data = [], loading, poData = [] }) {
  const [search,    setSearch]    = useState('');
  const [fArmada,   setFArmada]   = useState('');
  const [fDivisi,   setFDivisi]   = useState('');
  const [fSumber,   setFSumber]   = useState('');
  const [page,      setPage]      = useState(1);
  const [detailUnit, setDetailUnit] = useState(null); // ← state modal

  const armadaOpts = useMemo(() => [...new Set(data.map(r => r.JENIS_ARMADA).filter(Boolean))].sort(), [data]);
  const divisiOpts = useMemo(() => [...new Set(data.map(r => r.DIVISI).filter(Boolean))].sort(), [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter(r => {
      if (fArmada && r.JENIS_ARMADA !== fArmada) return false;
      if (fDivisi && r.DIVISI !== fDivisi)         return false;
      if (fSumber && r.SUMBER  !== fSumber)         return false;
      if (q && ![r.NOPOL, r.MERK, r.TYPE, r.DRIVER, r.DEPO]
              .some(v => String(v||'').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data, search, fArmada, fDivisi, fSumber]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cSec = filtered.filter(r => r.SUMBER === 'SECONDARY').length;
  const cPri = filtered.filter(r => r.SUMBER === 'PRIMARY').length;
  const cInv = filtered.filter(r => r.SUMBER === 'INVENTARIS').length;

  function reset() {
    setSearch(''); setFArmada(''); setFDivisi(''); setFSumber(''); setPage(1);
  }

  function exportXls() {
    const headers = ['No','Nopol','Merk','Type','Jenis Armada','Depo','Divisi','Driver','Tahun','Sumber'];
    const rows = filtered.map((r, i) => [
      i + 1, r.NOPOL, r.MERK, r.TYPE, r.JENIS_ARMADA, r.DEPO, r.DIVISI, r.DRIVER, r.TAHUN, r.SUMBER
    ]);
    const tsv = [headers, ...rows].map(r => r.join('\t')).join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data_kendaraan.xls';
    a.click();
  }

  const StatPill = ({ label, value, accent }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '6px 14px',
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: accent }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{label}</span>
    </div>
  );

  return (
    <div className="content">

      {/* Modal riwayat */}
      {detailUnit && (
        <RiwayatModal
          unit={detailUnit}
          poData={poData}
          onClose={() => setDetailUnit(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Data Kendaraan</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
          Semua unit dari sheet Secondary, Primary &amp; Inventaris
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatPill label="Total Unit"   value={filtered.length} accent="var(--text)" />
        <StatPill label="Secondary"    value={cSec}            accent="var(--blue-t)" />
        <StatPill label="Primary"      value={cPri}            accent="var(--green-t)" />
        <StatPill label="Inventaris"   value={cInv}            accent="var(--amber-t)" />
      </div>

      {/* Table card */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title-row">
            <div className="table-title">Daftar Unit</div>
            <span className="table-count">{filtered.length} unit</span>
          </div>
          <div className="filter-row">
            <div className="filter-wrap">
              <span className="filter-icon">🔍</span>
              <input
                className="filter-input"
                placeholder="Cari nopol, merk, driver..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="filter-select" value={fArmada} onChange={e => { setFArmada(e.target.value); setPage(1); }}>
              <option value="">Semua Jenis Armada</option>
              {armadaOpts.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="filter-select" value={fDivisi} onChange={e => { setFDivisi(e.target.value); setPage(1); }}>
              <option value="">Semua Divisi / Brand</option>
              {divisiOpts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="filter-select" value={fSumber} onChange={e => { setFSumber(e.target.value); setPage(1); }}>
              <option value="">Semua Sumber</option>
              <option value="SECONDARY">Secondary</option>
              <option value="PRIMARY">Primary</option>
              <option value="INVENTARIS">Inventaris</option>
            </select>
            {(search || fArmada || fDivisi || fSumber) && (
              <button className="btn btn-sm btn-ghost" onClick={reset}>✕ Reset</button>
            )}
            <button className="btn btn-sm" onClick={exportXls} title="Export ke Excel">
              ⬇ Excel
            </button>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" />
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nopol</th>
                  <th>Merk</th>
                  <th>Type</th>
                  <th>Depo</th>
                  <th>Divisi</th>
                  <th>Driver</th>
                  <th>Tahun</th>
                  <th>Sumber</th>
                  <th style={{ textAlign: 'center' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>
                      Tidak ada unit yang sesuai filter
                    </td>
                  </tr>
                ) : paged.map((r, i) => {
                  const sb = SUMBER_BADGE[r.SUMBER] || { cls: '', label: r.SUMBER };
                  const jumlahPO = (poData || []).filter(p =>
                    String(p.NOPOL || '').trim() === String(r.NOPOL || '').trim()
                  ).length;
                  return (
                    <tr key={r.NOPOL + i} style={{ verticalAlign: 'middle' }}>
                      <td style={{ color: 'var(--text3)', fontSize: 11 }}>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td>
                        <span className="td-nopol">{r.NOPOL || '—'}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.MERK || '—'}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{r.TYPE || '—'}</td>
                      <td>{r.DEPO || '—'}</td>
                      <td>{r.DIVISI || '—'}</td>
                      <td style={{ color: r.DRIVER ? 'var(--text)' : 'var(--text3)' }}>
                        {r.DRIVER || '—'}
                      </td>
                      <td style={{ color: 'var(--text2)' }}>{r.TAHUN || '—'}</td>
                      <td>
                        <span className={`badge ${sb.cls}`}>{sb.label}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => setDetailUnit(r)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          👁️ Detail
                          {jumlahPO > 0 && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 5px',
                              borderRadius: 999, background: 'var(--blue-dim)',
                              color: 'var(--blue-t)', marginLeft: 2,
                            }}>
                              {jumlahPO}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer pagination */}
        <div className="table-footer">
          <span>
            {filtered.length > 0
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} dari ${filtered.length} unit`
              : '0 unit'}
          </span>
          {totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', gap: 4 }}>
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '…'
                    ? <span key={`e${idx}`} style={{ padding: '5px 6px', color: 'var(--text3)' }}>…</span>
                    : <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                )}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}