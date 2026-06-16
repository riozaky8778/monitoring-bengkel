import React, { useState, useEffect, useCallback } from 'react';
import { IS_DEMO, apiFetch, demoData, demoSummary } from './services/api';
import SummaryCard from './components/SummaryCard';
import POTable from './components/POTable';
import POForm from './components/POForm';
import DetailBiaya from './components/DetailBiaya';
import { statusOf, fmt, fmtRp } from './utils/helpers';
import './index.css';

const PAGE_SIZE = 15;

export default function App() {
  const [allData,  setAllData]  = useState([]);
  const [loading,  setLoading]  = useState(true);
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
      setAllData(demoData());
      setLoading(false);
      return;
    }
    try {
      const dataRes = await apiFetch({ action:'getData' });
      setAllData(dataRes.data || []);
    } catch(e) { console.error(e); }
    finally    { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Kalkulasi manual dasbor agar tidak 0 (berdasarkan data Google Sheets)
  const calcSummary = () => {
    let selesai=0, proses=0, pending=0, totalBiaya=0;
    allData.forEach(r => {
      const s = statusOf(r.KETERANGAN);
      if (s==='SELESAI') selesai++; else if (s==='PROSES') proses++; else pending++;
      totalBiaya += Number(r.TOTAL_BIAYA||r.BIAYA) || 0;
    });
    return { total: allData.length, selesai, proses, pending, totalBiaya, avgLeadtime: 3.5 };
  };
  const s = calcSummary();

  // Filter Data untuk Tabel
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
      return (
		<div className="layout">
		  {/* Modals */}
		  {formOpen && <POForm editRow={formRow} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); fetchData(); }} />}
		  {detailRow && <DetailBiaya row={detailRow} onClose={() => setDetailRow(null)} />}
	  
      {/* Sidebar */}
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
        </div>
      </nav>

      {/* Main Content */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-crumb">Workshop › <span className="crumb-page">Dashboard</span></div>
          </div>
          <div className="topbar-right">
            <button className="btn" onClick={fetchData}>↺ Refresh</button>
            <button className="btn btn-primary" onClick={() => { setFormRow(null); setFormOpen(true); }}>+ Input PO</button>
          </div>
        </div>

        {loading ? <div className="spinner" style={{margin:'50px auto'}}></div> : (
          <div className="content">
            <div className="metrics-grid">
              <SummaryCard label="Total Kendaraan" value={fmt(s.total)} sub="sepanjang 2026" icon="🚛" accent="var(--text)" iconBg="var(--surface3)" />
              <SummaryCard label="Sedang Proses" value={fmt(s.proses)} sub="masih di bengkel" icon="⚙️" accent="var(--blue-t)" iconBg="var(--blue-dim)" />
              <SummaryCard label="Selesai" value={fmt(s.selesai)} sub={`${s.total>0 ? Math.round(s.selesai/s.total*100) : 0}% dari total`} icon="✅" accent="var(--green-t)" iconBg="var(--green-bg)" />
              <SummaryCard label="Total Biaya" value={fmtRp(s.totalBiaya)} sub="estimasi pengeluaran" icon="💰" accent="var(--amber-t)" iconBg="var(--amber-bg)" />
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