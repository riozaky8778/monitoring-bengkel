import React, { useState, useEffect, useCallback } from 'react';
import { IS_DEMO, apiFetch, demoData, demoSummary } from './services/api';
import SummaryCard from './components/SummaryCard';
import POTable from './components/POTable';
import POForm from './components/POForm';
import DetailBiaya from './components/DetailBiaya';
import { DonutChart, LeadtimeChart } from './components/Charts';
import { statusOf, fmt, fmtRp } from './utils/helpers';
import './index.css';

const PAGE_SIZE = 15;

export default function App() {
  const [summary,  setSummary]  = useState(null);
  const [allData,  setAllData]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  
  // State Table & Filter
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // State Modals
  const [formRow, setFormRow] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (IS_DEMO) {
      const rows = demoData();
      setAllData(rows);
      setSummary(demoSummary(rows));
      setLastSync(new Date());
      setLoading(false);
      return;
    }
    try {
      const [sumRes, dataRes] = await Promise.all([
        apiFetch({ action:'getSummary' }),
        apiFetch({ action:'getData' }),
      ]);
      setSummary(sumRes.summary);
	// ✅ Reverse supaya data terbaru (baris terakhir di sheet) tampil pertama
	setAllData((dataRes.data || []).slice().reverse());
      setLastSync(new Date());
    } catch(e) { console.error(e); }
    finally    { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Kalkulasi manual jika summary API tidak tersedia
  const calcSummary = () => {
    let selesai=0, proses=0, pending=0, totalBiaya=0;
    const bengkelCount = {};
    const bulanCount = {};

    allData.forEach(r => {
      const s = statusOf(r.KETERANGAN);
      if (s==='SELESAI') selesai++; else if (s==='PROSES') proses++; else pending++;
      totalBiaya += Number(r.TOTAL_BIAYA||r.BIAYA) || 0;

      if (r.BENGKEL) bengkelCount[r.BENGKEL] = (bengkelCount[r.BENGKEL]||0)+1;
      const m = parseInt((r.TGL_MASUK||'').split('-')[1]) || (new Date()).getMonth()+1;
      if (!isNaN(m)) bulanCount[m] = (bulanCount[m]||0)+1;
    });

    return summary || { total: allData.length, selesai, proses, pending, totalBiaya, avgLeadtime: 3.5, bengkelCount, bulanCount };
  };
  const s = calcSummary();

  // Data untuk Grafik
  const topBengkel = Object.entries(s.bengkelCount||{}).sort(([,a],[,b])=>b-a).slice(0,5);
  const maxBengkel = topBengkel[0]?.[1] || 1;
  const leadtimeChartData = Object.entries(s.bulanCount||{}).sort(([a],[b])=>a-b).map(([bulan]) => {
    const bRows = allData.filter(r => {
      const lt = parseInt(String(r.LEADTIME||''));
      if (isNaN(lt)) return false;
      const d = new Date(r.TGL_MASUK||'');
      return !isNaN(d) && (d.getMonth()+1) === parseInt(bulan);
    });
    const avg = bRows.length ? bRows.reduce((sum,r)=>sum+(parseInt(r.LEADTIME)||0),0)/bRows.length : 0;
    return { bulan:parseInt(bulan), avg:Math.round(avg*10)/10 };
  });

  // Filter Data Tabel
  const filteredData = allData.filter(r => {
    const status = statusOf(String(r.KETERANGAN||r.KET||''));
    const q = search.toLowerCase();
    if (filterStatus && status !== filterStatus) return false;
    if (q && !String(r.NOPOL||'').toLowerCase().includes(q) && !String(r.DRIVER||'').toLowerCase().includes(q)) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div className="layout">
      {/* Modals */}
      {formOpen && <POForm editRow={formRow} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); fetchData(); }} />}
      {detailRow && <DetailBiaya row={detailRow} onClose={() => setDetailRow(null)} />}
      
      {/* Sidebar Komplit */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-badge">🔧</div>
          <div className="app-name">Workshop Monitor</div>
          <div className="app-sub">Dashboard 2026</div>
        </div>
        <div className="sidebar-nav">
          <div className="sidebar-section">Menu Utama</div>
          <button className={`nav-item ${activeNav==='dashboard'?'active':''}`} onClick={() => setActiveNav('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className={`nav-item ${activeNav==='kendaraan'?'active':''}`} onClick={() => setActiveNav('kendaraan')}>
            <span className="nav-icon">🚛</span> Data Kendaraan <span className="nav-badge">{s.total}</span>
          </button>
          <button className={`nav-item ${activeNav==='bengkel'?'active':''}`} onClick={() => setActiveNav('bengkel')}>
            <span className="nav-icon">🏪</span> Rekap Bengkel
          </button>

          <div className="sidebar-section" style={{ marginTop:8 }}>Status</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px' }}>
            <span style={{ fontSize:12, color:'var(--text2)' }}>Selesai</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background:'var(--green-bg)', color:'var(--green-t)' }}>{s.selesai}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px' }}>
            <span style={{ fontSize:12, color:'var(--text2)' }}>Proses</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background:'var(--blue-dim)', color:'var(--blue-t)' }}>{s.proses}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px' }}>
            <span style={{ fontSize:12, color:'var(--text2)' }}>Pending</span>
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

      {/* Main Content */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-crumb">
              <span className="crumb-root">Workshop</span>
              <span className="crumb-sep">›</span>
              <span className="crumb-page">{activeNav === 'dashboard' ? 'Dashboard' : activeNav === 'kendaraan' ? 'Data Kendaraan' : 'Rekap Bengkel'}</span>
            </div>
            {IS_DEMO && <span className="badge badge-amber">⚠ Demo</span>}
          </div>
          <div className="topbar-right">
            <button className="btn" onClick={fetchData}>↺ Refresh</button>
            <button className="btn btn-primary" onClick={() => { setFormRow(null); setFormOpen(true); }}>+ Input PO</button>
          </div>
        </div>

        {loading ? <div className="spinner" style={{margin:'50px auto'}}></div> : (
          <div className="content">
            {IS_DEMO && (
              <div className="setup-box">
                <strong>⚙️ Setup diperlukan:</strong><br />
                1. Google Sheets → <strong>Extensions → Apps Script</strong> → paste isi <code>Code.gs</code><br />
                2. Jalankan <code>setupSheets()</code> sekali untuk membuat tab <code>PO_HEADER</code> &amp; <code>PO_DETAIL</code><br />
                3. <strong>Deploy → New deployment → Web App</strong> → Execute as: <em>Me</em> → Who has access: <em>Anyone</em><br />
                4. Copy URL → paste ke <code>API</code> di <code>src/services/api.js</code>, lalu refresh ✓
              </div>
            )}

            <div className="metrics-grid">
              <SummaryCard label="Total Kendaraan" value={fmt(s.total)} sub="sepanjang 2026" icon="🚛" accent="var(--text)" iconBg="var(--surface3)" />
              <SummaryCard label="Sedang Proses" value={fmt(s.proses)} sub="masih di bengkel" icon="⚙️" accent="var(--blue-t)" iconBg="var(--blue-dim)" />
              <SummaryCard label="Selesai" value={fmt(s.selesai)} sub={`${s.total>0 ? Math.round(s.selesai/s.total*100) : 0}% dari total`} icon="✅" accent="var(--green-t)" iconBg="var(--green-bg)" />
              <SummaryCard label="Total Biaya" value={fmtRp(s.totalBiaya)} sub={`rata-rata ${s.avgLeadtime} hr leadtime`} icon="💰" accent="var(--amber-t)" iconBg="var(--amber-bg)" />
            </div>

            {/* ── CHARTS ROW ── */}
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-card-header">
                  <div className="chart-title">Status Kendaraan</div>
                </div>
                <DonutChart selesai={s.selesai||0} proses={s.proses||0} pending={s.pending||0} />
              </div>

              <div className="chart-card">
                <div className="chart-card-header">
                  <div className="chart-title">Top Bengkel</div>
                  <span style={{ fontSize:11, color:'var(--text3)' }}>by volume</span>
                </div>
                <div className="bar-list">
                  {topBengkel.length === 0 ? (
                    <div style={{ color:'var(--text3)', fontSize:12 }}>Tidak ada data</div>
                  ) : topBengkel.map(([name, count]) => (
                    <div key={name} className="bar-row-item">
                      <div className="bar-row-label" title={name}>{name}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width:`${Math.round(count/maxBengkel*100)}%` }} />
                      </div>
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
                <LeadtimeChart data={leadtimeChartData} />
              </div>
            </div>
            
            <POTable 
              data={pagedData} page={page} totalPages={totalPages} setPage={setPage}
              search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              openEditForm={(r) => { setFormRow(r); setFormOpen(true); }}
              setDetailRow={setDetailRow}
            />
          </div>
        )}
      </div>
    </div>
  );
}