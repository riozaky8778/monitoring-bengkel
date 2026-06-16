import React, { useState } from 'react';
import { apiPost, IS_DEMO } from '../services/api';
import { toDateInput } from '../utils/helpers';

const EMPTY_ITEM = () => ({ TIPE:'JASA', NAMA:'', QTY:1, HARGA:0 });
const EMPTY_PO   = () => ({
  NO_PO:'', NOPOL:'', DRIVER:'', DEPO:'', TGL_PENGAJUAN:'',
  JENIS_MOBIL:'', KM:'', REASON:'', BENGKEL:'',
  TGL_MASUK:'', TGL_KELUAR:'', KETERANGAN:'',
});

export default function POForm({ editRow, onClose, onSaved }) {
  const isEdit = !!editRow;
  const [po, setPo] = useState(isEdit ? {
    ...EMPTY_PO(), ...editRow,
    TGL_PENGAJUAN: toDateInput(editRow.TGL_PENGAJUAN),
    TGL_MASUK: toDateInput(editRow.TGL_MASUK),
    TGL_KELUAR: toDateInput(editRow.TGL_KELUAR),
  } : EMPTY_PO());

  const [saving, setSaving] = useState(false);

  const field = (key, label, opts = {}) => {
    const { type='text', required=false, placeholder='' } = opts;
    return (
      <div className={`form-group${opts.full ? ' full' : ''}`}>
        <label className="form-label">{label}{required && <span className="form-required"> *</span>}</label>
        <input
          type={type} className="form-input" value={po[key] || ''}
          onChange={e => setPo(p => ({ ...p, [key]: e.target.value }))}
          disabled={isEdit && key === 'NO_PO'} placeholder={placeholder}
        />
      </div>
    );
  };

  const save = async () => {
    if (!po.NO_PO || !po.NOPOL) return alert("No PO dan Nopol wajib diisi!");
    setSaving(true);
    try {
      if (IS_DEMO) {
        setTimeout(() => { alert("Demo: Tersimpan!"); onSaved(); }, 500);
        return;
      }
      await apiPost({ action: isEdit ? 'updatePO' : 'savePO', po, items: [] });
      onSaved();
    } catch(e) { 
      alert('Error: ' + e.message); 
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:760 }}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? `✏️ Edit PO ${editRow.NO_PO}` : '➕ Input PO Baru'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-section-label">🚛 Data Kendaraan</div>
          <div className="form-grid">
            {field('NO_PO', 'No PO', { required:true })}
            {field('NOPOL', 'Nopol', { required:true, placeholder:'BM 1234 QM' })}
            {field('DRIVER', 'Driver')}
            {field('DEPO', 'Depo')}
            {field('JENIS_MOBIL', 'Jenis Mobil')}
            {field('REASON', 'Keluhan', { full:true })}
          </div>
          <div className="form-section-label">🏪 Data Bengkel</div>
          <div className="form-grid">
            {field('BENGKEL', 'Bengkel')}
            {field('KETERANGAN', 'Status', { placeholder:'SELESAI / PROSES' })}
            {field('TGL_MASUK', 'Tgl Masuk', { type:'date' })}
            {field('TGL_KELUAR', 'Tgl Keluar', { type:'date' })}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? '⏳ Menyimpan…' : '💾 Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}