import React, { useState, useEffect } from 'react';
import { IS_DEMO, apiFetch } from '../services/api';
import { formatTgl, fmtRp, statusOf, fmt } from '../utils/helpers';

export default function DetailBiaya({ row, onClose }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!row) return;
    if (IS_DEMO) {
      setItems([
        { TIPE:'JASA',      NAMA:'GANTI DRAGLINK', QTY:1, HARGA:180000, SUBTOTAL:180000 },
        { TIPE:'SPAREPART', NAMA:'GANTI KIT PEDAL REM', QTY:1, HARGA:250000, SUBTOTAL:250000 },
        { TIPE:'SPAREPART', NAMA:'PERBAIKAN KABEL LAMPU BAK', QTY:2, HARGA:75000, SUBTOTAL:150000 },
        { TIPE:'JASA',      NAMA:'ONGKOS LAS TAPAK ENGSEL PINTU KANAN KIRI', QTY:1, HARGA:320000, SUBTOTAL:320000 },
      ]);
      setLoading(false);
      return;
    }
    apiFetch({ action:'getDetail', no_po:row.NO_PO })
      .then(d => { setItems(d.items||[]); setLoading(false); })
      .catch(()  => { setItems([]);      setLoading(false); });
  }, [row]);

  if (!row) return null;
  const status         = statusOf(row.KETERANGAN || row.KET || '');
  const totalJasa      = (items||[]).filter(i=>i.TIPE==='JASA').reduce((s,i)=>s+i.SUBTOTAL,0);
  const totalSparepart = (items||[]).filter(i=>i.TIPE==='SPAREPART').reduce((s,i)=>s+i.SUBTOTAL,0);
  const totalAll       = totalJasa + totalSparepart;

  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:680 }}>
        <div className="modal-header">
          <div className="modal-title">🧾 Detail Biaya — PO {row.NO_PO}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-summary">
            <div className="detail-kv"><div className="detail-kv-label">Tgl Pengajuan</div><div className="detail-kv-val">{formatTgl(row.TGL_PENGAJUAN)}</div></div>
            <div className="detail-kv"><div className="detail-kv-label">Nopol</div><div className="detail-kv-val">{row.NOPOL || '—'}</div></div>
            <div className="detail-kv"><div className="detail-kv-label">KM</div><div className="detail-kv-val">{row.KM ? fmt(row.KM) : '—'}</div></div>
            <div className="detail-kv"><div className="detail-kv-label">Driver</div><div className="detail-kv-val">{row.DRIVER || '—'}</div></div>
            <div className="detail-kv"><div className="detail-kv-label">Bengkel</div><div className="detail-kv-val">{row.BENGKEL || '—'}</div></div>
            <div className="detail-kv"><div className="detail-kv-label">Status</div><div className="detail-kv-val"><span className={`pill pill-${status.toLowerCase()}`}>{status}</span></div></div>
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:32 }}><div className="spinner" /></div>
          ) : items && items.length > 0 ? (
            <div className="table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th style={{ width:30 }}>#</th>
                    <th style={{ width:100 }}>Tipe</th>
                    <th>Nama Item</th>
                    <th style={{ width:50, textAlign:'right' }}>Qty</th>
                    <th style={{ width:120, textAlign:'right' }}>Harga</th>
                    <th style={{ width:130, textAlign:'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item,i) => (
                    <tr key={i}>
                      <td style={{ color:'var(--text3)' }}>{i+1}</td>
                      <td><span className={`pill-tipe ${item.TIPE==='JASA'?'tipe-jasa':'tipe-sparepart'}`}>{item.TIPE}</span></td>
                      <td style={{ maxWidth:220 }}>{item.NAMA}</td>
                      <td style={{ textAlign:'right' }}>{item.QTY}</td>
                      <td style={{ textAlign:'right' }}>{fmtRp(item.HARGA)}</td>
                      <td style={{ textAlign:'right', fontWeight:600 }}>{fmtRp(item.SUBTOTAL)}</td>
                    </tr>
                  ))}
                  <tr style={{ background:'var(--surface2)' }}>
                    <td colSpan={5} style={{ textAlign:'right', fontWeight:500, fontSize:11, color:'var(--text2)' }}>Subtotal Jasa</td>
                    <td style={{ textAlign:'right', fontWeight:600 }}>{fmtRp(totalJasa)}</td>
                  </tr>
                  <tr style={{ background:'var(--surface2)' }}>
                    <td colSpan={5} style={{ textAlign:'right', fontWeight:500, fontSize:11, color:'var(--text2)' }}>Subtotal Sparepart</td>
                    <td style={{ textAlign:'right', fontWeight:600 }}>{fmtRp(totalSparepart)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan={5} style={{ textAlign:'right' }}>TOTAL BIAYA</td>
                    <td style={{ textAlign:'right', color:'var(--green-t)' }}>{fmtRp(totalAll)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:28, color:'var(--text3)', fontSize:13 }}>
              Belum ada item biaya tercatat untuk PO ini.
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