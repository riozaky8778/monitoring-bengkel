import React from 'react';
import { formatTgl, statusOf, fmtRp } from '../utils/helpers';

export default function POTable({ data }) {
  return (
    <div className="table-card" style={{ marginTop: '22px' }}>
      <div className="table-header">
        <div className="table-title-row">
          <div className="table-title">Data Kendaraan</div>
          <span className="table-count">{data.length} hasil</span>
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
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>
                  Tidak ada data
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
                      <span style={{color: 'var(--green-t)', fontWeight: 600}}>{fmtRp(biaya)}</span>
                    ) : (
                      <span style={{ color:'var(--text3)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}