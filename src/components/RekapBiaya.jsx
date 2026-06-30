import React, { useState, useMemo } from 'react';
import { MONTHS, fmtRp, fmt } from '../utils/helpers';

const TABS = [
  { key: 'depo',      label: 'By Depo',             icon: '📍' },
  { key: 'bengkel',   label: 'By Bengkel',          icon: '🏪' },
  { key: 'nopol',     label: 'By NoPol',            icon: '🚛' },
  { key: 'primary',   label: 'By Primary (XPDC)',   icon: '🟣' },
  { key: 'secondary', label: 'By Secondary',        icon: '🔷' },
];

export default function RekapBiaya({ allData = [], nopolToCompany = {} }) {
  const currentYear = new Date().getFullYear();

  /* ── Available years ── */
  const years = useMemo(() => {
    const ySet = new Set();
    allData.forEach(r => {
      const d = new Date(r.TGL_MASUK);
      if (!isNaN(d)) ySet.add(d.getFullYear());
    });
    const list = [...ySet].sort((a, b) => b - a);
    return list.length > 0 ? list : [currentYear];
  }, [allData, currentYear]);

  const [selectedYear, setSelectedYear] = useState(
    years.includes(currentYear) ? currentYear : (years[0] || currentYear)
  );
  const [activeTab, setActiveTab] = useState('depo');
  const [search, setSearch] = useState('');

  /* ── Filter data by year ── */
  const yearData = useMemo(() => {
    return allData.filter(r => {
      const d = new Date(r.TGL_MASUK);
      return !isNaN(d) && d.getFullYear() === Number(selectedYear);
    });
  }, [allData, selectedYear]);

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    let totalBiaya = 0;
    const monthsWithData = new Set();
    yearData.forEach(r => {
      totalBiaya += Number(r.TOTAL_BIAYA || r.BIAYA) || 0;
      const d = new Date(r.TGL_MASUK);
      if (!isNaN(d)) monthsWithData.add(d.getMonth() + 1);
    });
    const avgPerMonth = monthsWithData.size > 0 ? totalBiaya / monthsWithData.size : 0;
    return { totalBiaya, jumlahPO: yearData.length, avgPerMonth };
  }, [yearData]);

  /* ── Group data based on active tab ── */
  const tableData = useMemo(() => {
    let filteredData = yearData;
    let getGroupKey;
    let getCompany;

    switch (activeTab) {
      case 'depo':
        getGroupKey = r => (r.DEPO || 'Lainnya').trim();
        break;
      case 'bengkel':
        getGroupKey = r => (r.BENGKEL || 'Lainnya').trim();
        break;
      case 'nopol':
        getGroupKey = r => String(r.NOPOL || '—').trim();
        break;
      case 'primary':
        filteredData = yearData.filter(r => {
          const key = String(r.NOPOL || '').trim().toUpperCase();
          return nopolToCompany[key] === 'XPDC';
        });
        getGroupKey = r => String(r.NOPOL || '—').trim();
        break;
      case 'secondary':
        filteredData = yearData.filter(r => {
          const key = String(r.NOPOL || '').trim().toUpperCase();
          const grp = nopolToCompany[key];
          return grp === 'TSMK' || grp === 'TMJA';
        });
        getGroupKey = r => String(r.NOPOL || '—').trim();
        getCompany = r => {
          const key = String(r.NOPOL || '').trim().toUpperCase();
          return nopolToCompany[key] || 'LAINNYA';
        };
        break;
      default:
        getGroupKey = r => (r.DEPO || 'Lainnya').trim();
    }

    const map = {};
    filteredData.forEach(r => {
      const group = getGroupKey(r);
      const d = new Date(r.TGL_MASUK);
      const month = d.getMonth() + 1;
      const biaya = Number(r.TOTAL_BIAYA || r.BIAYA) || 0;
      const company = getCompany ? getCompany(r) : null;

      if (!map[group]) {
        map[group] = { label: group, months: {}, total: 0, poCount: 0, company };
      }
      map[group].months[month] = (map[group].months[month] || 0) + biaya;
      map[group].total += biaya;
      map[group].poCount++;
    });

    let rows = Object.values(map);

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      rows = rows.filter(r => r.label.toLowerCase().includes(q));
    }

    if (activeTab === 'secondary') {
      const tsmk = rows.filter(r => r.company === 'TSMK').sort((a, b) => b.total - a.total);
      const tmja = rows.filter(r => r.company === 'TMJA').sort((a, b) => b.total - a.total);
      return { tsmk, tmja };
    }

    rows.sort((a, b) => b.total - a.total);
    return { rows };
  }, [yearData, activeTab, nopolToCompany, search]);

  /* ── Grand totals ── */
  const grandTotals = useMemo(() => {
    const allRows = activeTab === 'secondary'
      ? [...(tableData.tsmk || []), ...(tableData.tmja || [])]
      : (tableData.rows || []);

    const months = {};
    let total = 0;
    let poCount = 0;
    allRows.forEach(row => {
      for (let m = 1; m <= 12; m++) {
        months[m] = (months[m] || 0) + (row.months[m] || 0);
      }
      total += row.total;
      poCount += row.poCount;
    });
    return { months, total, poCount };
  }, [tableData, activeTab]);

  /* ── Render table rows ── */
  const renderRows = (rows) => rows.map((row, i) => (
    <tr key={row.label + i}>
      <td className="rekap-sticky-col">
        {activeTab === 'nopol' || activeTab === 'primary' || activeTab === 'secondary'
          ? <span className="td-nopol" style={{ fontSize: 12 }}>{row.label}</span>
          : <span style={{ fontWeight: 600 }}>{row.label}</span>
        }
        <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 6 }}>({row.poCount} PO)</span>
      </td>
      {Array.from({ length: 12 }, (_, m) => m + 1).map(m => (
        <td key={m} className="rekap-cell">
          {row.months[m]
            ? <span style={{ color: 'var(--text)', fontWeight: 500 }}>{fmtRp(row.months[m])}</span>
            : <span style={{ color: 'var(--text3)', fontSize: 10 }}>—</span>
          }
        </td>
      ))}
      <td className="rekap-cell rekap-total-col">
        {fmtRp(row.total)}
      </td>
    </tr>
  ));

  /* ── Subtotal row ── */
  const renderSubtotal = (label, rows, accentColor) => {
    const months = {};
    let total = 0;
    let poCount = 0;
    rows.forEach(row => {
      for (let m = 1; m <= 12; m++) {
        months[m] = (months[m] || 0) + (row.months[m] || 0);
      }
      total += row.total;
      poCount += row.poCount;
    });
    return (
      <tr style={{ background: 'var(--surface2)' }}>
        <td className="rekap-sticky-col" style={{ background: 'var(--surface2)' }}>
          <span style={{ fontWeight: 700, color: accentColor || 'var(--text)' }}>Subtotal {label}</span>
          <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 6 }}>({poCount} PO)</span>
        </td>
        {Array.from({ length: 12 }, (_, m) => m + 1).map(m => (
          <td key={m} className="rekap-cell" style={{ fontWeight: 600 }}>
            {months[m] ? fmtRp(months[m]) : <span style={{ color: 'var(--text3)' }}>—</span>}
          </td>
        ))}
        <td className="rekap-cell rekap-total-col" style={{ fontWeight: 800 }}>
          {fmtRp(total)}
        </td>
      </tr>
    );
  };

  const hasData = activeTab === 'secondary'
    ? [...(tableData.tsmk || []), ...(tableData.tmja || [])].length > 0
    : (tableData.rows || []).length > 0;

  return (
    <div className="content">

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Rekapan Biaya Monthly</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
          Rekap biaya perbaikan per bulan dengan berbagai pengelompokan
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-card-accent" style={{ background: 'var(--green)' }} />
          <div className="metric-icon" style={{ background: 'var(--green-bg)', color: 'var(--green-t)' }}>💰</div>
          <div className="metric-label">Total Biaya {selectedYear}</div>
          <div className="metric-value" style={{ color: 'var(--green-t)', fontSize: 24 }}>{fmtRp(summary.totalBiaya)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-accent" style={{ background: 'var(--blue)' }} />
          <div className="metric-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue-t)' }}>📄</div>
          <div className="metric-label">Jumlah PO {selectedYear}</div>
          <div className="metric-value" style={{ color: 'var(--blue-t)', fontSize: 24 }}>{fmt(summary.jumlahPO)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-accent" style={{ background: 'var(--amber)' }} />
          <div className="metric-icon" style={{ background: 'var(--amber-bg)', color: 'var(--amber-t)' }}>📊</div>
          <div className="metric-label">Rata-rata / Bulan</div>
          <div className="metric-value" style={{ color: 'var(--amber-t)', fontSize: 24 }}>{fmtRp(summary.avgPerMonth)}</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div className="table-title-row">
              <div className="table-title">Rekap Biaya</div>
              <span className="table-count">{grandTotals.poCount} PO</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="filter-wrap">
                <span className="filter-icon" style={{ left: 8, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Cari..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 180, paddingLeft: 28 }}
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)'
                    }}
                  >✕</button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Tahun:</span>
                <select
                  className="filter-select"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rekap-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`rekap-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="rekap-table">
            <thead>
              <tr>
                <th className="rekap-sticky-col" style={{ zIndex: 3, minWidth: 160 }}>
                  {activeTab === 'depo' ? 'Depo' : activeTab === 'bengkel' ? 'Bengkel' : 'NoPol'}
                </th>
                {MONTHS.map((m, i) => (
                  <th key={i} style={{ textAlign: 'right', minWidth: 105 }}>{m}</th>
                ))}
                <th style={{ textAlign: 'right', minWidth: 125, background: 'var(--surface3)' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'secondary' ? (
                <>
                  {/* ── TSMK Section ── */}
                  <tr>
                    <td colSpan={14} className="rekap-section-header rekap-section-tsmk">
                      🏭 TSMK — Secondary (AQUA) &amp; Inventaris
                    </td>
                  </tr>
                  {(tableData.tsmk || []).length === 0 ? (
                    <tr><td colSpan={14} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20, fontSize: 12 }}>Belum ada data TSMK</td></tr>
                  ) : (
                    <>
                      {renderRows(tableData.tsmk)}
                      {renderSubtotal('TSMK', tableData.tsmk, 'var(--blue-t)')}
                    </>
                  )}

                  {/* ── TMJA Section ── */}
                  <tr>
                    <td colSpan={14} className="rekap-section-header rekap-section-tmja">
                      📦 TMJA — Secondary (Non-AQUA)
                    </td>
                  </tr>
                  {(tableData.tmja || []).length === 0 ? (
                    <tr><td colSpan={14} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20, fontSize: 12 }}>Belum ada data TMJA</td></tr>
                  ) : (
                    <>
                      {renderRows(tableData.tmja)}
                      {renderSubtotal('TMJA', tableData.tmja, 'var(--teal-t)')}
                    </>
                  )}
                </>
              ) : (
                <>
                  {(tableData.rows || []).length === 0 ? (
                    <tr><td colSpan={14} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32, fontSize: 13 }}>
                      Belum ada data untuk tahun {selectedYear}
                    </td></tr>
                  ) : renderRows(tableData.rows)}
                </>
              )}

              {/* Grand Total */}
              {hasData && (
                <tr className="total-row">
                  <td className="rekap-sticky-col" style={{ background: 'var(--surface2)', fontWeight: 800 }}>
                    GRAND TOTAL
                  </td>
                  {Array.from({ length: 12 }, (_, m) => m + 1).map(m => (
                    <td key={m} className="rekap-cell" style={{ fontWeight: 700 }}>
                      {grandTotals.months[m] ? fmtRp(grandTotals.months[m]) : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                  ))}
                  <td className="rekap-cell rekap-total-col" style={{ fontWeight: 800 }}>
                    {fmtRp(grandTotals.total)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
