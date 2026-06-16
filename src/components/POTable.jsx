import React from 'react';
import { formatTgl, statusOf, fmtRp } from '../utils/helpers';

export default function POTable({ 
  data, page, totalPages, setPage, 
  search, setSearch, filterStatus, setFilterStatus,
  setDetailRow, openEditForm 
}) {
  return (
    <div className="table-card" style={{ marginTop: '22px' }}>
      <div className="table-header">
        <div className="table-title-row">
          <div className="table-title">Data Kendaraan</div>
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
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No PO</th>
              <th>Nopol</th>
              <th>Driver</th>
              <th>Depo</th>
              <th>Jenis</th>
              <th>Bengkel</th>
              <th>Tgl Masuk</th>
              <th>Tgl Keluar</th>
              <th>Status</th>
              <th>Total Biaya</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>
                  Tidak ada data yang sesuai filter
                </td>
              </tr>
            ) : data.map((r, i) => {
              const ket    = String(r.KETERANGAN||r.KET||'');
              const status = statusOf(ket);
              const biaya  = Number(r.TOTAL_BIAYA||r.BIAYA) || 0;
              return (
                <tr key={r.NO_PO || i}>
                  <td><span className="td-nopo">{r.NO_PO||'—'}</span></td>
                  <td><span className="td-nopol">{r.NOPOL}</span></td>
                  <td>{r.DRIVER}</td>
                  <td>{r.DEPO}</td>
                  <td>{r.JENIS_MOBIL||r.JENIS}</td>
                  <td>{r.BENGKEL}</td>
                  <td style={{ color:'var(--text2)' }}>{formatTgl(r.TGL_MASUK)}</td>
                  <td style={{ color:'var(--text2)' }}>{formatTgl(r.TGL_KELUAR)}</td>
                  <td><span className={`pill pill-${status.toLowerCase()}`}>{status}</span></td>
                  <td>
                    {biaya > 0 ? (
                      <button className="biaya-btn" onClick={() => setDetailRow(r)}>
                        💰 {fmtRp(biaya)}
                      </button>
                    ) : (
                      <span style={{ color:'var(--text3)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => openEditForm(r)} title="Edit PO">✏️ Edit</button>
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
          <button className="page-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>‹ Prev</button>
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>Next ›</button>
        </div>
      </div>
    </div>
  );
}