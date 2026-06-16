export const API = 'https://script.google.com/macros/s/AKfycbxTjftF_l7CGSb7uTzgoUs6e_Ts40ryO7UcBwV-JQtpV8PhTxWrQrEH3QAaFXkgNdyh/exec';
export const IS_DEMO = API.includes('GANTI_DENGAN_URL');

export async function apiFetch(params) {
  const url = `${API}?` + new URLSearchParams(params);
  const r = await fetch(url);
  return r.json();
}

export async function apiPost(body) {
  const r = await fetch(API, { method: 'POST', body: JSON.stringify(body) });
  return r.json();
}

export function demoData() {
  return Array.from({ length: 32 }, (_, i) => ({
    NO: i + 500,
    NO_PO: String(1000 + i),
    NOPOL: `BM ${1000 + (i*37%8000)} ${['QM','TN','TH','AB','CD','EF'][i%6]}`,
    DRIVER: ['TEGUH','SUPARMIADI','RIAN HIDAYAT','BUDI','SLAMET','JOKO','WAWAN','DEDI'][i%8],
    TGL_PENGAJUAN: `${String(i%28+1).padStart(2,'0')}-Mei-26`,
    DEPO: ['UJUNG BATU','HANGTUAH','PASIR PUTIH','DURI'][i%4],
    BENGKEL: ['Mega Riau','Anugrah Servis','Harapan Motor','Pratama'][i%4],
    JENIS_MOBIL: ['Terbuka L300','Box R4 Long','Kerangkeng R4','Pick Up'][i%4],
    KM: 10000 + (i * 7123 % 300000),
    REASON: 'SERVICE BERKALA / PERBAIKAN KOMPONEN',
    TGL_MASUK: `${String(i%28+1).padStart(2,'0')}-Jun-26`,
    TGL_KELUAR: i%3===0 ? '' : `${String(Math.min(i%28+3,30)).padStart(2,'0')}-Jun-26`,
    KETERANGAN: i%3===0 ? 'PROSES PERBAIKAN' : 'SELESAI',
    TOTAL_BIAYA: i%3===0 ? 0 : 350000 + (i * 134567 % 2500000),
  }));
}

export function demoSummary(rows) {
  let selesai=0, proses=0, pending=0, totalBiaya=0;
  const bengkelCount={}, depoCount={}, bulanCount={};
  rows.forEach(r => {
    const k = String(r.KETERANGAN).toUpperCase();
    let s = 'PENDING';
    if (k.includes('SELESAI')) s = 'SELESAI';
    else if (k.includes('PROSES')) s = 'PROSES';

    if (s==='SELESAI') selesai++; else if (s==='PROSES') proses++; else pending++;
    totalBiaya += r.TOTAL_BIAYA || 0;
    if (r.BENGKEL) bengkelCount[r.BENGKEL] = (bengkelCount[r.BENGKEL]||0)+1;
    if (r.DEPO)    depoCount[r.DEPO]       = (depoCount[r.DEPO]||0)+1;
    const m = parseInt((r.TGL_MASUK||'').split('-')[1]) || (new Date()).getMonth()+1;
    if (!isNaN(m)) bulanCount[m] = (bulanCount[m]||0)+1;
  });
  return { total:rows.length, selesai, proses, pending, totalBiaya, avgLeadtime:3.7, bengkelCount, depoCount, bulanCount };
}