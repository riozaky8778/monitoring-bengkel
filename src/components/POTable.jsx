import React from 'react';
import { formatTgl, statusOf, fmtRp, fmt } from '../utils/helpers';

export default function POTable({ 
  data, page, totalPages, setPage, 
  search, setSearch, filterStatus, setFilterStatus,
  filterDepo, setFilterDepo, depoList,
  filterTglField, setFilterTglField,
  filterTglFrom,  setFilterTglFrom,
  filterTglTo,    setFilterTglTo,
  setDetailRow, openEditForm, openHistoryModal,
  onDeleteRow
}) {

  // Hitung durasi hari antara TGL_MASUK dan TGL_KELUAR
  function hitungDurasi(tglMasuk, tglKeluar) {
    const tM = new Date(tglMasuk);
    const tK = new Date(tglKeluar);
    if (isNaN(tM) || isNaN(tK)) return null;
    const hari = Math.ceil((tK - tM) / (1000 * 60 * 60 * 24));
    return hari >= 0 ? hari : null;
  }

  const hasFilterTgl = filterTglFrom || filterTglTo;
  return (
    <div className="table-card" style={{ marginTop: '22px' }}>
      <div className="table-header">
        <div className="table-title-row">
          <div className="table-title">Data Perbaikan</div>
          <span className="table-count">{data.length} hasil</span>
        </div>
        <div className="filter-row">
          <div className="filter-wrap">
            <span className="filter-icon">🔍</span>
            <input
              className="filter-input"
              placeholder="Cari nopol / driver..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Semua status</option>
            <option value="SELESAI">Selesai</option>
            <option value="PROSES">Proses</option>
            <option value="PENDING">Pending</option>
          </select>
          <select className="filter-select" value={filterDepo} onChange={e => { setFilterDepo(e.target.value); setPage(1); }}>
            <option value="">Semua depo</option>
            {depoList.map(depo => (
              <option key={depo} value={depo}>{depo}</option>
            ))}
          </select>
        </div>

        {/* ── Filter Tanggal ── */}
        <div className="filter-row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
          <select
            className="filter-select"
            value={filterTglField}
            onChange={e => { setFilterTglField(e.target.value); setPage(1); }}
            style={{ minWidth: 130 }}
          >
            <option value="masuk">Tgl Masuk</option>
            <option value="keluar">Tgl Keluar</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Dari</span>
            <input
              type="date"
              className="filter-input"
              style={{ width: 140, paddingLeft: 10 }}
              value={filterTglFrom}
              onChange={e => { setFilterTglFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Sampai</span>
            <input
              type="date"
              className="filter-input"
              style={{ width: 140, paddingLeft: 10 }}
              value={filterTglTo}
              onChange={e => { setFilterTglTo(e.target.value); setPage(1); }}
            />
          </div>
          {hasFilterTgl && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => { setFilterTglFrom(''); setFilterTglTo(''); setPage(1); }}
              style={{ color: 'var(--red-t)' }}
            >
              ✕ Reset Tanggal
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PO & Tgl</th>
              <th>Kendaraan</th>
              <th>Driver & Depo</th>
              <th>Bengkel & Keluhan</th>
              <th>Jadwal Bengkel</th>
              <th>Durasi</th>
              <th>Status</th>
              <th>Total Biaya</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>
                  Tidak ada data yang sesuai filter
                </td>
              </tr>
            ) : data.map((r, i) => {
              const ket    = String(r.KETERANGAN || r.KET || '');
              const status = statusOf(ket);
              const biaya  = Number(r.TOTAL_BIAYA || r.BIAYA) || 0;
              const durasi = hitungDurasi(r.TGL_MASUK, r.TGL_KELUAR);
              return (
                <tr key={r.NO_PO || i} style={{ verticalAlign: 'middle' }}>

                  <td>
                    <div className="td-nopo">{r.NO_PO || '—'}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: 3 }}>
                      {formatTgl(r.TGL_PENGAJUAN)}
                    </div>
                  </td>

                  <td>
                    <div className="td-nopol">{r.NOPOL}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: 3 }}>
                      {r.KM ? `${fmt(r.KM)} KM` : '—'} • {r.JENIS_MOBIL || r.JENIS || '—'}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.DRIVER || '—'}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: 3 }}>{r.DEPO || '—'}</div>
                  </td>

                  <td style={{ whiteSpace: 'normal', minWidth: '180px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--blue-t)' }}>{r.BENGKEL}</div>
                    {r.REASON && (
                      <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: 4, fontStyle: 'italic', lineHeight: '1.4' }}>
                        💬 "{r.REASON}"
                      </div>
                    )}
                  </td>

                  <td>
                    <div style={{ fontSize: '11.5px', color: 'var(--text2)' }}>
                      <span style={{ color: 'var(--blue-t)', fontWeight: 700, marginRight: 5 }}>In:</span>{formatTgl(r.TGL_MASUK)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: 3 }}>
                      <span style={{ fontWeight: 600, marginRight: 5 }}>Out:</span>{formatTgl(r.TGL_KELUAR)}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {durasi !== null ? (
                      <div style={{
                        display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                        background: durasi > 7 ? 'var(--red-dim)' : durasi > 3 ? 'var(--amber-bg)' : 'var(--green-bg)',
                        color:      durasi > 7 ? 'var(--red-t)'  : durasi > 3 ? 'var(--amber-t)'  : 'var(--green-t)',
                        borderRadius: 'var(--radius-sm)', padding: '3px 10px', minWidth: 46,
                      }}>
                        <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>{durasi}</span>
                        <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.85 }}>hari</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                    )}
                  </td>

                  <td>
                    <span className={`pill pill-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>

                  <td>
                    {biaya > 0 ? (
                      <button className="biaya-btn" onClick={() => setDetailRow(r)}>
                        💰 {fmtRp(biaya)}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>—</span>
                    )}
                  </td>

                  {/* Aksi — Edit + Riwayat + Hapus */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => openEditForm(r)} title="Edit PO">
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => openHistoryModal(r)}
                        title="Riwayat status"
                        style={{ color: 'var(--text3)' }}
                      >
                        🕐
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => onDeleteRow(r)}
                        title="Hapus data"
                        style={{ color: 'var(--red-t)' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Halaman {page} dari {totalPages}</span>
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</button>
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ›</button>
        </div>
      </div>
    </div>
  );
}