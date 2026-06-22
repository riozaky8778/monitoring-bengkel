import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiPost, apiFetch, IS_DEMO, demoKendaraan } from '../services/api';
import { toDateInput, fmtRp } from '../utils/helpers';

const EMPTY_ITEM = () => ({ TIPE: 'JASA', NAMA: '', QTY: 1, HARGA: 0 });
const EMPTY_PO   = () => ({
  NO_PO: '', NOPOL: '', DRIVER: '', DEPO: '', DIVISI: '', TGL_PENGAJUAN: '',
  JENIS_MOBIL: '', KM: '', REASON: '', BENGKEL: '',
  TGL_MASUK: '', TGL_KELUAR: '', KETERANGAN: '',
});

// ── Searchable Nopol Dropdown ─────────────────────────────────
function NopolSearch({ value, onChange, kendaraanList, disabled }) {
  const [query,    setQuery]    = useState(value || '');
  const [open,     setOpen]     = useState(false);
  const [focused,  setFocused]  = useState(false);
  const wrapRef = useRef(null);

  // sync jika value berubah dari luar (edit mode)
  useEffect(() => { setQuery(value || ''); }, [value]);

  // klik di luar → tutup
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim().length === 0
    ? kendaraanList.slice(0, 50)
    : kendaraanList.filter(k =>
        k.NOPOL.toLowerCase().includes(query.toLowerCase()) ||
        (k.DRIVER || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30);

  const select = (k) => {
    setQuery(k.NOPOL);
    setOpen(false);
    onChange(k); // kirim seluruh objek kendaraan ke parent
  };

  const sumberColor = (s) => {
    if (s === 'PRIMARY')    return { bg: '#dbeafe', color: '#1d4ed8' };
    if (s === 'SECONDARY')  return { bg: '#dcfce7', color: '#15803d' };
    return { bg: '#fef3c7', color: '#b45309' };
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className="form-input"
        placeholder="Ketik plat / nama driver..."
        value={query}
        disabled={disabled}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(null); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => setFocused(false)}
        autoComplete="off"
      />
      {/* indikator loading / count */}
      <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'var(--text3)', pointerEvents:'none' }}>
        {query.trim() ? `${filtered.length} hasil` : `${kendaraanList.length} unit`}
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
          zIndex: 200, maxHeight: 260, overflowY: 'auto',
        }}>
          {filtered.map((k, i) => {
            const sc = sumberColor(k.SUMBER);
            return (
              <div
                key={k.NOPOL + i}
                onMouseDown={() => select(k)}
                style={{
                  padding: '9px 13px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* kiri: plat + type */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--blue)', letterSpacing: '0.2px' }}>{k.NOPOL}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {k.MERK} {k.TYPE}
                    {k.DRIVER && <span style={{ marginLeft: 6, color: 'var(--text2)' }}>· {k.DRIVER}</span>}
                  </div>
                </div>
                {/* kanan: depo + sumber */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {k.DEPO && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{k.DEPO}</div>}
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px',
                    borderRadius: 4, textTransform: 'uppercase',
                    background: sc.bg, color: sc.color, marginTop: 3, display: 'inline-block',
                  }}>{k.SUMBER}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── POForm utama ──────────────────────────────────────────────
export default function POForm({ editRow, onClose, onSaved, existingNoPo = [] }) {
  const isEdit = !!editRow;

  const [po, setPo] = useState(isEdit ? {
    ...EMPTY_PO(), ...editRow,
    NO_PO:         String(editRow.NO_PO || ''),
    TGL_PENGAJUAN: toDateInput(editRow.TGL_PENGAJUAN),
    TGL_MASUK:     toDateInput(editRow.TGL_MASUK),
    TGL_KELUAR:    toDateInput(editRow.TGL_KELUAR),
  } : EMPTY_PO());

  const [items,        setItems]        = useState([EMPTY_ITEM()]);
  const [loadingItems, setLoadingItems] = useState(isEdit);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});
  const [autoFilled,   setAutoFilled]   = useState({ DRIVER: false, DEPO: false, JENIS_MOBIL: false });

// ← TAMBAHKAN INI
const isDuplicateNoPo = !isEdit && po.NO_PO.trim() !== '' &&
  existingNoPo.includes(po.NO_PO.trim());

  // master kendaraan
  const [kendaraanList,    setKendaraanList]    = useState([]);
  const [loadingKendaraan, setLoadingKendaraan] = useState(true);

  // fetch master kendaraan sekali saat mount
  useEffect(() => {
    if (IS_DEMO) {
      setKendaraanList(demoKendaraan());
      setLoadingKendaraan(false);
      return;
    }
    apiFetch({ action: 'getKendaraan' })
      .then(d => setKendaraanList(d.data || d.kendaraan || []))
      .catch(() => setKendaraanList([]))
      .finally(() => setLoadingKendaraan(false));
  }, []);

  // fetch detail items saat edit
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
  }, [isEdit, editRow]);

  // ── handler saat nopol dipilih → auto-fill ──────────────────
  const handleNopolSelect = useCallback((kendaraan) => {
    if (!kendaraan) return;
    setPo(p => ({
      ...p,
      NOPOL:       kendaraan.NOPOL,
      JENIS_MOBIL: kendaraan.TYPE || kendaraan.JENIS_ARMADA || p.JENIS_MOBIL,
      DRIVER:      kendaraan.DRIVER || '',
      DEPO:        kendaraan.DEPO   || '',
      DIVISI:      kendaraan.DIVISI || p.DIVISI,
    }));
    // tandai field mana yang benar-benar dari master
    setAutoFilled({
      DRIVER:      !!kendaraan.DRIVER,
      DEPO:        !!kendaraan.DEPO,
      JENIS_MOBIL: !!(kendaraan.TYPE || kendaraan.JENIS_ARMADA),
    });
    setErrors(er => ({ ...er, NOPOL: '' }));
  }, []);

  const handleNopolChange = useCallback((kendaraan) => {
    // dipanggil juga saat onChange tanpa select (ketik manual)
    handleNopolSelect(kendaraan);
  }, [handleNopolSelect]);

  // ── item helpers ─────────────────────────────────────────────
  const addItem    = () => setItems(it => [...it, EMPTY_ITEM()]);
  const removeItem = i  => setItems(it => it.filter((_, j) => j !== i));
  const setItem    = (i, k, v) => setItems(it => it.map((row, j) => j === i ? { ...row, [k]: v } : row));
  const totalItems = items.reduce((s, i) => s + (Number(i.QTY) || 0) * (Number(i.HARGA) || 0), 0);

  // ── text field helper ─────────────────────────────────────────
  const field = (key, label, opts = {}) => {
    const { type = 'text', required = false, placeholder = '', readOnly = false } = opts;
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
          disabled={(isEdit && key === 'NO_PO') || readOnly}
          placeholder={placeholder}
          style={readOnly ? { background: 'var(--surface3)', color: 'var(--text2)' } : {}}
        />
        {errors[key] && <div className="form-err">{errors[key]}</div>}
      </div>
    );
  };

  // ── validasi ─────────────────────────────────────────────────
  const validate = () => {
  const errs = {};
  if (!String(po.NO_PO      || '').trim()) errs.NO_PO      = 'Wajib diisi';
  else if (isDuplicateNoPo)                errs.NO_PO      = 'NO PO sudah pernah diinput';
  if (!String(po.NOPOL      || '').trim()) errs.NOPOL      = 'Wajib diisi';
  if (!String(po.BENGKEL    || '').trim()) errs.BENGKEL    = 'Wajib diisi';
  if (!String(po.KETERANGAN || '').trim()) errs.KETERANGAN = 'Wajib diisi';
  setErrors(errs);
  return Object.keys(errs).length === 0;
};

  // ── save ──────────────────────────────────────────────────────
  const save = async () => {
    if (!validate()) return;
    setSaving(true);
 
    // Simpan status lama sebelum update
    const oldStatus = isEdit ? String(editRow.KETERANGAN || '').trim() : '';
    const newStatus = String(po.KETERANGAN || '').trim();
 
    try {
      if (IS_DEMO) { await new Promise(r => setTimeout(r, 600)); onSaved(); return; }
 
      const res = await apiPost({
        action: isEdit ? 'updatePO' : 'savePO',
        po,
        items: items.filter(i => String(i.NAMA).trim()),
      });
      if (res && res.error) { alert('❌ ' + res.error); setSaving(false); return; }
 
      // ── Log ke STATUS_HISTORY jika status berubah ──────────────
      // Kondisi log:
      //   - PO baru (isEdit = false) → catat status awal
      //   - Edit → hanya jika KETERANGAN berubah
      const statusBerubah = !isEdit || oldStatus !== newStatus;
 
      if (statusBerubah && newStatus) {
        apiPost({
          action:     'logStatusChange',
          no_po:      po.NO_PO,
          nopol:      po.NOPOL,
          old_status: isEdit ? (oldStatus || '—') : '—',
          new_status: newStatus,
        }).catch(() => {}); // fire-and-forget, tidak blokir onSaved()
      }
      // ───────────────────────────────────────────────────────────
 
      onSaved();
    } catch (e) {
      alert('Error: ' + e.message);
      setSaving(false);
    }
  };

  // ── render ────────────────────────────────────────────────────
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

            <div className="form-group">
              <label className="form-label">No PO<span className="form-required"> *</span></label>
              <input
                type="text"
                className={`form-input${(errors.NO_PO || isDuplicateNoPo) ? ' error' : ''}`}
                value={po.NO_PO || ''}
                onChange={e => { setPo(p => ({ ...p, NO_PO: e.target.value })); setErrors(er => ({ ...er, NO_PO: '' })); }}
                disabled={isEdit}
              />
              {errors.NO_PO && <div className="form-err">{errors.NO_PO}</div>}
              {isDuplicateNoPo && (
                <div className="form-err">⚠️ NO PO ini sudah pernah diinput, gunakan nomor lain</div>
              )}
            </div>

            {/* Nopol — searchable dropdown */}
            <div className="form-group">
              <label className="form-label">
                Nopol<span className="form-required"> *</span>
              </label>
              {isEdit ? (
                // edit mode: nopol tidak bisa diganti
                <input className="form-input" value={po.NOPOL} disabled
                  style={{ background: 'var(--surface3)', color: 'var(--text2)' }} />
              ) : (
                <NopolSearch
                  value={po.NOPOL}
                  onChange={handleNopolChange}
                  kendaraanList={kendaraanList}
                  disabled={loadingKendaraan}
                />
              )}
              {errors.NOPOL && <div className="form-err">{errors.NOPOL}</div>}
              {loadingKendaraan && <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>Memuat data kendaraan…</div>}
            </div>

            {/* Auto-filled fields — tampil read-only dengan indikator */}
            <div className="form-group">
              <label className="form-label">
                Driver
                {autoFilled.DRIVER && <span style={{ marginLeft:5, fontSize:9, background:'var(--green-bg)', color:'var(--green-t)', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>AUTO</span>}
              </label>
              <input
                className="form-input"
                value={po.DRIVER || ''}
                onChange={e => { setPo(p => ({ ...p, DRIVER: e.target.value })); setAutoFilled(a => ({ ...a, DRIVER: false })); }}
                placeholder="Nama driver"
                style={autoFilled.DRIVER ? { borderColor: 'var(--green)', background: 'var(--green-bg)', color:'var(--green-t)' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Depo
                {autoFilled.DEPO && <span style={{ marginLeft:5, fontSize:9, background:'var(--green-bg)', color:'var(--green-t)', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>AUTO</span>}
              </label>
              <input
                className="form-input"
                value={po.DEPO || ''}
                onChange={e => { setPo(p => ({ ...p, DEPO: e.target.value })); setAutoFilled(a => ({ ...a, DEPO: false })); }}
                placeholder="Nama depo"
                style={autoFilled.DEPO ? { borderColor: 'var(--green)', background: 'var(--green-bg)', color:'var(--green-t)' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Jenis / Type Kendaraan
                {autoFilled.JENIS_MOBIL && <span style={{ marginLeft:5, fontSize:9, background:'var(--green-bg)', color:'var(--green-t)', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>AUTO</span>}
              </label>
              <input
                className="form-input"
                value={po.JENIS_MOBIL || ''}
                onChange={e => { setPo(p => ({ ...p, JENIS_MOBIL: e.target.value })); setAutoFilled(a => ({ ...a, JENIS_MOBIL: false })); }}
                placeholder="Contoh: L300, R6 Long, ..."
                style={autoFilled.JENIS_MOBIL ? { borderColor: 'var(--green)', background: 'var(--green-bg)', color:'var(--green-t)' } : {}}
              />
            </div>

            {field('KM', 'KM', { type: 'number', placeholder: '150000' })}
            {field('TGL_PENGAJUAN', 'Tgl Pengajuan', { type: 'date' })}
            {field('REASON', 'Keluhan / Reason', { full: true })}
          </div>

          {/* ── Data Bengkel ── */}
          <div className="form-section-label">🏪 Data Bengkel</div>
          <div className="form-grid">
            {field('BENGKEL', 'Bengkel', { required: true })}

            <div className="form-group">
              <label className="form-label">Status<span className="form-required"> *</span></label>
              <select
                className={`form-input${errors.KETERANGAN ? ' error' : ''}`}
                value={po.KETERANGAN || ''}
                onChange={e => { setPo(p => ({ ...p, KETERANGAN: e.target.value })); setErrors(er => ({ ...er, KETERANGAN: '' })); }}
              >
                <option value="">-- Pilih Status --</option>
                <option value="PENDING">⏳ Menunggu</option>
                <option value="PROSES PERBAIKAN">🔧 Dalam Proses</option>
                <option value="MENUNGGU SPAREPART">📦 Menunggu Sparepart</option>
                <option value="SELESAI">✅ Selesai</option>
              </select>
              {errors.KETERANGAN && <div className="form-err">{errors.KETERANGAN}</div>}
            </div>

            {field('TGL_MASUK',  'Tgl Masuk',  { type: 'date' })}
            {field('TGL_KELUAR', 'Tgl Keluar', { type: 'date' })}
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
                <div className="item-row" style={{ marginBottom: 4 }}>
                  {['Tipe', 'Nama Item', 'Qty', 'Harga', ''].map((h, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                  ))}
                </div>

                {items.map((item, i) => (
                  <div className="item-row" key={i}>
                    <select className="form-input" value={item.TIPE} onChange={e => setItem(i, 'TIPE', e.target.value)}>
                      <option value="JASA">JASA</option>
                      <option value="SPAREPART">SPAREPART</option>
                    </select>
                    <input className="form-input" value={item.NAMA} onChange={e => setItem(i, 'NAMA', e.target.value)} placeholder="Nama item / pekerjaan" />
                    <input className="form-input" type="number" min={1} value={item.QTY} onChange={e => setItem(i, 'QTY', e.target.value)} />
                    <input className="form-input" type="number" min={0} value={item.HARGA} onChange={e => setItem(i, 'HARGA', e.target.value)} placeholder="0" />
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
          <button className="btn btn-primary" onClick={save} disabled={saving || isDuplicateNoPo}>
            {saving ? '⏳ Menyimpan…' : isEdit ? '💾 Simpan Perubahan' : '💾 Simpan PO'}
          </button>
        </div>
      </div>
    </div>
  );
}
