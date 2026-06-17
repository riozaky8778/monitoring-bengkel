import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { MONTHS } from '../utils/helpers';

export function DonutChart({ selesai, proses, pending }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: ['Selesai','Proses','Pending'],
        datasets: [{
          data: [selesai, proses, pending],
          backgroundColor: ['#56d477','#4f8ef7','#f0c040'],
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        cutout: '72%',
        responsive: false,
        plugins: { legend: { display: false } },
        animation: { animateRotate: true, duration: 800 }
      }
    });
    return () => chartRef.current?.destroy();
  }, [selesai, proses, pending]);

  const total = selesai + proses + pending;

  return (
    <div className="donut-wrap">
      <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
        <canvas ref={ref} width={100} height={100} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', lineHeight:1.3 }}>
          <div style={{ fontSize:22, fontWeight:700 }}>{total}</div>
          <div style={{ fontSize:9, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Total</div>
        </div>
      </div>
      <div className="donut-legend">
        {[['Selesai',selesai,'#56d477'],['Proses',proses,'#4f8ef7'],['Pending',pending,'#f0c040']].map(([label,val,color]) => (
          <div key={label} className="donut-legend-item">
            <div className="donut-legend-label">
              <span className="dot" style={{ background: color }} />
              {label}
            </div>
            <span className="donut-legend-val">
              {val}
              <span style={{ fontSize:10, fontWeight:400, color:'var(--text3)', marginLeft:5 }}>
                ({total>0 ? Math.round(val/total*100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadtimeChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: data.map(d => MONTHS[d.bulan - 1]),
        datasets: [{
          label: 'Avg leadtime (hari)',
          data: data.map(d => d.avg),
          backgroundColor: 'rgba(79,142,247,0.75)',
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw} hari` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#525d6e', font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(99,130,190,0.1)' }, ticks: { color: '#525d6e', font: { size: 11 } } }
        },
        animation: { duration: 900 }
      }
    });
    return () => chartRef.current?.destroy();
  }, [data]);

  return <div style={{ position:'relative', width:'100%', height:180 }}><canvas ref={ref} /></div>;
}

export function DepoChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const COLORS = ['#4f8ef7','#56d477','#f0c040','#f07070','#b490fc','#67e8f9','#ffa07a','#90ee90'];

  useEffect(() => {
    if (!ref.current || !data?.length) return;
    chartRef.current?.destroy();
    
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.depo),
        datasets: [{ 
          data: data.map(d => d.count), 
          backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]), 
          borderWidth: 0, 
          hoverOffset: 6 
        }]
      },
      options: { 
        cutout: '72%', 
        responsive: false, 
        plugins: { legend: { display: false } }, 
        animation: { duration: 800 } 
      }
    });
    
    return () => chartRef.current?.destroy();
  }, [data]);

  const total = data.reduce((s, d) => s + d.count, 0);
  
  return (
    <div className="donut-wrap">
      <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
        <canvas ref={ref} width={100} height={100} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', lineHeight:1.3 }}>
          <div style={{ fontSize:22, fontWeight:700 }}>{total}</div>
          <div style={{ fontSize:9, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Total</div>
        </div>
      </div>
      <div className="donut-legend">
        {data.map(({ depo, count }, i) => (
          <div key={depo} className="donut-legend-item">
            <div className="donut-legend-label">
              <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
              {depo || '—'}
            </div>
            <span className="donut-legend-val">
              {count}
              <span style={{ fontSize:10, color:'var(--text3)', marginLeft:5 }}>
                ({total > 0 ? Math.round(count/total*100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}