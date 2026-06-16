import React, { useState, useEffect, useCallback } from 'react';
import { IS_DEMO, apiFetch, demoData, demoSummary } from './services/api';
import SummaryCard from './components/SummaryCard';
import { statusOf, fmt, fmtRp } from './utils/helpers';
import './index.css';

const PAGE_SIZE = 15;

export default function App() {
  const [summary,  setSummary]  = useState(null);
  const [allData,  setAllData]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    if (IS_DEMO) {
      const rows = demoData();
      setAllData(rows);
      setSummary(demoSummary(rows));
      setLoading(false);
      return;
    }
    try {
      const [sumRes, dataRes] = await Promise.all([
        apiFetch({ action:'getSummary' }),
        apiFetch({ action:'getData' }),
      ]);
      setSummary(sumRes.summary);
      setAllData(dataRes.data || []);
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = summary || { total:0, selesai:0, proses:0, pending:0, totalBiaya:0, avgLeadtime:0 };

  return (
    <div className="layout">
      <div className="main">
        <div className="topbar">
          <div className="topbar-crumb">Workshop Monitor</div>
        </div>

        {loading ? <div className="spinner" style={{margin:'50px auto'}}></div> : (
          <div className="content">
            <div className="metrics-grid">
              <SummaryCard label="Total Kendaraan" value={fmt(s.total)} sub="sepanjang 2026" icon="🚛" accent="var(--text)" iconBg="var(--surface3)" />
              <SummaryCard label="Sedang Proses" value={fmt(s.proses||0)} sub="masih di bengkel" icon="⚙️" accent="var(--blue-t)" iconBg="var(--blue-dim)" />
              <SummaryCard label="Selesai" value={fmt(s.selesai)} sub={`${s.total>0 ? Math.round(s.selesai/s.total*100) : 0}% dari total`} icon="✅" accent="var(--green-t)" iconBg="var(--green-bg)" />
              <SummaryCard label="Total Biaya" value={fmtRp(s.totalBiaya)} sub={`rata-rata ${s.avgLeadtime} hr leadtime`} icon="💰" accent="var(--amber-t)" iconBg="var(--amber-bg)" />
            </div>
            
            <div className="table-card" style={{padding: '20px', marginTop: '20px', textAlign: 'center', color: 'var(--text3)'}}>
               {/* Tabel data akan dimasukkan ke sini nanti di langkah berikutnya */}
               Tabel Data Kendaraan ({allData.length} Data Termuat)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}