import React, { useState, useEffect } from 'react';
import { apiFetch, apiPost, IS_DEMO } from '../services/api';
import { toDateInput, fmtRp } from '../utils/helpers';

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

  // State untuk Detail Biaya (Jasa / Sparepart)
  const [items, setItems] = useState([EMPTY_ITEM()]);
  const [loadingItems, setLoadingItems] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    if (IS_DEMO) { setItems([EMPTY_ITEM()]); setLoadingItems(false); return; }
    
    // Ambil detail data jika sedang mode Edit
    apiFetch({ action:'getDetail', no_po:editRow.NO_PO })
      .then(d => {
        const loaded = (d.items||[]).map(i => ({ TIPE:i.TIPE, NAMA:i.NAMA, QTY:i.QTY, HARGA:i.HARGA }));
        setItems(loaded.length ? loaded : [EMPTY_ITEM()]);
        setLoadingItems(false);
      })
      .catch(() => { setItems([EMPTY_ITEM()]); setLoadingItems(false); });
  }, [isEdit, editRow]);

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

  // Fungsi untuk item list
  const addItem    = () => setItems(it => [...it, EMPTY_ITEM()]);
  const removeItem = i  => setItems(it => it.filter((_,j) => j !== i));
  const setItem    = (i, k, v) => setItems(it => it.map((row,j) => j===i ? { ...row, [k]:v } : row));
  const totalItems = items.reduce((s,i) => s + (Number(i.QTY)||0)*(Number(i.HARGA)||0), 0);

  const save = async () => {
    if (!po.NO_PO || !po.NOPOL) return alert("No PO dan Nopol wajib diisi!");
    setSaving(true);
    try {
      const payload = { action: isEdit ? 'updatePO' : 'savePO', po, items: items.filter(i => i.NAMA.trim()) };
      if (IS_DEMO) {
        setTimeout(() => { alert("Demo: PO Tersimpan!"); onSaved(); }, 500);
        return;
      }
      await apiPost(payload);
      onSaved();
    } catch(e) { 
      alert('Error: ' + e.message); 
    } finally {
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
          {/* Data Kendaraan */}
          <div className="form-section-label">🚛 Data Kendaraan</div>
          <div className="form-grid">
            {field('NO_PO', 'No PO', { required:true })}
            {field('NOPOL', 'Nopol', { required:true, placeholder:'BM 1234 QM' })}
            {field('DRIVER', 'Driver')}
            
            {/* Dropdown Depo */}
            <div className="form-group">
              <label className="form-label">Depo</label>
              <select className="form-input" value={po.DEPO || ''} onChange={e => setPo(p => ({ ...p, DEPO: e.target.value }))}>
                <option value="">-- Pilih Depo --</option>
                <option value="PALAS">PALAS</option>
                <option value="AIR HITAM">AIR HITAM</option>
                <option value="PASIR PUTIH">PASIR PUTIH</option>
                <option value="HANGTUAH">HANGTUAH</option>
                <option value="KERINCI">KERINCI</option>
                <option value="AIR MOLEK">AIR MOLEK</option>
                <option value="TALUK KUANTAN">TALUK KUANTAN</option>
                <option value="UJUNG BATU">UJUNG BATU</option>
                <option value="SIAK">SIAK</option>
                <option value="DUMAI">DUMAI</option>
                <option value="DURI">DURI</option>
                <option value="BAGAN BATU">BAGAN BATU</option>
                <option value="HO">HO</option>
              </select>
            </div>

            {field('TGL_PENGAJUAN', 'Tgl Pengajuan', { type:'date' })}
            {field('JENIS_MOBIL', 'Jenis Mobil')}
            {field('KM', 'KM', { type:'number', placeholder:'150000' })}
            {field('REASON', 'Keluhan / Reason', { full:true })}
          </div>

          {/* Data Bengkel */}
          <div className="form-section-label">🏪 Data Bengkel</div>
          <div className="form-grid">
            {field('BENGKEL', 'Bengkel', { required:true })}
            
            {/* Dropdown Status */}
            <div className="form-group">
              <label className="form-label">Status<span className="form-required"> *</span></label>
              <select className="form-input" value={po.KETERANGAN || ''} onChange={e => setPo(p => ({ ...p, KETERANGAN: e.target.value }))}>
                <option value="">-- Pilih Status --</option>
                <option value="PENDING">⏳ Menunggu</option>
                <option value="PROSES PERBAIKAN">🔧 Dalam Proses</option>
                <option value="MENUNGGU SPAREPART">📦 Menunggu Sparepart</option>
                <option value="SELESAI">✅ Selesai</option>
              </select>
            </div>

            {field('TGL_MASUK', 'Tgl Masuk', { type:'date' })}
            {field('TGL_KELUAR', 'Tgl Keluar', { type:'date' })}
          </div>

          {/* Detail Biaya (Jasa & Sparepart) */}
          <div className="items-section">
            <div className="items-header">
              <div className="items-title">📋 Detail Biaya</div>
              <button className="btn btn-sm" onClick={addItem}>+ Tambah Item</button>
            </div>

            {loadingItems ? (
              <div style={{ textAlign:'center', padding:20 }}><div className="spinner" style={{ margin:'auto' }} /></div>
            ) : (
              <>
                <div className="item-row" style={{ marginBottom:4 }}>
                  {['Tipe','Nama Item','Qty','Harga',''].map((h,i) => (
                    <div key={i} style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</div>
                  ))}
                </div>
                {items.map((item,i) => (
                  <div className="item-row" key={i}>
                    <select className="form-input" value={item.TIPE} onChange={e => setItem(i, 'TIPE', e.target.value)}>
                      <option value="JASA">JASA</option>
                      <option value="SPAREPART">SPAREPART</option>
                    </select>
                    <input className="form-input" value={item.NAMA} onChange={e => setItem(i,'NAMA',e.target.value)} placeholder="Nama item / pekerjaan" />
                    <input className="form-input" type="number" min={1} value={item.QTY} onChange={e => setItem(i,'QTY',e.target.value)} />
                    <input className="form-input" type="number" min={0} value={item.HARGA} onChange={e => setItem(i,'HARGA',e.target.value)} placeholder="0" />
                    <button className="btn-icon" style={{ background:'none', borderColor:'transparent', color:'var(--red-t)', fontSize:16 }} onClick={() => removeItem(i)} disabled={items.length === 1}>×</button>
                  </div>
                ))}
                <div className="items-total">
                  <span className="label">Total Biaya:</span>
                  <strong style={{ fontSize:16, color:'var(--green-t)' }}>{fmtRp(totalItems)}</strong>
                </div>
              </>
            )}
          </div>
          
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? '⏳ Menyimpan…' : (isEdit ? '💾 Simpan Perubahan' : '💾 Simpan PO')}
          </button>
        </div>
      </div>
    </div>
  );
}