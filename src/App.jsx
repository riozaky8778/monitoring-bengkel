import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IS_DEMO, apiFetch, apiPost, demoData, getKendaraan } from './services/api';
import DataKendaraan from './components/DataKendaraan';
import SummaryCard from './components/SummaryCard';
import POTable from './components/POTable';
import POForm from './components/POForm';
import DetailBiaya from './components/DetailBiaya';
import StatusHistoryModal from './components/StatusHistoryModal';
import { DonutChart, LeadtimeChart, DepoChart } from './components/Charts';
import RiwayatModal from './components/RiwayatModal';
import RekapBiaya from './components/RekapBiaya';
import { statusOf, fmt, fmtRp, formatTgl } from './utils/helpers';
import './index.css';

const PAGE_SIZE = 15;

const NAV_LABEL = {
  dashboard:  'Dashboard',
  perbaikan:  'Log Perbaikan',
  kendaraan:  'Data Kendaraan',
  rekapBiaya: 'Rekap Biaya',
};

export default function App() {
  const [allData,  setAllData]  = useState([]);
  const [kendaraan, setKendaraan] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepo, setFilterDepo] = useState('');
  const [filterNoPo, setFilterNoPo] = useState('');
  const [filterTglField, setFilterTglField] = useState('masuk');
  const [filterTglFrom,  setFilterTglFrom]  = useState('');
  const [filterTglTo,    setFilterTglTo]    = useState('');
  const [page, setPage] = useState(1);

  const [formRow, setFormRow] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [historyRow, setHistoryRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [topAktivitasUnit, setTopAktivitasUnit] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (IS_DEMO) {
      setAllData(demoData().slice().reverse());
      setKendaraan((await getKendaraan()));
      setLastSync(new Date());
      setLoading(false);
      return;
    }
    try {
      const [dataRes, kendRes] = await Promise.all([
        apiFetch({ action: 'getData' }),
        getKendaraan(),
      ]);
      setAllData((dataRes.data || []).slice().reverse());
      setKendaraan(kendRes);
      setLastSync(new Date());
    } catch(e) { console.error(e); }
    finally    { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNav = (nav) => {
    setActiveNav(nav);
    setSidebarOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    setDeleteLoading(true);
    try {
      if (!IS_DEMO) {
        await apiPost({ action: 'deletePO', no_po: deleteRow.NO_PO });
      }
      setDeleteRow(null);
      setDeleteSuccess(true);
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ─── Lookup NOPOL → Company Group (XPDC/TSMK/TMJA) ─── */
  const nopolToCompany = useMemo(() => {
    const map = {};
    kendaraan.forEach(k => {
      const nopol = String(k.NOPOL || '').trim().toUpperCase();
      if (!nopol) return;
      const sumber = (k.SUMBER || '').toUpperCase();
      const divisi = (k.DIVISI || '').toUpperCase();

      let group;
      if (sumber === 'PRIMARY') group = 'XPDC';
      else if (sumber === 'INVENTARIS') group = 'TSMK';
      else if (sumber === 'SECONDARY') group = divisi === 'AQUA' ? 'TSMK' : 'TMJA';
      else group = 'LAINNYA';

      map[nopol] = group;
    });
    return map;
  }, [kendaraan]);

  /* ─── Stats & derived data ─── */
  const s = (() => {
    let selesai=0, proses=0, pending=0, totalBiaya=0;
    const bengkelCount = {};
    const depoCount = {};
    const companyCount = {};
    const monthlyLt = {};
    let totalLt = 0, countLt = 0;

    allData.forEach(r => {
      const stat = statusOf(r.KETERANGAN || r.KET || '');
      if (stat === 'SELESAI') selesai++;
      else if (stat === 'PROSES') proses++;
      else pending++;

      totalBiaya += Number(r.TOTAL_BIAYA || r.BIAYA) || 0;

      const bengkel = (r.BENGKEL || '').trim();
      if (bengkel) bengkelCount[bengkel] = (bengkelCount[bengkel] || 0) + 1;

      const depo = (r.DEPO || 'Lainnya').trim();
      depoCount[depo] = (depoCount[depo] || 0) + 1;

      const nopolKey = String(r.NOPOL || '').trim().toUpperCase();
      const company = nopolToCompany[nopolKey] || 'LAINNYA';
      companyCount[company] = (companyCount[company] || 0) + 1;

      let lt = parseInt(r.LEADTIME);
      const tMasuk = new Date(r.TGL_MASUK);
      const tKeluar = new Date(r.TGL_KELUAR);
      if (isNaN(lt) && !isNaN(tMasuk) && !isNaN(tKeluar)) {
        lt = Math.max(0, Math.ceil((tKeluar - tMasuk) / (1000 * 60 * 60 * 24)));
      }
      if (!isNaN(lt) && lt >= 0) {
        totalLt += lt; countLt++;
        let bulan = !isNaN(tMasuk) ? tMasuk.getMonth() + 1 : new Date().getMonth() + 1;
        if (!monthlyLt[bulan]) monthlyLt[bulan] = { sum: 0, count: 0 };
        monthlyLt[bulan].sum += lt;
        monthlyLt[bulan].count++;
      }
    });

    return {
      total: allData.length, selesai, proses, pending, totalBiaya,
      avgLeadtime: countLt > 0 ? (totalLt / countLt).toFixed(1) : 0,
      bengkelCount, depoCount, companyCount, monthlyLt
    };
  })();

  const topBengkel        = Object.entries(s.bengkelCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxBengkel        = topBengkel[0]?.[1] || 1;
  const depoChartData     = Object.entries(s.depoCount).sort((a,b)=>b[1]-a[1]).map(([depo,count])=>({depo,count}));
  const companyChartData  = Object.entries(s.companyCount).sort((a,b)=>b[1]-a[1]).map(([depo,count])=>({depo,count}));
  const leadtimeChartData = Object.keys(s.monthlyLt).sort((a,b)=>a-b).map(m=>({
    bulan: parseInt(m), avg: Math.round((s.monthlyLt[m].sum / s.monthlyLt[m].count) * 10) / 10
  }));

  const oneYearAgo = useMemo(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d;
  }, []);

  const topAktivitasGrouped = useMemo(() => {
    const map = {};
    allData.forEach(r => {
      const tgl = new Date(r.TGL_MASUK);
      if (isNaN(tgl) || tgl < oneYearAgo) return;
      const nopol = String(r.NOPOL || '').trim();
      if (!nopol) return;
      const nopolKey = nopol.toUpperCase();
      const group = nopolToCompany[nopolKey] || 'LAINNYA';

      if (!map[nopol]) map[nopol] = {
        nopol, jumlah: 0, totalBiaya: 0, lastTgl: null,
        group, depo: (r.DEPO || '').trim()
      };
      map[nopol].jumlah++;
      map[nopol].totalBiaya += Number(r.TOTAL_BIAYA || r.BIAYA) || 0;
      if (!map[nopol].lastTgl || tgl > new Date(map[nopol].lastTgl)) {
        map[nopol].lastTgl = r.TGL_MASUK;
      }
    });

    const all = Object.values(map);
    const sortFn = (a, b) => b.jumlah - a.jumlah || b.totalBiaya - a.totalBiaya;

    return {
      XPDC: all.filter(i => i.group === 'XPDC').sort(sortFn).slice(0, 10),
      TSMK: all.filter(i => i.group === 'TSMK').sort(sortFn).slice(0, 10),
      TMJA: all.filter(i => i.group === 'TMJA').sort(sortFn).slice(0, 10),
    };
  }, [allData, oneYearAgo, nopolToCompany]);

  const depoList = [...new Set(allData.map(r => (r.DEPO || '').trim()).filter(Boolean))].sort();
  const filteredData = allData.filter(r => {
    const status = statusOf(String(r.KETERANGAN || r.KET || ''));
    const q = search.toLowerCase();
    if (filterStatus && status !== filterStatus) return false;
    if (filterDepo && (r.DEPO || '').trim() !== filterDepo) return false;
    if (filterNoPo && !String(r.NO_PO || '').toLowerCase().includes(filterNoPo.toLowerCase())) return false;
    if (q && !String(r.NOPOL||'').toLowerCase().includes(q) && !String(r.DRIVER||'').toLowerCase().includes(q) && !String(r.NO_PO||'').toLowerCase().includes(q)) return false;

    if (filterTglFrom || filterTglTo) {
      const tglVal = filterTglField === 'masuk' ? r.TGL_MASUK : r.TGL_KELUAR;
      const tgl = new Date(tglVal);
      if (isNaN(tgl)) return false;
      if (filterTglFrom && tgl < new Date(filterTglFrom)) return false;
      if (filterTglTo   && tgl > new Date(filterTglTo + 'T23:59:59')) return false;
    }

    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData  = filteredData.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div className="layout">

      {formOpen    && <POForm editRow={formRow} existingNoPo={allData.map(r => String(r.NO_PO).trim())} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); fetchData(); }} />}
      {detailRow   && <DetailBiaya row={detailRow} onClose={() => setDetailRow(null)} />}
      {historyRow  && <StatusHistoryModal row={historyRow} onClose={() => setHistoryRow(null)} />}

      {deleteRow && (
        <div className="overlay" onClick={() => !deleteLoading && setDeleteRow(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '2px solid var(--red-bg)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--red-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>✕</div>
                <div>
                  <div className="modal-title" style={{ color:'var(--red-t)' }}>Hapus Data</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Tindakan ini tidak bisa dibatalkan</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDeleteRow(null)} disabled={deleteLoading}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign:'center', padding:'28px 24px' }}>
              <div style={{ fontSize:14, color:'var(--text)', marginBottom:12, lineHeight:1.6 }}>
                Apakah anda yakin ingin menghapus data ini?
              </div>
              <div style={{ background:'var(--red-bg)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'12px 16px', display:'inline-block', textAlign:'left' }}>
                <div style={{ fontWeight:700, color:'var(--red-t)', fontSize:13 }}>PO #{deleteRow.NO_PO} — {deleteRow.NOPOL}</div>
                <div style={{ fontSize:11.5, color:'var(--text2)', marginTop:4 }}>{deleteRow.DRIVER} • {deleteRow.DEPO}</div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent:'center', gap:12 }}>
              <button className="btn" onClick={() => setDeleteRow(null)} disabled={deleteLoading}>Batal</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={deleteLoading} style={{ minWidth:120, justifyContent:'center', fontWeight:700 }}>
                {deleteLoading ? '⏳ Menghapus...' : '🗑️ Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div className="overlay" onClick={() => setDeleteSuccess(false)}>
          <div className="modal" style={{ maxWidth:360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign:'center', padding:'36px 24px' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--green-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 16px' }}>✅</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Data Berhasil Dihapus</div>
              <div style={{ fontSize:12.5, color:'var(--text3)', marginBottom:24 }}>Data perbaikan telah dihapus dari sistem.</div>
              <button className="btn btn-primary" onClick={() => setDeleteSuccess(false)} style={{ minWidth:120, justifyContent:'center' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {topAktivitasUnit && (
        <RiwayatModal unit={topAktivitasUnit} poData={allData} onClose={() => setTopAktivitasUnit(null)} />
      )}

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <nav className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-badge">🔧</div>
          <div className="app-name">Workshop Monitor</div>
          <div className="app-sub">Dashboard 2026</div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section">Menu Utama</div>

          <button className={`nav-item ${activeNav==='dashboard' ? 'active' : ''}`} onClick={() => handleNav('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </button>

          <button className={`nav-item ${activeNav==='perbaikan' ? 'active' : ''}`} onClick={() => handleNav('perbaikan')}>
            <span className="nav-icon">🗂️</span> Log Perbaikan
            <span className="nav-badge">{allData.length}</span>
          </button>

          <button className={`nav-item ${activeNav==='kendaraan' ? 'active' : ''}`} onClick={() => handleNav('kendaraan')}>
            <span className="nav-icon">🚛</span> Data Kendaraan
            <span className="nav-badge">{kendaraan.length}</span>
          </button>

          <button className={`nav-item ${activeNav==='rekapBiaya' ? 'active' : ''}`} onClick={() => handleNav('rekapBiaya')}>
            <span className="nav-icon">💰</span> Rekap Biaya
          </button>

          <div className="sidebar-section" style={{ marginTop:8 }}>Status Real-time</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px' }}>
            <span style={{ fontSize:12, color:'var(--text2)' }}>✅ Selesai</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background:'var(--green-bg)', color:'var(--green-t)' }}>{s.selesai}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px' }}>
            <span style={{ fontSize:12, color:'var(--text2)' }}>🔧 Proses</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background:'var(--blue-dim)', color:'var(--blue-t)' }}>{s.proses}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px' }}>
            <span style={{ fontSize:12, color:'var(--text2)' }}>⏳ Pending</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background:'var(--amber-bg)', color:'var(--amber-t)' }}>{s.pending}</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sync-info">
            <div className={`sync-dot${IS_DEMO ? ' demo' : ''}`} />
            <span>{IS_DEMO ? 'Mode Demo' : lastSync ? `Sync ${lastSync.toLocaleTimeString('id-ID')}` : 'Live'}</span>
          </div>
        </div>
      </nav>

      <div className="main">

        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
              <span /><span /><span />
            </button>
            <div className="topbar-crumb">
              <span className="crumb-root">Workshop</span>
              <span className="crumb-sep">›</span>
              <span className="crumb-page">{NAV_LABEL[activeNav]}</span>
            </div>
          </div>

          <div className="topbar-right">
            <button className="btn" onClick={fetchData}>↺ Refresh</button>
            {activeNav === 'perbaikan' && (
              <button className="btn btn-primary" onClick={() => { setFormRow(null); setFormOpen(true); }}>
                + Input PO
              </button>
            )}
          </div>
        </div>

        {loading ? <div className="spinner" style={{ margin:'50px auto' }} /> : (
          <div className="content" style={{ padding:0 }}>

            {activeNav === 'dashboard' && (
              <div className="content">

                <div className="metrics-grid">
                  <SummaryCard label="Total Perbaikan"  value={fmt(s.total)}        sub=""                                                          icon="🔧" accent="var(--text)"    iconBg="var(--surface3)" />
                  <SummaryCard label="Pending"           value={fmt(s.pending)}      sub="Menunggu alat/antrean"                                     icon="⏳" accent="var(--amber-t)" iconBg="var(--amber-bg)" />
                  <SummaryCard label="Sedang Proses"     value={fmt(s.proses)}       sub="Masih dibongkar"                                           icon="⚙️" accent="var(--blue-t)"  iconBg="var(--blue-dim)" />
                  <SummaryCard label="Selesai"           value={fmt(s.selesai)}      sub={`${s.total>0 ? Math.round(s.selesai/s.total*100) : 0}% Dari total`} icon="✅" accent="var(--green-t)" iconBg="var(--green-bg)" />
                  <SummaryCard label="Total Biaya"       value={fmtRp(s.totalBiaya)} sub={`Avg ${s.avgLeadtime} hari leadtime`}                       icon="💰" accent="var(--red-t)"   iconBg="var(--red-dim)" />
                </div>

                <div className="charts-row">
                  <div className="chart-card">
                    <div className="chart-card-header"><div className="chart-title">Total Perbaikan By Company</div></div>
                    <DepoChart data={companyChartData} />
                  </div>
                  <div className="chart-card">
                    <div className="chart-card-header">
                      <div className="chart-title">Top Bengkel</div>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>by volume</span>
                    </div>
                    <div className="bar-list">
                      {topBengkel.length === 0 ? (
                        <div style={{ color:'var(--text3)', fontSize:12, padding:20 }}>Belum ada data bengkel</div>
                      ) : topBengkel.map(([name, count]) => (
                        <div key={name} className="bar-row-item">
                          <div className="bar-row-label" title={name}>{name}</div>
                          <div className="bar-track"><div className="bar-fill" style={{ width:`${Math.round(count/maxBengkel*100)}%` }} /></div>
                          <div className="bar-count">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="chart-card">
                    <div className="chart-card-header">
                      <div className="chart-title">Avg Leadtime / Bulan</div>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>hari</span>
                    </div>
                    {leadtimeChartData.length > 0
                      ? <LeadtimeChart data={leadtimeChartData} />
                      : <div style={{ color:'var(--text3)', fontSize:12, padding:20 }}>Belum ada data</div>
                    }
                  </div>
                </div>

                {(topAktivitasGrouped.XPDC.length > 0 || topAktivitasGrouped.TSMK.length > 0 || topAktivitasGrouped.TMJA.length > 0) && (
                  <div className="chart-card" style={{ marginTop: 0 }}>
                    <div className="chart-card-header">
                      <div className="chart-title">📊 Top Aktivitas Perbaikan</div>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>1 tahun terakhir • Top 10 per company</span>
                    </div>
                    <div className="top-aktivitas-grid">
                      {[
                        { key: 'XPDC', label: 'XPDC', icon: '🚛', color: 'var(--purple-t)', bg: 'var(--purple-bg)' },
                        { key: 'TSMK', label: 'TSMK', icon: '🏭', color: 'var(--blue-t)', bg: 'var(--blue-dim)' },
                        { key: 'TMJA', label: 'TMJA', icon: '📦', color: 'var(--teal-t)', bg: 'var(--teal-bg)' },
                      ].map(grp => (
                        <div key={grp.key}>
                          <div style={{
                            fontSize: 12, fontWeight: 800, color: grp.color,
                            marginBottom: 8, padding: '8px 12px',
                            background: grp.bg, borderRadius: 'var(--radius-sm)',
                            textAlign: 'center', letterSpacing: '0.5px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}>
                            <span>{grp.icon}</span> {grp.label}
                            <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7 }}>({topAktivitasGrouped[grp.key].length})</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {topAktivitasGrouped[grp.key].length === 0 ? (
                              <div style={{ color: 'var(--text3)', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
                                Belum ada data
                              </div>
                            ) : topAktivitasGrouped[grp.key].map((item, idx) => (
                              <button
                                key={item.nopol}
                                onClick={() => setTopAktivitasUnit({ NOPOL: item.nopol })}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  background: 'var(--surface2)', border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius-sm)', padding: '6px 10px',
                                  cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
                              >
                                <div style={{
                                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 800, fontSize: 10,
                                  background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--surface3)',
                                  color: idx < 3 ? '#1a1a1a' : 'var(--text2)',
                                }}>
                                  {idx + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                  <div className="td-nopol" style={{ fontSize: 11.5 }}>{item.nopol}</div>
                                  <div style={{ fontSize: 9.5, color: 'var(--text3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {item.depo || '—'}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--blue-t)', whiteSpace: 'nowrap' }}>{item.jumlah} PO</div>
                                  <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--green-t)', whiteSpace: 'nowrap', marginTop: 1 }}>{fmtRp(item.totalBiaya)}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeNav === 'perbaikan' && (
              <div className="content">
                <POTable
                  data={pagedData} page={page} totalPages={totalPages} setPage={setPage}
                  search={search} setSearch={setSearch}
                  filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                  filterDepo={filterDepo} setFilterDepo={setFilterDepo} depoList={depoList}
                  filterNoPo={filterNoPo} setFilterNoPo={setFilterNoPo}
                  filterTglField={filterTglField} setFilterTglField={setFilterTglField}
                  filterTglFrom={filterTglFrom}   setFilterTglFrom={setFilterTglFrom}
                  filterTglTo={filterTglTo}       setFilterTglTo={setFilterTglTo}
                  openEditForm={(r) => { setFormRow(r); setFormOpen(true); }}
                  setDetailRow={setDetailRow}
                  openHistoryModal={(r) => setHistoryRow(r)}
                  onDeleteRow={(r) => setDeleteRow(r)}
                />
              </div>
            )}

            {activeNav === 'kendaraan' && (
              <DataKendaraan data={kendaraan} loading={loading} poData={allData} />
            )}

            {activeNav === 'rekapBiaya' && (
              <RekapBiaya allData={allData} nopolToCompany={nopolToCompany} />
            )}

          </div>
        )}
      </div>
    </div>
  );
}
