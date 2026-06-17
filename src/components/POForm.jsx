import React, { useState, useEffect } from 'react';
import { apiPost, apiFetch, IS_DEMO } from '../services/api';
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
    NO_PO:         String(editRow.NO_PO || ''),
    TGL_PENGAJUAN: toDateInput(editRow.TGL_PENGAJUAN),
    TGL_MASUK:     toDateInput(editRow.TGL_MASUK),
    TGL_KELUAR:    toDateInput(editRow.TGL_KELUAR),
  } : EMPTY_PO());

  const [items, setItems]             = useState([EMPTY_ITEM()]);
  const [loadingItems, setLoadingItems] = useState(isEdit);
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState({});

  // Load item detail saat edit
  useEffect(() => {
    if (!isEdit) return;
    if (IS_DEMO) { setItems([EMPTY_ITEM()]); setLoadingItems(false); return; }
    apiFetch({ action: 'getDetail', no_po: editRow.NO_PO })
      .then(d => {
        const loaded = (d.items || []).map(i => ({ TIPE: i.TIPE, NAMA: i.NAMA, QTY: i.QTY, HARGA: i.HARGA }));
        setItems(loaded.length ? loaded : [EMPTY_ITEM()]);
      })
      .catch(() => setItems([EMPTY_ITEM()]))
      .finally(() => setLoadingItems(false));
  }, []);

  const addItem    = () => setItems(it => [...it, EMPTY_ITEM()]);
  const removeItem = i  => setItems(it => it.filter((_, j) => j !== i));
  const setItem    = (i, k, v) => setItems(it => it.map((row, j) => j === i ? { ...row, [k]: v } : row));

  const totalItems = items.reduce((s, i) => s + (Number(i.QTY) || 0) * (Number(i.HARGA) || 0), 0);

  const field = (key, label, opts = {}) => {
    const { type='text', required=false, placeholder='' } = opts;
    return (
      <div className={`form-group${opts.full ? ' full' : ''}`}>
        <label className="form-label">
          {label}{required && <span className="form-required"> *</span>}
        </label>
        <input
          type={type}
          className={`form-input${errors[key] ? ' error' : ''}`}
          value={po[key] || ''}
          onChange={e => { setPo(p => ({ ...p, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
          disabled={isEdit && key === 'NO_PO'}
          placeholder={placeholder}
        />
        {errors[key] && <div className="form-err">{errors[key]}</div>}
      </div>
    );
  };

  const validate = () => {
    const errs = {};
    if (!String(po.NO_PO   || '').trim()) errs.NO_PO   = 'Wajib diisi';
    if (!String(po.NOPOL   || '').trim()) errs.NOPOL   = 'Wajib diisi';
    if (!String(po.BENGKEL || '').trim()) errs.BENGKEL = 'Wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 600));
        onSaved();
        return;
      }
      const res = await apiPost({
        action: isEdit ? 'updatePO' : 'savePO',
        po,
        items: items.filter(i => String(i.NAMA).trim()),
      });
      if (res.error) { alert('❌ ' + res.error); setSaving(false); return; }
      onSaved();
    } catch(e) {
      alert('Error: ' + e.message);
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? `✏️ Edit PO ${editRow.NO_PO}` : '➕ Input PO Baru'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* ── Data Kendaraan ── */}
          <div className="form-section-label">🚛 Data Kendaraan</div>
          <div className="form-grid">
            {field('NO_PO',       'No PO',      { required: true })}
            {field('NOPOL',       'Nopol',      { required: true, placeholder: 'BM 1234 QM' })}
            {field('DRIVER',      'Driver')}
            {field('DEPO',        'Depo')}
            {field('JENIS_MOBIL', 'Jenis Mobil')}
            {field('KM',          'KM',         { type: 'number', placeholder: '150000' })}
            {field('TGL_PENGAJUAN','Tgl Pengajuan', { type: 'date' })}
            {field('REASON',      'Keluhan',    { full: true })}
          </div>

          {/* ── Data Bengkel ── */}
          <div className="form-section-label">🏪 Data Bengkel</div>
          <div className="form-grid">
            {field('BENGKEL',     'Bengkel',    { required: true })}
            {field('KETERANGAN',  'Status',     { placeholder: 'SELESAI / PROSES' })}
            {field('TGL_MASUK',   'Tgl Masuk',  { type: 'date' })}
            {field('TGL_KELUAR',  'Tgl Keluar', { type: 'date' })}
          </div>

          {/* ── Detail Biaya ── */}
          <div className="items-section">
            <div className="items-header">
              <div className="items-title">📋 Detail Biaya</div>
              <button className="btn btn-sm" onClick={addItem}>+ Tambah Item</button>
            </div>

            {loadingItems ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div className="spinner" style={{ margin: 'auto' }} />
              </div>
            ) : (
              <>
                {/* Header kolom */}
                <div className="item-row" style={{ marginBottom: 4 }}>
                  {['Tipe','Nama Item','Qty','Harga',''].map((h, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                  ))}
                </div>

                {items.map((item, i) => (
                  <div className="item-row" key={i}>
                    <select
                      className="form-input"
                      value={item.TIPE}
                      onChange={e => setItem(i, 'TIPE', e.target.value)}
                    >
                      <option value="JASA">JASA</option>
                      <option value="SPAREPART">SPAREPART</option>
                    </select>
                    <input
                      className="form-input"
                      value={item.NAMA}
                      onChange={e => setItem(i, 'NAMA', e.target.value)}
                      placeholder="Nama item / pekerjaan"
                    />
                    <input
                      className="form-input"
                      type="number" min={1}
                      value={item.QTY}
                      onChange={e => setItem(i, 'QTY', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number" min={0}
                      value={item.HARGA}
                      onChange={e => setItem(i, 'HARGA', e.target.value)}
                      placeholder="0"
                    />
                    <button
                      className="btn btn-sm"
                      style={{ padding: '4px 7px', color: 'var(--red-t)', borderColor: 'transparent', background: 'none' }}
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                    >×</button>
                  </div>
                ))}

                <div className="items-total">
                  <span className="label">Total Biaya:</span>
                  <strong style={{ fontSize: 15, color: 'var(--green-t)' }}>{fmtRp(totalItems)}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? '⏳ Menyimpan…' : isEdit ? '💾 Simpan Perubahan' : '💾 Simpan PO'}
          </button>
        </div>
      </div>
    </div>
  );
}
