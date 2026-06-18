import React from 'react';
import { formatTgl, statusOf, fmtRp, fmt } from '../utils/helpers';

export default function POTable({ 
  data, page, totalPages, setPage, 
  search, setSearch, filterStatus, setFilterStatus,
  filterDepo, setFilterDepo, depoList,
  setDetailRow, openEditForm, openHistoryModal,
  onDeleteRow
}) {
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
              <th>Status</th>
              <th>Total Biaya</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>
                  Tidak ada data yang sesuai filter
                </td>
              </tr>
            ) : data.map((r, i) => {
              const ket    = String(r.KETERANGAN || r.KET || '');
              const status = statusOf(ket);
              const biaya  = Number(r.TOTAL_BIAYA || r.BIAYA) || 0;
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