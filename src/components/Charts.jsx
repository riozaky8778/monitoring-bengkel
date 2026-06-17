// Tambahkan 2 baris import ini di paling atas!
import React, { useRef, useEffect } from "react";
import Chart from "chart.js/auto";

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